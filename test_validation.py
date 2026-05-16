from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List
from datetime import date

class MealPlanItemInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    meal_type: str = Field(...)
    meal_id: str = Field(...)

    @field_validator("meal_type")
    @classmethod
    def validate_meal_type(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("meal_type must not be empty")
        return v

class MealPlanUpdate(BaseModel):
    meals: List[MealPlanItemInput] = Field(...)

    @model_validator(mode="after")
    def validate_daily_limit(self):
        counts = {}
        for meal in self.meals:
            counts[meal.day_of_week] = counts.get(meal.day_of_week, 0) + 1
            if counts[meal.day_of_week] > 3:
                raise ValueError("Each day can contain at most 3 meals")
        return self

try:
    obj = MealPlanUpdate(meals=[
        {"day_of_week": 0, "meal_type": "slot_000", "meal_id": "b886d9a0-6211-4fbd-813c-d3dd60a638b9"}
    ])
    print("Success")
except Exception as e:
    print("Error:", e)
