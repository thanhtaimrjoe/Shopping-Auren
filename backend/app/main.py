from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import router as api_router
import traceback
import sys

app = FastAPI(
    title="Shopping Memo API",
    description="Weekly meal planning and shopping list management",
    version="0.1.0",
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to log traceback for 500 errors."""
    print(f"ERROR: Unhandled exception: {exc}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": f"Internal Server Error: {str(exc)}"}
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "https://shopping-memo.vercel.app",
        "https://shopping-auren.vercel.app",  # Actual Production URL
        "https://shopping-memo-backend-oefakwrmdq-as.a.run.app",  # GCP Cloud Run backend
        "capacitor://localhost",               # iOS Capacitor
        "http://localhost",                    # Android Capacitor
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def warm_auth_jwks_cache() -> None:
    """Prefetch Supabase JWKS so the first authenticated request is not blocked."""
    try:
        from app.core.jwt_verify import _fetch_jwks

        _fetch_jwks()
    except Exception as exc:
        print(f"WARN: JWKS warmup skipped: {exc}", file=sys.stderr)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
