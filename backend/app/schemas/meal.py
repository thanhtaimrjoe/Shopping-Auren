from pydantic import BaseModel, Field
from typing import Optional, List


class MealBase(BaseModel):
    name: str
    ingredients: Optional[List[str]] = None


class MealCreate(MealBase):
    pass


class MealUpdate(BaseModel):
    name: Optional[str] = None
    ingredients: Optional[List[str]] = Field(default=None)


class MealResponse(MealBase):
    id: str


class MealDetailResponse(MealResponse):
    pass
