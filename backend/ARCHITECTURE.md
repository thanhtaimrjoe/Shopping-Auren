# Backend architecture (MVC)

```
HTTP Request
    → app/api/v1/*          (controllers: routing + auth dependency)
    → app/services/*        (business logic + Supabase access)
    → PostgreSQL via PostgREST (Supabase)
```

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Controller** | `app/api/v1/` | HTTP methods, `get_current_user`, delegate to services |
| **Service** | `app/services/` | Validation orchestration, queries, response envelopes |
| **Schema** | `app/schemas/` | Pydantic request/response models |
| **Model** | `app/models/tables.py` | Table name constants (no ORM; persistence is Supabase) |
| **Utils** | `app/utils/` | Shared helpers (`ingredients`, PostgREST errors) |

Auth stays in `app/core/auth.py` + `jwt_verify.py`. Database migrations: `supabase/migrations/` (local) and legacy `backend/migrations/` (historical).
