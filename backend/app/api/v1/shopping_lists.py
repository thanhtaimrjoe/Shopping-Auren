from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from app.core.auth import get_current_user
from app.core.supabase import supabase_admin as db

router = APIRouter()

# ─── Helpers ─────────────────────────────────────────────────────────────────

VALID_ITEM_CATEGORIES = {
    "vegetables", "meat", "seafood", "dairy", "grains",
    "condiments", "frozen", "daily", "consumable", "other"
}


def format_item(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "source_type": row["source_type"],
        "source_id": row.get("source_id"),
        "is_checked": row["is_checked"],
        "checked_at": row.get("checked_at"),
        "created_at": row.get("created_at"),
    }


def format_list(row: dict, items: list) -> dict:
    checked = sum(1 for i in items if i["is_checked"])
    total = len(items)
    return {
        "id": row["id"],
        "week_start_date": row["week_start_date"],
        "status": row["status"],
        "meal_plan_id": row.get("meal_plan_id"),
        "items": items,
        "total_items": total,
        "checked_items": checked,
        "progress": round(checked / total * 100, 2) if total else 0.0,
        "created_at": row.get("created_at"),
        "completed_at": row.get("completed_at"),
    }


def fetch_items(list_id: str) -> list:
    resp = (
        db.table("shopping_items")
        .select("id, name, category, source_type, source_id, is_checked, checked_at, created_at")
        .eq("shopping_list_id", list_id)
        .order("created_at")
        .execute()
    )
    return [format_item(r) for r in resp.data]


def verify_list_owner(list_id: str, user_id: str) -> dict:
    """Fetch shopping list and verify ownership. Raises 404 if not found."""
    try:
        resp = (
            db.table("shopping_lists")
            .select("id, week_start_date, status, meal_plan_id, created_at, completed_at")
            .eq("id", list_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return resp.data
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Shopping list not found")
        raise HTTPException(status_code=500, detail=f"Failed to find shopping list: {error_msg}")


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class GenerateListBody(BaseModel):
    meal_plan_id: str = Field(...)
    product_ids: List[str] = Field(default_factory=list)


class AddItemBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="other")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_ITEM_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_ITEM_CATEGORIES))}")
        return v


class CheckItemBody(BaseModel):
    is_checked: bool


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/current", status_code=status.HTTP_200_OK)
async def get_current_list(user: dict = Depends(get_current_user)):
    """Get the latest active shopping list for the authenticated user."""
    user_id = user["id"]

    try:
        resp = (
            db.table("shopping_lists")
            .select("id, week_start_date, status, meal_plan_id, created_at, completed_at")
            .eq("user_id", user_id)
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch shopping list: {str(e)}")

    if not resp.data:
        raise HTTPException(status_code=404, detail="No active shopping list found")

    sl = resp.data[0]
    items = fetch_items(sl["id"])

    return {"success": True, "data": {"shopping_list": format_list(sl, items)}}


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_list(body: GenerateListBody, user: dict = Depends(get_current_user)):
    """
    Generate a shopping list from a meal plan.
    - Extracts ingredients from all meals in the plan (deduped).
    - Appends any extra products by product_ids.
    - Blocks if an active list already exists for the same week.
    """
    user_id = user["id"]

    # Fetch meal plan + verify ownership
    try:
        plan_resp = (
            db.table("meal_plans")
            .select("id, week_start_date, user_id")
            .eq("id", body.meal_plan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch meal plan: {error_msg}")

    plan = plan_resp.data
    week_start_date = plan["week_start_date"]

    # Block duplicate active list for the same week
    existing = (
        db.table("shopping_lists")
        .select("id")
        .eq("user_id", user_id)
        .eq("week_start_date", week_start_date)
        .eq("status", "active")
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Active shopping list already exists for this week")

    # Fetch meal_plan_items with ingredients
    items_resp = (
        db.table("meal_plan_items")
        .select("meals(id, ingredients)")
        .eq("meal_plan_id", body.meal_plan_id)
        .execute()
    )

    # Parse ingredients from each meal (JSONB list), deduplicate
    seen: set = set()
    shopping_items_payload: list = []

    for row in items_resp.data:
        meal = row.get("meals") or {}
        ingredients = meal.get("ingredients") or []
        if isinstance(ingredients, str):
            import json
            try:
                ingredients = json.loads(ingredients)
            except Exception:
                ingredients = [i.strip() for i in ingredients.split("\n") if i.strip()]

        meal_id = meal.get("id")
        for ingredient in ingredients:
            ingredient = str(ingredient).strip()
            if not ingredient:
                continue
            key = ingredient.lower()
            if key not in seen:
                seen.add(key)
                shopping_items_payload.append({
                    "name": ingredient,
                    "category": "other",
                    "source_type": "meal",
                    "source_id": meal_id,
                    "is_checked": False,
                })

    # Add products
    if body.product_ids:
        products_resp = (
            db.table("products")
            .select("id, name, category")
            .in_("id", body.product_ids)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        for p in products_resp.data:
            key = p["name"].lower()
            if key not in seen:
                seen.add(key)
                shopping_items_payload.append({
                    "name": p["name"],
                    "category": p["category"],
                    "source_type": "product",
                    "source_id": p["id"],
                    "is_checked": False,
                })

    try:
        # Create shopping list
        sl_resp = db.table("shopping_lists").insert({
            "user_id": user_id,
            "meal_plan_id": body.meal_plan_id,
            "week_start_date": week_start_date,
            "status": "active",
        }).execute()

        sl = sl_resp.data[0]
        list_id = sl["id"]

        # Insert items
        if shopping_items_payload:
            for item in shopping_items_payload:
                item["shopping_list_id"] = list_id
            db.table("shopping_items").insert(shopping_items_payload).execute()

        items = fetch_items(list_id)

        return {
            "success": True,
            "data": {"shopping_list": format_list(sl, items)},
            "message": "Shopping list generated successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate shopping list: {str(e)}")


@router.patch("/{list_id}/items/{item_id}", status_code=status.HTTP_200_OK)
async def check_item(
    list_id: str,
    item_id: str,
    body: CheckItemBody,
    user: dict = Depends(get_current_user),
):
    """Toggle checked state of a shopping item."""
    user_id = user["id"]

    verify_list_owner(list_id, user_id)

    # Fetch item
    try:
        item_resp = (
            db.table("shopping_items")
            .select("id")
            .eq("id", item_id)
            .eq("shopping_list_id", list_id)
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Item not found")
        raise HTTPException(status_code=500, detail=f"Failed to find item: {error_msg}")

    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "is_checked": body.is_checked,
        "checked_at": now if body.is_checked else None,
    }

    try:
        updated = (
            db.table("shopping_items")
            .update(update_data)
            .eq("id", item_id)
            .execute()
        )

        if not updated.data:
            raise HTTPException(status_code=500, detail="Failed to update item")

        return {
            "success": True,
            "data": {"item": format_item(updated.data[0])},
            "message": "Item updated successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")


@router.post("/{list_id}/items", status_code=status.HTTP_201_CREATED)
async def add_item(
    list_id: str,
    body: AddItemBody,
    user: dict = Depends(get_current_user),
):
    """Manually add an item to a shopping list."""
    user_id = user["id"]

    sl = verify_list_owner(list_id, user_id)

    if sl["status"] == "completed":
        raise HTTPException(status_code=409, detail="Cannot add items to a completed shopping list")

    try:
        resp = db.table("shopping_items").insert({
            "shopping_list_id": list_id,
            "name": body.name,
            "category": body.category,
            "source_type": "manual",
            "is_checked": False,
        }).execute()

        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to add item")

        return {
            "success": True,
            "data": {"item": format_item(resp.data[0])},
            "message": "Item added successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add item: {str(e)}")


@router.post("/{list_id}/complete", status_code=status.HTTP_200_OK)
async def complete_list(list_id: str, user: dict = Depends(get_current_user)):
    """Mark a shopping list as completed."""
    user_id = user["id"]

    sl = verify_list_owner(list_id, user_id)

    if sl["status"] == "completed":
        raise HTTPException(status_code=409, detail="Shopping list is already completed")

    try:
        now = datetime.now(timezone.utc).isoformat()
        resp = (
            db.table("shopping_lists")
            .update({"status": "completed", "completed_at": now})
            .eq("id", list_id)
            .execute()
        )

        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to complete shopping list")

        updated_sl = resp.data[0]
        items = fetch_items(list_id)

        return {
            "success": True,
            "data": {"shopping_list": format_list(updated_sl, items)},
            "message": "Shopping list completed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete shopping list: {str(e)}")
