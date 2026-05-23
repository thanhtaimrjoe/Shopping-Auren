from fastapi import APIRouter, Depends, status

from app.core.auth import get_current_user
from app.schemas.shopping_list import AddItemBody, CheckItemBody, GenerateListBody
from app.services import shopping_list_service

router = APIRouter()


@router.get("/current", status_code=status.HTTP_200_OK)
async def get_current_list(user: dict = Depends(get_current_user)):
    return shopping_list_service.get_current_list(user["id"])


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_list(body: GenerateListBody, user: dict = Depends(get_current_user)):
    return shopping_list_service.generate_list(user["id"], body)


@router.patch("/{list_id}/items/{item_id}", status_code=status.HTTP_200_OK)
async def check_item(
    list_id: str,
    item_id: str,
    body: CheckItemBody,
    user: dict = Depends(get_current_user),
):
    return shopping_list_service.check_item(user["id"], list_id, item_id, body)


@router.post("/{list_id}/items", status_code=status.HTTP_201_CREATED)
async def add_item(
    list_id: str, body: AddItemBody, user: dict = Depends(get_current_user)
):
    return shopping_list_service.add_item(user["id"], list_id, body)


@router.post("/{list_id}/complete", status_code=status.HTTP_200_OK)
async def complete_list(list_id: str, user: dict = Depends(get_current_user)):
    return shopping_list_service.complete_list(user["id"], list_id)


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    list_id: str, item_id: str, user: dict = Depends(get_current_user)
):
    shopping_list_service.delete_item(user["id"], list_id, item_id)
    return None
