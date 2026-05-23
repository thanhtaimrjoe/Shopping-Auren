from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin as db
from app.models.tables import MEAL_PLAN_ITEMS, MEAL_PLANS, MEALS
from app.schemas.meal_plan import MealPlanCreate, MealPlanUpdate
from app.utils.db_errors import is_not_found, raise_from_supabase
from app.utils.ingredients import jsonb_to_text


def is_monday(value: date) -> bool:
    return value.weekday() == 0


def format_meal_plan(plan: dict, items: list) -> dict:
    return {
        "id": plan["id"],
        "week_start_date": plan["week_start_date"],
        "status": plan["status"],
        "meals": items,
        "created_at": plan["created_at"],
        "updated_at": plan["updated_at"],
    }


def format_plan_item(row: dict) -> dict:
    meal_data = row.get("meals")
    meal: dict = {}
    if isinstance(meal_data, list) and meal_data:
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
            "ingredients": jsonb_to_text(meal.get("ingredients")),
        }
        if meal
        else None,
    }


def fetch_plan_items(plan_id: str) -> list:
    resp = (
        db.table(MEAL_PLAN_ITEMS)
        .select("id, day_of_week, meals(id, name, category, ingredients)")
        .eq("meal_plan_id", plan_id)
        .order("day_of_week")
        .execute()
    )
    return [format_plan_item(row) for row in resp.data]


def get_current_plan(user_id: str, week_start: Optional[date]) -> dict:
    if week_start is None:
        today = date.today()
        days_until_monday = (7 - today.weekday()) % 7 or 7
        week_start = date.fromordinal(today.toordinal() + days_until_monday)

    if not is_monday(week_start):
        raise HTTPException(status_code=400, detail="week_start must be a Monday")

    try:
        response = (
            db.table(MEAL_PLANS)
            .select(
                "id, week_start_date, status, created_at, updated_at, "
                "meal_plan_items(id, day_of_week, meals(id, name, category, ingredients))"
            )
            .eq("user_id", user_id)
            .eq("week_start_date", week_start.isoformat())
            .single()
            .execute()
        )
    except Exception as exc:
        raise_from_supabase(
            exc,
            not_found_detail="Meal plan not found for this week",
            server_detail=f"Failed to fetch meal plan: {exc}",
        )

    plan = dict(response.data)
    items_raw = plan.pop("meal_plan_items", []) or []
    items = [
        format_plan_item(row)
        for row in sorted(items_raw, key=lambda row: row.get("day_of_week", 0))
    ]
    return {"success": True, "data": {"meal_plan": format_meal_plan(plan, items)}}


def create_meal_plan(user_id: str, body: MealPlanCreate) -> dict:
    try:
        existing = (
            db.table(MEAL_PLANS)
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
    except Exception as exc:
        if not is_not_found(exc):
            raise HTTPException(status_code=500, detail=f"Failed to check existing plan: {exc}")

    _validate_meal_ids(user_id, body.meals)

    plan_resp = db.table(MEAL_PLANS).insert({
        "user_id": user_id,
        "week_start_date": body.week_start_date.isoformat(),
        "status": "draft",
    }).execute()
    plan = plan_resp.data[0]
    plan_id = plan["id"]

    if body.meals:
        items_payload = [
            {"meal_plan_id": plan_id, "meal_id": m.meal_id, "day_of_week": m.day_of_week}
            for m in body.meals
        ]
        db.table(MEAL_PLAN_ITEMS).insert(items_payload).execute()

    items = fetch_plan_items(plan_id)
    return {
        "success": True,
        "data": {"meal_plan": format_meal_plan(plan, items)},
        "message": "Meal plan created successfully",
    }


def update_meal_plan(user_id: str, plan_id: str, body: MealPlanUpdate) -> dict:
    plan = _get_owned_plan(user_id, plan_id)
    _validate_meal_ids(user_id, body.meals)

    db.table(MEAL_PLAN_ITEMS).delete().eq("meal_plan_id", plan_id).execute()
    if body.meals:
        items_payload = [
            {"meal_plan_id": plan_id, "meal_id": m.meal_id, "day_of_week": m.day_of_week}
            for m in body.meals
        ]
        res = db.table(MEAL_PLAN_ITEMS).insert(items_payload).execute()
        if not res.data and items_payload:
            raise HTTPException(status_code=500, detail="Failed to insert meal plan items")

    now = datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0).isoformat()
    db.table(MEAL_PLANS).update({"updated_at": now}).eq("id", plan_id).execute()
    plan["updated_at"] = now

    items = fetch_plan_items(plan_id)
    return {
        "success": True,
        "data": {"meal_plan": format_meal_plan(plan, items)},
        "message": "Meal plan updated successfully",
    }


def delete_meal_plan(user_id: str, plan_id: str) -> None:
    _get_owned_plan(user_id, plan_id)
    db.table(MEAL_PLANS).delete().eq("id", plan_id).eq("user_id", user_id).execute()


def _get_owned_plan(user_id: str, plan_id: str) -> dict:
    try:
        plan_resp = (
            db.table(MEAL_PLANS)
            .select("id, week_start_date, status, created_at, updated_at")
            .eq("id", plan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return plan_resp.data
    except Exception as exc:
        raise_from_supabase(exc, not_found_detail="Meal plan not found", server_detail=f"Failed to find meal plan: {exc}")


def _validate_meal_ids(user_id: str, meals: list) -> None:
    if not meals:
        return
    meal_ids = list({m.meal_id for m in meals})
    meals_check = (
        db.table(MEALS)
        .select("id")
        .in_("id", meal_ids)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )
    found_ids = {row["id"] for row in meals_check.data}
    missing = set(meal_ids) - found_ids
    if missing:
        raise HTTPException(status_code=422, detail=f"Meal IDs not found: {', '.join(missing)}")
