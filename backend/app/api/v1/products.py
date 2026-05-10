from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_products(user=Depends(get_current_user)):
    return {"products": [], "total": 0}


@router.get("/{product_id}")
async def get_product(product_id: str, user=Depends(get_current_user)):
    return {"product": None}


@router.post("")
async def create_product(user=Depends(get_current_user)):
    return {"product": None}


@router.put("/{product_id}")
async def update_product(product_id: str, user=Depends(get_current_user)):
    return {"product": None}


@router.delete("/{product_id}")
async def delete_product(product_id: str, user=Depends(get_current_user)):
    return None
