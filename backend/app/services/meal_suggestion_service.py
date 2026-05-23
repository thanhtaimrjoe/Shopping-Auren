from datetime import date, timedelta
from typing import Optional

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin as db
from app.models.tables import MEAL_PLAN_ITEMS, MEAL_PLANS, MEALS
from app.services.meal_plan_service import is_monday


def get_suggestions(user_id: str, week_start: Optional[date], limit: int) -> dict:
    if week_start is not None and not is_monday(week_start):
        raise HTTPException(status_code=400, detail="week_start must be a Monday")

    meals_resp = (
        db.table(MEALS)
        .select("id, name, category")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .execute()
    )
    if not meals_resp.data:
        return {"success": True, "data": {"suggestions": [], "total": 0}}

    items_resp = (
        db.table(MEAL_PLAN_ITEMS)
        .select("meal_id, day_of_week, meal_plans!inner(week_start_date, user_id)")
        .eq("meal_plans.user_id", user_id)
        .execute()
    )

    current_week_meal_ids: set[str] = set()
    last_used: dict[str, date] = {}

    for row in items_resp.data or []:
        plan = row.get("meal_plans") or {}
        week_raw = plan.get("week_start_date")
        meal_id = row.get("meal_id")
        if not week_raw or not meal_id:
            continue

        week_start_date = date.fromisoformat(str(week_raw))
        used_on = week_start_date + timedelta(days=int(row["day_of_week"]))

        if week_start is not None and week_start_date == week_start:
            current_week_meal_ids.add(meal_id)

        previous = last_used.get(meal_id)
        if previous is None or used_on > previous:
            last_used[meal_id] = used_on

    suggestions: list[dict] = []
    for meal in meals_resp.data:
        meal_id = meal["id"]
        if meal_id in current_week_meal_ids:
            continue

        used = last_used.get(meal_id)
        suggestions.append({
            "id": meal_id,
            "name": meal["name"],
            "category": meal["category"],
            "last_used_at": used.isoformat() if used else None,
            "never_used": used is None,
        })

    suggestions.sort(
        key=lambda item: (
            not item["never_used"],
            item["last_used_at"] or "1970-01-01",
        )
    )
    limited = suggestions[:limit]

    return {
        "success": True,
        "data": {"suggestions": limited, "total": len(limited)},
    }
