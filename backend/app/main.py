from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.database import init_db, close_db
from app.api.v1 import auth, decks, cards, review, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 启动 Recall API...")
    await init_db()
    print("✅ 数据库已连接，表已创建")
    yield
    await close_db()
    print("👋 Recall API 已关闭")


app = FastAPI(
    title="Recall API",
    description="艾宾浩斯遗忘曲线复习应用",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router,   prefix="/api/v1/auth",   tags=["认证"])
app.include_router(decks.router,  prefix="/api/v1/decks",  tags=["卡片组"])
app.include_router(cards.router,  prefix="/api/v1/cards",  tags=["卡片"])
app.include_router(review.router, prefix="/api/v1/review", tags=["复习"])
app.include_router(stats.router,  prefix="/api/v1/stats",  tags=["统计"])


@app.get("/")
async def root():
    return {"app": "Recall", "status": "running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}