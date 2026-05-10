from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/current")
async def get_current_plan(user=Depends(get_current_user)):
    return {"meal_plan": None}


@router.post("")
async def create_meal_plan(user=Depends(get_current_user)):
    return {"meal_plan": None}


@router.put("/{plan_id}")
async def update_meal_plan(plan_id: str, user=Depends(get_current_user)):
    return {"meal_plan": None}


@router.delete("/{plan_id}")
async def delete_meal_plan(plan_id: str, user=Depends(get_current_user)):
    return None
