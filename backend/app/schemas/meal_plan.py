from typing import List

from pydantic import BaseModel, Field, model_validator


class MealPlanItemInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    meal_id: str = Field(...)


class MealPlanCreate(BaseModel):
    meals: List[MealPlanItemInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_daily_limit(self):
        counts: dict[int, int] = {}
        for meal in self.meals:
            counts[meal.day_of_week] = counts.get(meal.day_of_week, 0) + 1
            if counts[meal.day_of_week] > 3:
                raise ValueError("Each day can contain at most 3 meals")
        return self


class MealPlanUpdate(BaseModel):
    meals: List[MealPlanItemInput] = Field(...)

    @model_validator(mode="after")
    def validate_daily_limit(self):
        counts: dict[int, int] = {}
        for meal in self.meals:
            counts[meal.day_of_week] = counts.get(meal.day_of_week, 0) + 1
            if counts[meal.day_of_week] > 3:
                raise ValueError("Each day can contain at most 3 meals")
        return self
