from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin as db
from app.models.tables import MEAL_PLAN_ITEMS, MEAL_PLANS, PRODUCTS, SHOPPING_ITEMS, SHOPPING_LISTS
from app.schemas.shopping_list import AddItemBody, CheckItemBody, GenerateListBody
from app.utils.db_errors import is_not_found, raise_from_supabase
from app.utils.ingredients import normalize_ingredients_list


def format_item(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "source_type": row["source_type"],
        "source_id": row.get("source_id"),
        "note": row.get("note"),
        "is_checked": row["is_checked"],
        "checked_at": row.get("checked_at"),
        "created_at": row.get("created_at"),
    }


def format_list(row: dict, items: list) -> dict:
    checked = sum(1 for item in items if item["is_checked"])
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
        db.table(SHOPPING_ITEMS)
        .select(
            "id, name, category, source_type, source_id, note, is_checked, checked_at, created_at"
        )
        .eq("shopping_list_id", list_id)
        .order("created_at")
        .execute()
    )
    return [format_item(row) for row in resp.data]


def verify_list_owner(list_id: str, user_id: str) -> dict:
    try:
        resp = (
            db.table(SHOPPING_LISTS)
            .select("id, week_start_date, status, meal_plan_id, created_at, completed_at")
            .eq("id", list_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return resp.data
    except Exception as exc:
        raise_from_supabase(
            exc,
            not_found_detail="Shopping list not found",
            server_detail=f"Failed to find shopping list: {exc}",
        )


def get_current_list(user_id: str) -> dict:
    resp = (
        db.table(SHOPPING_LISTS)
        .select(
            "id, week_start_date, status, meal_plan_id, created_at, completed_at, "
            "shopping_items(id, name, category, source_type, source_id, note, "
            "is_checked, checked_at, created_at)"
        )
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="No active shopping list found")

    shopping_list = dict(resp.data[0])
    items_raw = shopping_list.pop("shopping_items", []) or []
    items = [format_item(row) for row in sorted(items_raw, key=lambda row: row.get("created_at") or "")]
    return {"success": True, "data": {"shopping_list": format_list(shopping_list, items)}}


def generate_list(user_id: str, body: GenerateListBody) -> dict:
    try:
        plan_resp = (
            db.table(MEAL_PLANS)
            .select("id, week_start_date, user_id")
            .eq("id", body.meal_plan_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception as exc:
        raise_from_supabase(exc, not_found_detail="Meal plan not found", server_detail=f"Failed to fetch meal plan: {exc}")

    plan = plan_resp.data
    week_start_date = plan["week_start_date"]

    items_resp = (
        db.table(MEAL_PLAN_ITEMS)
        .select("meals!inner(id, name, ingredients)")
        .eq("meal_plan_id", body.meal_plan_id)
        .is_("meals.deleted_at", "null")
        .execute()
    )

    shopping_items_payload: list[dict] = []
    for row in items_resp.data:
        meal = row.get("meals") or {}
        meal_name = meal.get("name", "Unknown meal")
        meal_id = meal.get("id")
        for ingredient in normalize_ingredients_list(meal.get("ingredients")):
            shopping_items_payload.append({
                "name": ingredient,
                "category": "other",
                "source_type": "meal",
                "source_id": meal_id,
                "note": f"Dùng cho món {meal_name}",
                "is_checked": False,
            })

    if body.product_ids:
        products_resp = (
            db.table(PRODUCTS)
            .select("id, name, category")
            .in_("id", body.product_ids)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        for product in products_resp.data:
            shopping_items_payload.append({
                "name": product["name"],
                "category": product["category"],
                "source_type": "product",
                "source_id": product["id"],
                "note": "Mua thêm",
                "is_checked": False,
            })

    db.table(SHOPPING_LISTS).delete().eq("user_id", user_id).eq("week_start_date", week_start_date).execute()

    sl_resp = db.table(SHOPPING_LISTS).insert({
        "user_id": user_id,
        "meal_plan_id": body.meal_plan_id,
        "week_start_date": week_start_date,
        "status": "active",
    }).execute()
    if not sl_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create new shopping list")

    shopping_list = sl_resp.data[0]
    list_id = shopping_list["id"]
    if shopping_items_payload:
        for item in shopping_items_payload:
            item["shopping_list_id"] = list_id
        db.table(SHOPPING_ITEMS).insert(shopping_items_payload).execute()

    items = fetch_items(list_id)
    return {
        "success": True,
        "data": {"shopping_list": format_list(shopping_list, items)},
        "message": "Shopping list generated successfully",
    }


def check_item(user_id: str, list_id: str, item_id: str, body: CheckItemBody) -> dict:
    verify_list_owner(list_id, user_id)
    try:
        db.table(SHOPPING_ITEMS).select("id").eq("id", item_id).eq("shopping_list_id", list_id).single().execute()
    except Exception as exc:
        raise_from_supabase(exc, not_found_detail="Item not found", server_detail=f"Failed to find item: {exc}")

    now = datetime.now(timezone.utc).isoformat()
    updated = (
        db.table(SHOPPING_ITEMS)
        .update({"is_checked": body.is_checked, "checked_at": now if body.is_checked else None})
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


def add_item(user_id: str, list_id: str, body: AddItemBody) -> dict:
    shopping_list = verify_list_owner(list_id, user_id)
    if shopping_list["status"] == "completed":
        raise HTTPException(status_code=409, detail="Cannot add items to a completed shopping list")

    resp = db.table(SHOPPING_ITEMS).insert({
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


def complete_list(user_id: str, list_id: str) -> dict:
    shopping_list = verify_list_owner(list_id, user_id)
    if shopping_list["status"] == "completed":
        raise HTTPException(status_code=409, detail="Shopping list is already completed")

    now = datetime.now(timezone.utc).isoformat()
    resp = (
        db.table(SHOPPING_LISTS)
        .update({"status": "completed", "completed_at": now})
        .eq("id", list_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to complete shopping list")

    updated = resp.data[0]
    items = fetch_items(list_id)
    return {
        "success": True,
        "data": {"shopping_list": format_list(updated, items)},
        "message": "Shopping list completed successfully",
    }


def delete_item(user_id: str, list_id: str, item_id: str) -> None:
    shopping_list = verify_list_owner(list_id, user_id)
    if shopping_list["status"] == "completed":
        raise HTTPException(status_code=409, detail="Cannot remove items from a completed shopping list")
    db.table(SHOPPING_ITEMS).delete().eq("id", item_id).eq("shopping_list_id", list_id).execute()
