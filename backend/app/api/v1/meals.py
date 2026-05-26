from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import get_current_user
from app.schemas.meal import MealCreate, MealUpdate
from app.services import meal_service

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def get_meals(
    search: Optional[str] = Query(None),
    sort: str = Query("created_at"),
    order: str = Query("desc"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    include_total: bool = Query(
        False,
        description="When true, runs an exact COUNT query (slower on large tables).",
    ),
    user: dict = Depends(get_current_user),
):
    return meal_service.list_meals(
        user["id"],
        search=search,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
        include_total=include_total,
    )


@router.get("/{meal_id}", status_code=status.HTTP_200_OK)
async def get_meal(meal_id: str, user: dict = Depends(get_current_user)):
    return meal_service.get_meal(user["id"], meal_id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meal(body: MealCreate, user: dict = Depends(get_current_user)):
    return meal_service.create_meal(user["id"], body)


@router.put("/{meal_id}", status_code=status.HTTP_200_OK)
async def update_meal(meal_id: str, body: MealUpdate, user: dict = Depends(get_current_user)):
    return meal_service.update_meal(user["id"], meal_id, body)


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(meal_id: str, user: dict = Depends(get_current_user)):
    meal_service.delete_meal(user["id"], meal_id)
    return None
