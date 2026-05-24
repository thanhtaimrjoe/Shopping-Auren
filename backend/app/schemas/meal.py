from typing import Optional

from pydantic import BaseModel, Field


class MealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    ingredients: Optional[str] = Field(None, max_length=5000)


class MealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    ingredients: Optional[str] = Field(None, max_length=5000)
