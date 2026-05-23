from typing import Optional

from pydantic import BaseModel, Field, field_validator

VALID_MEAL_CATEGORIES = frozenset({"japanese", "western", "chinese", "other"})


class MealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    ingredients: Optional[str] = Field(None, max_length=5000)
    category: str = Field(...)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_MEAL_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_MEAL_CATEGORIES))}")
        return value


class MealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    ingredients: Optional[str] = Field(None, max_length=5000)
    category: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in VALID_MEAL_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_MEAL_CATEGORIES))}")
        return value
