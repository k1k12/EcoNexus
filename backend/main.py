from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler

# Import routers
from app.api.endpoints.product import router as product_router
from app.api.endpoints.user import router as user_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.recycling_points import router as recycling_router
from app.api.endpoints.materials import router as materials_router
from app.api.endpoints.council import router as council_router
from app.api.endpoints.userdashboards import router as dashboard_router
from app.api.endpoints.admin import router as admin_router

# Import config
from app.core.config import settings

app = FastAPI()

# Include routers
app.include_router(product_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(recycling_router)
app.include_router(materials_router)
app.include_router(council_router)
app.include_router(dashboard_router)
app.include_router(admin_router)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request validation handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error: {exc}")
    return await request_validation_exception_handler(request, exc)
