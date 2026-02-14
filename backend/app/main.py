from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, analytics, content, channels, competitors
from app.database import init_db

app = FastAPI(title="GrowthKit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(content.router, prefix="/api/v1/content", tags=["content"])
app.include_router(channels.router, prefix="/api/v1/channels", tags=["channels"])
app.include_router(competitors.router, prefix="/api/v1/competitors", tags=["competitors"])


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}
