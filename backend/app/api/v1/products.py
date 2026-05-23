from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import get_current_user
from app.schemas.product import ProductCreate, ProductUpdate
from app.services import product_service

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def get_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    return product_service.list_products(user["id"], category=category, search=search)


@router.get("/{product_id}", status_code=status.HTTP_200_OK)
async def get_product(product_id: str, user: dict = Depends(get_current_user)):
    return product_service.get_product(user["id"], product_id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(body: ProductCreate, user: dict = Depends(get_current_user)):
    return product_service.create_product(user["id"], body)


@router.put("/{product_id}", status_code=status.HTTP_200_OK)
async def update_product(
    product_id: str, body: ProductUpdate, user: dict = Depends(get_current_user)
):
    return product_service.update_product(user["id"], product_id, body)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    product_service.delete_product(user["id"], product_id)
    return None
