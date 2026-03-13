from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.card import Card, ReviewLog, User
from app.schemas.review_schema import StatsOverview
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/overview", response_model=StatsOverview)
async def get_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 总卡片数
    total = await db.execute(
        select(func.count()).where(Card.user_id == user.id, Card.status == "active")
    )
    total_cards = total.scalar() or 0

    # 今日待复习
    due = await db.execute(
        select(func.count()).where(
            Card.user_id == user.id,
            Card.status == "active",
            Card.next_review_at <= now,
        )
    )
    due_today = due.scalar() or 0

    # 今日已复习
    reviewed = await db.execute(
        select(func.count()).where(
            ReviewLog.user_id == user.id,
            ReviewLog.reviewed_at >= today_start,
        )
    )
    reviewed_today = reviewed.scalar() or 0

    return StatsOverview(
        total_cards=total_cards,
        due_today=due_today,
        reviewed_today=reviewed_today,
        streak_days=0,       # TODO: 计算连续学习天数
        avg_retention=0.85,  # TODO: 计算平均记忆保持率
    )