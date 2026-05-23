"""Map Supabase/PostgREST errors to HTTP-friendly exceptions."""
from fastapi import HTTPException, status


def is_not_found(error: Exception) -> bool:
    msg = str(error)
    return "PGRST116" in msg or "Results contain 0 rows" in msg


def raise_not_found(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def raise_from_supabase(error: Exception, *, not_found_detail: str, server_detail: str) -> None:
    if is_not_found(error):
        raise_not_found(not_found_detail)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=server_detail)


def is_duplicate_name(error: Exception, constraint_hint: str = "") -> bool:
    msg = str(error)
    return "duplicate key value violates unique constraint" in msg and (
        not constraint_hint or constraint_hint in msg
    )
