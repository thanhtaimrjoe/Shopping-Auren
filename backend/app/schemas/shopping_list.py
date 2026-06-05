from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.constants.shopping_groups import SHOPPING_GROUP_MANUAL


class GenerateListItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=100)
    source_type: Literal["meal", "product", "manual"] = Field(...)
    source_id: str | None = None
    note: str | None = Field(default=None, max_length=500)


class GenerateListBody(BaseModel):
    meal_plan_id: str = Field(...)
    product_ids: list[str] = Field(default_factory=list)
    items: list[GenerateListItem] | None = None


class AddItemBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default=SHOPPING_GROUP_MANUAL, min_length=1, max_length=100)


class CheckItemBody(BaseModel):
    is_checked: bool


class CompleteListBody(BaseModel):
    week_from_date: date = Field(...)
    week_to_date: date = Field(...)

    @model_validator(mode="after")
    def validate_week_range(self):
        if self.week_to_date < self.week_from_date:
            raise ValueError("week_to_date must be on or after week_from_date")
        return self
