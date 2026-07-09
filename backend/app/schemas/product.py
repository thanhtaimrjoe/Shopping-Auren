from pydantic import BaseModel
from typing import Optional


class ProductBase(BaseModel):
    name: str
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None


class ProductResponse(ProductBase):
    id: str


class ProductDetailResponse(ProductResponse):
    pass
