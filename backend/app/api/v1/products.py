from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from app.core.auth import get_current_user
from app.core.supabase import supabase_admin as db

router = APIRouter()

# ─── Category constants ───────────────────────────────────────────────────────

VALID_CATEGORIES = {"daily", "consumable", "other"}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def format_product(row: dict) -> dict:
    """Normalize a products DB row for API response."""
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "image_url": row.get("image_url"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(...)
    image_url: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    image_url: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        return v


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", status_code=status.HTTP_200_OK)
async def get_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    """Get all products for the authenticated user."""
    user_id = user["id"]

    if category and category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}",
        )

    try:
        print(f"Fetching products for user_id: {user_id}")
        query = (
            db.table("products")
            .select("id, name, category, image_url, created_at, updated_at")
            .eq("user_id", user_id)
        )
        if category:
            query = query.eq("category", category)
        if search:
            query = query.ilike("name", f"%{search}%")

        query = query.order("created_at", desc=True)
        response = query.execute()
        
        if response.data is None:
            print("Warning: query.execute() returned None data")
            products = []
        else:
            products = [format_product(row) for row in response.data]

        print(f"Successfully fetched {len(products)} products")
        return {
            "success": True,
            "data": {"products": products, "total": len(products)},
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@router.get("/{product_id}", status_code=status.HTTP_200_OK)
async def get_product(product_id: str, user: dict = Depends(get_current_user)):
    """Get a single product by ID."""
    user_id = user["id"]

    try:
        print(f"Fetching product {product_id} for user_id: {user_id}")
        response = (
            db.table("products")
            .select("id, name, category, image_url, created_at, updated_at")
            .eq("id", product_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return {"success": True, "data": {"product": format_product(response.data)}}
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching product {product_id}: {error_msg}")
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {error_msg}")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(body: ProductCreate, user: dict = Depends(get_current_user)):
    """Create a new product."""
    user_id = user["id"]

    try:
        insert_data = {
            "user_id": user_id,
            "name": body.name,
            "category": body.category,
        }
        if body.image_url:
            insert_data["image_url"] = body.image_url

        response = db.table("products").insert(insert_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create product")

        return {
            "success": True,
            "data": {"product": format_product(response.data[0])},
            "message": "Product created successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        # Check for duplicate product name error (unique constraint violation)
        if "duplicate key value violates unique constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with the name '{body.name}' already exists. Please use a different name."
            )
        
        # Log unexpected errors for debugging
        print(f"ERROR creating product: {error_str}")
        print(f"Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create product: {error_str}")


@router.put("/{product_id}", status_code=status.HTTP_200_OK)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    user: dict = Depends(get_current_user),
):
    """Update an existing product (partial update)."""
    user_id = user["id"]

    # Verify ownership
    try:
        existing = (
            db.table("products")
            .select("id")
            .eq("id", product_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
    except Exception as e:
        error_msg = str(e)
        if "PGRST116" in error_msg or "Results contain 0 rows" in error_msg:
            raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(status_code=500, detail=f"Failed to find product: {error_msg}")

    update_data: dict = {}
    if body.name is not None:
        update_data["name"] = body.name
    if body.category is not None:
        update_data["category"] = body.category
    if body.image_url is not None:
        update_data["image_url"] = body.image_url

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        response = (
            db.table("products")
            .update(update_data)
            .eq("id", product_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update product")

        return {
            "success": True,
            "data": {"product": format_product(response.data[0])},
            "message": "Product updated successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        # Check for duplicate product name error (unique constraint violation)
        if "duplicate key value violates unique constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with the name '{body.name}' already exists. Please use a different name."
            )
        
        # Log unexpected errors for debugging
        print(f"ERROR updating product {product_id}: {error_str}")
        print(f"Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update product: {error_str}")


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a product."""
    user_id = user["id"]

    try:
        # Check if product exists and belongs to the user
        existing = (
            db.table("products")
            .select("id")
            .eq("id", product_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Product not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find product: {str(e)}")

    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        db.table("products").update({"deleted_at": now}).eq("id", product_id).eq("user_id", user_id).execute()
        return None

    except Exception as e:
        error_str = str(e)
        # Log unexpected errors for debugging
        print(f"ERROR deleting product {product_id}: {error_str}")
        print(f"Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {error_str}")
