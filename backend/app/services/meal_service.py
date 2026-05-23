from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin as db
from app.models.tables import MEAL_PLAN_ITEMS, MEALS
from app.schemas.meal import MealCreate, MealUpdate, VALID_MEAL_CATEGORIES
from app.utils.db_errors import is_duplicate_name, is_not_found, raise_from_supabase
from app.utils.ingredients import jsonb_to_text, text_to_jsonb

_MEAL_COLUMNS = "id, name, ingredients, category, created_at, updated_at"


def format_meal(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "ingredients": jsonb_to_text(row.get("ingredients")),
        "category": row["category"],
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def list_meals(
    user_id: str,
    *,
    category: Optional[str],
    search: Optional[str],
    sort: str,
    order: str,
    limit: int,
    offset: int,
) -> dict:
    if category and category not in VALID_MEAL_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(sorted(VALID_MEAL_CATEGORIES))}",
        )

    query = (
        db.table(MEALS)
        .select(_MEAL_COLUMNS, count="exact")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
    )
    if category:
        query = query.eq("category", category)
    if search:
        query = query.ilike("name", f"%{search}%")

    sort_field = sort if sort in ("created_at", "name") else "created_at"
    query = query.order(sort_field, desc=order.lower() != "asc")
    query = query.range(offset, offset + limit - 1)

    response = query.execute()
    meals = [format_meal(row) for row in (response.data or [])]
    total = response.count if response.count is not None else len(meals)
    return {
        "success": True,
        "data": {"meals": meals, "total": total, "limit": limit, "offset": offset},
    }


def get_meal(user_id: str, meal_id: str) -> dict:
    try:
        response = (
            db.table(MEALS)
            .select(_MEAL_COLUMNS)
            .eq("id", meal_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
        return {"success": True, "data": {"meal": format_meal(response.data)}}
    except Exception as exc:
        raise_from_supabase(exc, not_found_detail="Meal not found", server_detail=f"Failed to fetch meal: {exc}")


def create_meal(user_id: str, body: MealCreate) -> dict:
    insert_data = {
        "user_id": user_id,
        "name": body.name,
        "ingredients": text_to_jsonb(body.ingredients),
        "category": body.category,
    }
    try:
        response = db.table(MEALS).insert(insert_data).execute()
    except Exception as exc:
        if is_duplicate_name(exc, "meals_name_unique_idx"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A meal with the name '{body.name}' already exists. Please use a different name.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to create meal: {exc}")

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create meal")
    return {
        "success": True,
        "data": {"meal": format_meal(response.data[0])},
        "message": "Meal created successfully",
    }


def update_meal(user_id: str, meal_id: str, body: MealUpdate) -> dict:
    _assert_meal_owned(user_id, meal_id)

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
        response = db.table(MEALS).update(update_data).eq("id", meal_id).eq("user_id", user_id).execute()
    except Exception as exc:
        if is_duplicate_name(exc, "meals_name_unique_idx"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A meal with the name '{body.name}' already exists. Please use a different name.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to update meal: {exc}")

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update meal")
    return {
        "success": True,
        "data": {"meal": format_meal(response.data[0])},
        "message": "Meal updated successfully",
    }


def delete_meal(user_id: str, meal_id: str) -> None:
    _assert_meal_owned(user_id, meal_id)

    plan_check = (
        db.table(MEAL_PLAN_ITEMS)
        .select("id")
        .eq("meal_id", meal_id)
        .limit(1)
        .execute()
    )
    if plan_check.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Meal is used in an active meal plan and cannot be deleted",
        )

    now = datetime.now(timezone.utc).isoformat()
    db.table(MEALS).update({"deleted_at": now}).eq("id", meal_id).eq("user_id", user_id).execute()


def _assert_meal_owned(user_id: str, meal_id: str) -> None:
    try:
        db.table(MEALS).select("id").eq("id", meal_id).eq("user_id", user_id).is_(
            "deleted_at", "null"
        ).single().execute()
    except Exception as exc:
        if is_not_found(exc):
            raise HTTPException(status_code=404, detail="Meal not found")
        raise HTTPException(status_code=500, detail=f"Failed to find meal: {exc}")
