from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.supabase import supabase_admin as db
from app.models.tables import PRODUCTS
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.db_errors import is_duplicate_name, is_not_found, raise_from_supabase

_PRODUCT_COLUMNS = "id, name, image_url, created_at, updated_at"


def format_product(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "image_url": row.get("image_url"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def list_products(user_id: str, *, search: Optional[str]) -> dict:
    query = (
        db.table(PRODUCTS)
        .select(_PRODUCT_COLUMNS)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
    )
    if search:
        query = query.ilike("name", f"%{search}%")

    response = query.order("created_at", desc=True).execute()
    products = [format_product(row) for row in (response.data or [])]
    return {"success": True, "data": {"products": products, "total": len(products)}}


def get_product(user_id: str, product_id: str) -> dict:
    try:
        response = (
            db.table(PRODUCTS)
            .select(_PRODUCT_COLUMNS)
            .eq("id", product_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
        return {"success": True, "data": {"product": format_product(response.data)}}
    except Exception as exc:
        raise_from_supabase(exc, not_found_detail="Product not found", server_detail=f"Failed to fetch product: {exc}")


def create_product(user_id: str, body: ProductCreate) -> dict:
    insert_data = {
        "user_id": user_id,
        "name": body.name,
    }
    if body.image_url:
        insert_data["image_url"] = body.image_url

    try:
        response = db.table(PRODUCTS).insert(insert_data).execute()
    except Exception as exc:
        if is_duplicate_name(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with the name '{body.name}' already exists. Please use a different name.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to create product: {exc}")

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create product")
    return {
        "success": True,
        "data": {"product": format_product(response.data[0])},
        "message": "Product created successfully",
    }


def update_product(user_id: str, product_id: str, body: ProductUpdate) -> dict:
    _assert_product_owned(user_id, product_id)

    update_data: dict = {}
    if body.name is not None:
        update_data["name"] = body.name
    if body.image_url is not None:
        update_data["image_url"] = body.image_url
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        response = (
            db.table(PRODUCTS).update(update_data).eq("id", product_id).eq("user_id", user_id).execute()
        )
    except Exception as exc:
        if is_duplicate_name(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with the name '{body.name}' already exists. Please use a different name.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to update product: {exc}")

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update product")
    return {
        "success": True,
        "data": {"product": format_product(response.data[0])},
        "message": "Product updated successfully",
    }


def delete_product(user_id: str, product_id: str) -> None:
    _assert_product_owned(user_id, product_id)
    now = datetime.now(timezone.utc).isoformat()
    db.table(PRODUCTS).update({"deleted_at": now}).eq("id", product_id).eq("user_id", user_id).execute()


def _assert_product_owned(user_id: str, product_id: str) -> None:
    try:
        db.table(PRODUCTS).select("id").eq("id", product_id).eq("user_id", user_id).is_(
            "deleted_at", "null"
        ).single().execute()
    except Exception as exc:
        if is_not_found(exc):
            raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(status_code=500, detail=f"Failed to find product: {exc}")
