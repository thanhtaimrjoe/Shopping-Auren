from typing import Optional, List
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator, model_validator
from app.core.auth import get_current_user
from app.core.supabase import supabase_admin as db

router = APIRouter()

# ─── Helpers ─────────────────────────────────────────────────────────────────

def is_monday(d: date) -> bool:
    """Check if date is Monday (weekday 0)."""
    return d.weekday() == 0


def format_meal_plan(plan: dict, items: list) -> dict:
    """Build meal plan response with nested meals."""
    return {
        "id": plan["id"],
        "week_start_date": plan["week_start_date"],
        "status": plan["status"],
        "meals": items,
        "created_at": plan["created_at"],
        "updated_at": plan["updated_at"],
    }


def format_plan_item(row: dict) -> dict:
    """Format a meal_plan_items row with nested meal info."""
    meal_data = row.get("meals")
    # Postgrest might return a list for joined tables even if 1:1
    meal = {}
    if isinstance(meal_data, list) and len(meal_data) > 0:
        meal = meal_data[0]
    elif isinstance(meal_data, dict):
        meal = meal_data

    return {
        "id": row["id"],
        "day_of_week": row["day_of_week"],
        "meal": {
            "id": meal.get("id"),
            "name": meal.get("name"),
            "category": meal.get("category"),
            "ingredients": meal.get("ingredients"),
        } if meal else None,
    }


def fetch_plan_items(plan_id: str) -> list:
    """Fetch all items for a meal plan with joined meal info."""
    resp = (
        db.table("meal_plan_items")
        .select("id, day_of_week, meals(id, name, category, ingredients)")
        .eq("meal_plan_id", plan_id)
        .order("day_of_week")
        .execute()
    )
    return [format_plan_item(r) for r in resp.data]


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class MealPlanItemInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    meal_id: str = Field(...)

class MealPlanCreate(BaseModel):
    week_start_date: date = Field(...)
    meals: List[MealPlanItemInput] = Field(default_factory=list)

    @field_validator("week_start_date")
    @classmethod
    def validate_monday(cls, v: date) -> date:
        if not is_monday(v):
            raise ValueError("week_start_date must be a Monday")
        return v

    @model_validator(mode="after")
    def validate_daily_limit(self):
        counts: dict[int, int] = {}
        for meal in self.meals:
            counts[meal.day_of_week] = counts.get(meal.day_of_week, 0) + 1
            if counts[meal.day_of_week] > 3:
                raise ValueError("Each day can contain at most 3 meals")
        return self


class MealPlanUpdate(BaseModel):
    meals: List[MealPlanItemInput] = Field(...)

    @model_validator(mode="after")
    def validate_daily_limit(self):
        counts: dict[int, int] = {}
        for meal in self.meals:
            counts[meal.day_of_week] = counts.get(meal.day_of_week, 0) + 1
            if counts[meal.day_of_week] > 3:
                raise ValueError("Each day can contain at most 3 meals")
        return self


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/current", status_code=status.HTTP_200_OK)
async def get_current_plan(
    week_start: Optional[date] = Query(None, description="Week start date (YYYY-MM-DD, must be Monday)"),
    user: dict = Depends(get_current_user),
):
    """Get meal plan for a given week (defaults to next Monday if not provided)."""
    user_id = user["id"]

    if week_start is None:
        # Default: next Monday
        today = date.today()
        days_until_monday = (7 - today.weekday()) % 7 or 7
        week_start = date.fromordinal(today.toordinal() + days_until_monday)

    if not is_monday(week_start):
        raise HTTPException(status_code=400, detail="week_start must be a Monday")

    try:
        response = (
            db.table("meal_plans")
            .select(
                "id, week_start_date, status, created_at, updated_at, "
                "meal_plan_items(id, day_of_week, meals(id, name, category, ingredients))"
            )
            .eq("user_id", user_id)
            .eq("week_start_date", week_start.isoformat())
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal plan not found for this week")
        raise HTTPException(status_code=500, detail=f"Failed to fetch meal plan: {error_msg}")

    plan = dict(response.data)
    items_raw = plan.pop("meal_plan_items", []) or []
    items = [
        format_plan_item(row)
        for row in sorted(items_raw, key=lambda row: row.get("day_of_week", 0))
    ]

    return {"success": True, "data": {"meal_plan": format_meal_plan(plan, items)}}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meal_plan(body: MealPlanCreate, user: dict = Depends(get_current_user)):
    """Create a new weekly meal plan."""
    user_id = user["id"]

    # Check duplicate
    try:
        existing = (
            db.table("meal_plans")
            .select("id")
            .eq("user_id", user_id)
            .eq("week_start_date", body.week_start_date.isoformat())
            .single()
            .execute()
        )
        if existing.data:
            raise HTTPException(status_code=409, detail="Meal plan already exists for this week")
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # PGRST116 = no rows found → OK to proceed
        if "PGRST116" not in error_msg and "Results contain 0 rows" not in error_msg:
            raise HTTPException(status_code=500, detail=f"Failed to check existing plan: {error_msg}")

    # Validate all meal_ids belong to this user
    if body.meals:
        meal_ids = list({m.meal_id for m in body.meals})
        meals_check = (
            db.table("meals")
            .select("id")
            .in_("id", meal_ids)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        found_ids = {r["id"] for r in meals_check.data}
        missing = set(meal_ids) - found_ids
        if missing:
            raise HTTPException(status_code=422, detail=f"Meal IDs not found: {', '.join(missing)}")

    try:
        # Create plan
        plan_resp = db.table("meal_plans").insert({
            "user_id": user_id,
            "week_start_date": body.week_start_date.isoformat(),
            "status": "draft",
        }).execute()

        plan = plan_resp.data[0]
        plan_id = plan["id"]

        # Insert items
        if body.meals:
            items_payload = [
                {
                    "meal_plan_id": plan_id,
                    "meal_id": m.meal_id,
                    "day_of_week": m.day_of_week,
                }
                for m in body.meals
            ]
            db.table("meal_plan_items").insert(items_payload).execute()

        items = fetch_plan_items(plan_id)

        return {
            "success": True,
            "data": {"meal_plan": format_meal_plan(plan, items)},
            "message": "Meal plan created successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create meal plan: {str(e)}")


@router.put("/{plan_id}", status_code=status.HTTP_200_OK)
async def update_meal_plan(
    plan_id: str,
    body: MealPlanUpdate,
    user: dict = Depends(get_current_user),
):
    """Replace all meals in an existing meal plan."""
    user_id = user["id"]

    # Verify ownership
    try:
        plan_resp = (
            db.table("meal_plans")
            .select("id, week_start_date, status, created_at, updated_at")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        raise HTTPException(status_code=500, detail=f"Failed to find meal plan: {error_msg}")

    plan = plan_resp.data

    # Validate meal_ids
    if body.meals:
        meal_ids = list({m.meal_id for m in body.meals})
        meals_check = (
            db.table("meals")
            .select("id")
            .in_("id", meal_ids)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        found_ids = {r["id"] for r in meals_check.data}
        missing = set(meal_ids) - found_ids
        if missing:
            raise HTTPException(status_code=422, detail=f"Meal IDs not found: {', '.join(missing)}")

    try:
        # Delete existing items then re-insert (replace strategy)
        # We need to make sure we only delete items belonging to this plan
        db.table("meal_plan_items").delete().eq("meal_plan_id", plan_id).execute()

        if body.meals:
            items_payload = [
                {
                    "meal_plan_id": plan_id,
                    "meal_id": m.meal_id,
                    "day_of_week": m.day_of_week,
                }
                for m in body.meals
            ]
            # Use insert().execute() and check for data
            res = db.table("meal_plan_items").insert(items_payload).execute()
            if not res.data and len(items_payload) > 0:
                 raise Exception("Failed to insert meal plan items")

        # Touch updated_at on plan
        now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0).isoformat()
        db.table("meal_plans").update({"updated_at": now}).eq("id", plan_id).execute()
        plan["updated_at"] = now

        items = fetch_plan_items(plan_id)

        return {
            "success": True,
            "data": {"meal_plan": format_meal_plan(plan, items)},
            "message": "Meal plan updated successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update meal plan: {str(e)}")


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal_plan(plan_id: str, user: dict = Depends(get_current_user)):
    """Delete a meal plan (hard delete — cascades to meal_plan_items)."""
    user_id = user["id"]

    try:
        existing = (
            db.table("meal_plans")
            .select("id")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        raise HTTPException(status_code=500, detail=f"Failed to find meal plan: {error_msg}")

    try:
        db.table("meal_plans").delete().eq("id", plan_id).eq("user_id", user_id).execute()
        return None

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete meal plan: {str(e)}")
