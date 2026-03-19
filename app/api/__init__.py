# API module - FastAPI routes
from app.api.assets import router as assets_router
from app.api.orders import router as orders_router

__all__ = [
    "assets_router",
    "orders_router",
]
