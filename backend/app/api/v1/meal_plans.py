from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.auth import get_current_user
from app.schemas.meal_plan import MealPlanCreate, MealPlanUpdate
from app.services import meal_plan_service

router = APIRouter()


@router.get("/current", status_code=status.HTTP_200_OK)
async def get_current_plan(
    week_start: Optional[date] = Query(None, description="Week start date (YYYY-MM-DD, must be Monday)"),
    user: dict = Depends(get_current_user),
):
    return meal_plan_service.get_current_plan(user["id"], week_start)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_meal_plan(body: MealPlanCreate, user: dict = Depends(get_current_user)):
    return meal_plan_service.create_meal_plan(user["id"], body)


@router.put("/{plan_id}", status_code=status.HTTP_200_OK)
async def update_meal_plan(
    plan_id: str, body: MealPlanUpdate, user: dict = Depends(get_current_user)
):
    return meal_plan_service.update_meal_plan(user["id"], plan_id, body)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal_plan(plan_id: str, user: dict = Depends(get_current_user)):
    meal_plan_service.delete_meal_plan(user["id"], plan_id)
    return None
