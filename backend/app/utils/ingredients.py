"""Convert meal ingredients between API text and JSONB storage."""
import json
from typing import Any, Optional


def jsonb_to_text(ingredients_jsonb: Any) -> Optional[str]:
    if ingredients_jsonb is None:
        return None
    if isinstance(ingredients_jsonb, list):
        return "\n".join(str(i) for i in ingredients_jsonb) if ingredients_jsonb else None
    if isinstance(ingredients_jsonb, str):
        try:
            parsed = json.loads(ingredients_jsonb)
            if isinstance(parsed, list):
                return "\n".join(str(i) for i in parsed) if parsed else None
        except (json.JSONDecodeError, TypeError):
            pass
        return ingredients_jsonb if ingredients_jsonb else None
    return str(ingredients_jsonb)


def text_to_jsonb(ingredients_text: Optional[str]) -> list:
    if not ingredients_text:
        return []
    lines = [line.strip() for line in ingredients_text.split("\n") if line.strip()]
    return lines if lines else []


def normalize_ingredients_list(ingredients: Any) -> list[str]:
    """Normalize DB ingredients to a list of strings."""
    if ingredients is None:
        return []
    if isinstance(ingredients, list):
        return [str(i).strip() for i in ingredients if str(i).strip()]
    if isinstance(ingredients, str):
        try:
            parsed = json.loads(ingredients)
            if isinstance(parsed, list):
                return [str(i).strip() for i in parsed if str(i).strip()]
        except (json.JSONDecodeError, TypeError):
            pass
        return [i.strip() for i in ingredients.split("\n") if i.strip()]
    return []
