from typing import List

from pydantic import BaseModel, Field, field_validator

VALID_ITEM_CATEGORIES = frozenset({
    "vegetables", "meat", "seafood", "dairy", "grains",
    "condiments", "frozen", "daily", "consumable", "other",
})


class GenerateListBody(BaseModel):
    meal_plan_id: str = Field(...)
    product_ids: List[str] = Field(default_factory=list)


class AddItemBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="other")

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_ITEM_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_ITEM_CATEGORIES))}")
        return value


class CheckItemBody(BaseModel):
    is_checked: bool
