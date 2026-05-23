from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin as db
from app.models.tables import MEAL_PLAN_ITEMS, MEAL_PLANS, PRODUCTS, SHOPPING_ITEMS, SHOPPING_LISTS
from app.schemas.shopping_list import AddItemBody, CheckItemBody, CompleteListBody, GenerateListBody
from app.services.meal_plan_service import PLACEHOLDER_WEEK_START
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
    payload = {
        "id": row["id"],
        "status": row["status"],
        "meal_plan_id": row.get("meal_plan_id"),
        "items": items,
        "total_items": total,
        "checked_items": checked,
        "progress": round(checked / total * 100, 2) if total else 0.0,
        "created_at": row.get("created_at"),
        "completed_at": row.get("completed_at"),
    }
    if row.get("week_from_date"):
        payload["week_from_date"] = row["week_from_date"]
    if row.get("week_to_date"):
        payload["week_to_date"] = row["week_to_date"]
    return payload


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


def build_snapshot(items: list) -> list:
    return [
        {
            "name": item["name"],
            "category": item["category"],
            "is_checked": item["is_checked"],
            "note": item.get("note"),
            "source_type": item.get("source_type"),
        }
        for item in items
    ]


def items_from_snapshot(snapshot: list | None) -> list:
    if not snapshot:
        return []
    return [
        {
            "id": f"snapshot-{index}",
            "name": row.get("name", ""),
            "category": row.get("category", "other"),
            "source_type": row.get("source_type", "manual"),
            "source_id": None,
            "note": row.get("note"),
            "is_checked": bool(row.get("is_checked")),
            "checked_at": None,
            "created_at": None,
        }
        for index, row in enumerate(snapshot)
    ]


def verify_list_owner(list_id: str, user_id: str, include_snapshot: bool = False) -> dict:
    columns = (
        "id, week_start_date, week_from_date, week_to_date, status, meal_plan_id, "
        "created_at, completed_at"
    )
    if include_snapshot:
        columns += ", snapshot_json"
    try:
        resp = (
            db.table(SHOPPING_LISTS)
            .select(columns)
            .eq("id", list_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return resp.data
    except Exception as exc:
        if include_snapshot and "snapshot_json" in str(exc):
            return verify_list_owner(list_id, user_id, include_snapshot=False)
        raise_from_supabase(
            exc,
            not_found_detail="Shopping list not found",
            server_detail=f"Failed to find shopping list: {exc}",
        )


def get_current_list(user_id: str) -> dict:
    resp = (
        db.table(SHOPPING_LISTS)
        .select(
            "id, week_from_date, week_to_date, status, meal_plan_id, created_at, completed_at, "
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

    db.table(SHOPPING_LISTS).delete().eq("user_id", user_id).eq("status", "active").execute()

    sl_resp = db.table(SHOPPING_LISTS).insert({
        "user_id": user_id,
        "meal_plan_id": body.meal_plan_id,
        "week_start_date": PLACEHOLDER_WEEK_START.isoformat(),
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


def complete_list(user_id: str, list_id: str, body: CompleteListBody) -> dict:
    shopping_list = verify_list_owner(list_id, user_id)
    if shopping_list["status"] == "completed":
        raise HTTPException(status_code=409, detail="Shopping list is already completed")

    items = fetch_items(list_id)
    snapshot = build_snapshot(items)
    now = datetime.now(timezone.utc).isoformat()
    update_payload = {
        "status": "completed",
        "completed_at": now,
        "snapshot_json": snapshot,
        "week_from_date": body.week_from_date.isoformat(),
        "week_to_date": body.week_to_date.isoformat(),
        "week_start_date": body.week_from_date.isoformat(),
    }
    try:
        resp = db.table(SHOPPING_LISTS).update(update_payload).eq("id", list_id).execute()
    except Exception:
        fallback_payload = {
            "status": "completed",
            "completed_at": now,
            "week_start_date": body.week_from_date.isoformat(),
        }
        try:
            resp = (
                db.table(SHOPPING_LISTS)
                .update({**fallback_payload, "snapshot_json": snapshot})
                .eq("id", list_id)
                .execute()
            )
        except Exception:
            resp = (
                db.table(SHOPPING_LISTS)
                .update(fallback_payload)
                .eq("id", list_id)
                .execute()
            )
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to complete shopping list")

    updated = resp.data[0]
    return {
        "success": True,
        "data": {"shopping_list": format_list(updated, items)},
        "message": "Shopping list completed successfully",
    }


def get_history(user_id: str, weeks: int) -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)
    resp = (
        db.table(SHOPPING_LISTS)
        .select(
            "id, week_from_date, week_to_date, week_start_date, status, completed_at, "
            "shopping_items(is_checked)"
        )
        .eq("user_id", user_id)
        .eq("status", "completed")
        .gte("completed_at", cutoff.isoformat())
        .order("completed_at", desc=True)
        .execute()
    )

    history: list[dict] = []
    for row in resp.data or []:
        items_raw = row.pop("shopping_items", None) or []
        total_items = len(items_raw)
        checked_items = sum(1 for item in items_raw if item.get("is_checked"))

        week_from = row.get("week_from_date") or row.get("week_start_date")
        week_to = row.get("week_to_date") or week_from
        history.append({
            "id": row["id"],
            "week_from_date": week_from,
            "week_to_date": week_to,
            "status": row["status"],
            "total_items": total_items,
            "checked_items": checked_items,
            "completed_at": row.get("completed_at"),
        })

    return {"success": True, "data": {"history": history, "total": len(history)}}


def get_list_detail(user_id: str, list_id: str) -> dict:
    shopping_list = verify_list_owner(list_id, user_id, include_snapshot=True)
    snapshot = shopping_list.get("snapshot_json")
    if snapshot:
        items = items_from_snapshot(snapshot)
    else:
        items = fetch_items(list_id)

    return {
        "success": True,
        "data": {"shopping_list": format_list(shopping_list, items)},
    }


def delete_item(user_id: str, list_id: str, item_id: str) -> None:
    shopping_list = verify_list_owner(list_id, user_id)
    if shopping_list["status"] == "completed":
        raise HTTPException(status_code=409, detail="Cannot remove items from a completed shopping list")
    db.table(SHOPPING_ITEMS).delete().eq("id", item_id).eq("shopping_list_id", list_id).execute()
