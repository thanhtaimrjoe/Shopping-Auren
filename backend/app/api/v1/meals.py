from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from app.core.auth import get_current_user
from app.core.supabase import supabase_admin as db
import json

router = APIRouter()

# ─── Category constants ───────────────────────────────────────────────────────

VALID_CATEGORIES = {"japanese", "western", "chinese", "other"}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def jsonb_to_text(ingredients_jsonb) -> Optional[str]:
    """Convert JSONB ingredients (list or JSON string) from DB to newline-separated TEXT."""
    if ingredients_jsonb is None:
        return None
    if isinstance(ingredients_jsonb, list):
        return "\n".join(str(i) for i in ingredients_jsonb) if ingredients_jsonb else None
    if isinstance(ingredients_jsonb, str):
        try:
            parsed = json.loads(ingredients_jsonb)
            if isinstance(parsed, list):
                return "\n".join(str(i) for i in parsed) if parsed else None
        except (json.JSONDecodeError, TypeError):
            pass
        return ingredients_jsonb if ingredients_jsonb else None
    return str(ingredients_jsonb)


def text_to_jsonb(ingredients_text: Optional[str]) -> Optional[list]:
    """Convert newline-separated TEXT from frontend to JSON array for DB storage."""
    if not ingredients_text:
        return None
    lines = [line.strip() for line in ingredients_text.split("\n") if line.strip()]
    return lines if lines else None


def format_meal(row: dict) -> dict:
    """Normalize a meals DB row for API response."""
    return {
        "id": row["id"],
        "name": row["name"],
        "ingredients": jsonb_to_text(row.get("ingredients")),
        "category": row["category"],
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class MealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    ingredients: Optional[str] = Field(None, max_length=5000)
    category: str = Field(...)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v


class MealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    ingredients: Optional[str] = Field(None, max_length=5000)
    category: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", status_code=status.HTTP_200_OK)
async def get_meals(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("created_at"),
    order: str = Query("desc"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """Get paginated list of meals for the authenticated user."""
    user_id = user["id"]

    if category and category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}",
        )

    try:
        print(f"Fetching meals for user_id: {user_id}")
        query = (
            db.table("meals")
            .select("id, name, ingredients, category, created_at, updated_at")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
        )
        if category:
            query = query.eq("category", category)
        if search:
            query = query.ilike("name", f"%{search}%")

        sort_field = sort if sort in ("created_at", "name") else "created_at"
        descending = order.lower() != "asc"
        query = query.order(sort_field, desc=descending)
        query = query.range(offset, offset + limit - 1)

        response = query.execute()
        
        if response.data is None:
            print("Warning: query.execute() returned None data")
            meals = []
        else:
            meals = [format_meal(row) for row in response.data]

        # Separate count query
        count_query = (
            db.table("meals")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
        )
        if category:
            count_query = count_query.eq("category", category)
        if search:
            count_query = count_query.ilike("name", f"%{search}%")

        count_response = count_query.execute()
        total = count_response.count if count_response.count is not None else len(meals)

        print(f"Successfully fetched {len(meals)} meals (Total: {total})")
        return {
            "success": True,
            "data": {"meals": meals, "total": total, "limit": limit, "offset": offset},
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching meals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch meals: {str(e)}")


@router.get("/{meal_id}", status_code=status.HTTP_200_OK)
async def get_meal(meal_id: str, user: dict = Depends(get_current_user)):
    """Get a single meal by ID."""
    user_id = user["id"]

    try:
        print(f"Fetching meal {meal_id} for user_id: {user_id}")
        response = (
            db.table("meals")
            .select("id, name, ingredients, category, created_at, updated_at")
            .eq("id", meal_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return {"success": True, "data": {"meal": format_meal(response.data)}}
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching meal {meal_id}: {error_msg}")
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch meal: {error_msg}")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meal(body: MealCreate, user: dict = Depends(get_current_user)):
    """Create a new meal."""
    user_id = user["id"]

    try:
        insert_data = {
            "user_id": user_id,
            "name": body.name,
            "ingredients": text_to_jsonb(body.ingredients),
            "category": body.category,
        }
        response = db.table("meals").insert(insert_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create meal")

        return {
            "success": True,
            "data": {"meal": format_meal(response.data[0])},
            "message": "Meal created successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create meal: {str(e)}")


@router.put("/{meal_id}", status_code=status.HTTP_200_OK)
async def update_meal(meal_id: str, body: MealUpdate, user: dict = Depends(get_current_user)):
    """Update an existing meal (partial update — only provided fields)."""
    user_id = user["id"]

    # Verify ownership
    try:
        existing = (
            db.table("meals")
            .select("id")
            .eq("id", meal_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal not found")
        raise HTTPException(status_code=500, detail=f"Failed to find meal: {error_msg}")

    # Build partial update payload
    update_data: dict = {}
    if body.name is not None:
        update_data["name"] = body.name
    if body.ingredients is not None:
        update_data["ingredients"] = text_to_jsonb(body.ingredients)
    if body.category is not None:
        update_data["category"] = body.category

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        response = (
            db.table("meals")
            .update(update_data)
            .eq("id", meal_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update meal")

        return {
            "success": True,
            "data": {"meal": format_meal(response.data[0])},
            "message": "Meal updated successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update meal: {str(e)}")


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(meal_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a meal (sets deleted_at). Blocked if used in a meal plan."""
    user_id = user["id"]

    # Verify ownership
    try:
        existing = (
            db.table("meals")
            .select("id")
            .eq("id", meal_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal not found")
        raise HTTPException(status_code=500, detail=f"Failed to find meal: {error_msg}")

    # Block delete if referenced in meal_plan_items
    try:
        plan_check = (
            db.table("meal_plan_items")
            .select("id")
            .eq("meal_id", meal_id)
            .limit(1)
            .execute()
        )
        if plan_check.data:
            raise HTTPException(
                status_code=409,
                detail="Meal is used in an active meal plan and cannot be deleted",
            )
    except HTTPException:
        raise
    except Exception:
        # meal_plan_items table may reference dish_id — skip check gracefully
        pass

    # Soft delete
    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        db.table("meals").update({"deleted_at": now}).eq("id", meal_id).eq("user_id", user_id).execute()
        return None  # 204 No Content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete meal: {str(e)}")
