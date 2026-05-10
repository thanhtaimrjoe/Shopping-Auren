from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/current")
async def get_current_list(user=Depends(get_current_user)):
    return {"shopping_list": None}


@router.post("/generate")
async def generate_list(user=Depends(get_current_user)):
    return {"shopping_list": None}


@router.patch("/{list_id}/items/{item_id}")
async def check_item(list_id: str, item_id: str, user=Depends(get_current_user)):
    return {"item": None}


@router.post("/{list_id}/items")
async def add_item(list_id: str, user=Depends(get_current_user)):
    return {"item": None}


@router.post("/{list_id}/complete")
async def complete_list(list_id: str, user=Depends(get_current_user)):
    return {"shopping_list": None}
