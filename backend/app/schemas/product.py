from typing import Optional

from pydantic import BaseModel, Field, field_validator

VALID_PRODUCT_CATEGORIES = frozenset({"daily", "consumable", "other"})


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(...)
    image_url: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_PRODUCT_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_PRODUCT_CATEGORIES))}")
        return value


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = None
    image_url: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in VALID_PRODUCT_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_PRODUCT_CATEGORIES))}")
        return value
