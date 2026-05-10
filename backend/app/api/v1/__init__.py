from fastapi import APIRouter
from app.api.v1 import meals, products, meal_plans, shopping_lists

router = APIRouter()

router.include_router(meals.router, prefix="/meals", tags=["meals"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(meal_plans.router, prefix="/meal-plans", tags=["meal-plans"])
router.include_router(shopping_lists.router, prefix="/shopping-lists", tags=["shopping-lists"])
