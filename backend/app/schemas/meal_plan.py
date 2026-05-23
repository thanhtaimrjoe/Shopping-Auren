from datetime import date
from typing import List

from pydantic import BaseModel, Field, field_validator, model_validator


class MealPlanItemInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    meal_id: str = Field(...)


class MealPlanCreate(BaseModel):
    week_start_date: date = Field(...)
    meals: List[MealPlanItemInput] = Field(default_factory=list)

    @field_validator("week_start_date")
    @classmethod
    def validate_monday(cls, value: date) -> date:
        if value.weekday() != 0:
            raise ValueError("week_start_date must be a Monday")
        return value

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
