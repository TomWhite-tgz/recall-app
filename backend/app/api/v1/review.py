from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List, Optional
import uuid

from app.db.database import get_db
from app.models.card import Card, ReviewLog, User
from app.schemas.review_schema import ReviewSubmit, ReviewResult, CardResponse
from app.core.srs_engine import EbbinghausSRS, SRSCard, ReviewQuality
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/due", response_model=List[CardResponse])
async def get_due_cards(
    deck_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取需要复习的卡片"""
    query = (
        select(Card)
        .where(
            Card.user_id == user.id,
            Card.status == "active",
            Card.next_review_at <= datetime.utcnow(),
        )
        .order_by(Card.next_review_at.asc())
        .limit(limit)
    )
    if deck_id:
        query = query.where(Card.deck_id == deck_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/submit", response_model=ReviewResult)
async def submit_review(
    req: ReviewSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交复习结果"""
    # 1. 查找卡片
    result = await db.execute(
        select(Card).where(Card.id == req.card_id, Card.user_id == user.id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="卡片不存在")

    # 2. 保存旧状态
    prev_interval = card.interval_days
    prev_ease = card.ease_factor

    # 3. ⭐ SRS 引擎计算
    srs_card = SRSCard(
        card_id=str(card.id),
        ease_factor=card.ease_factor,
        interval_days=card.interval_days,
        repetition_count=card.repetition_count,
        next_review_at=card.next_review_at,
        last_reviewed_at=card.last_reviewed_at,
    )
    quality = ReviewQuality(req.quality)
    updated = EbbinghausSRS.calculate_next_review(srs_card, quality)

    # 4. 更新卡片
    card.ease_factor = updated.ease_factor
    card.interval_days = updated.interval_days
    card.repetition_count = updated.repetition_count
    card.next_review_at = updated.next_review_at
    card.last_reviewed_at = updated.last_reviewed_at
    card.total_reviews += 1
    if req.quality >= 3:
        card.correct_count += 1

    # 5. 写复习日志
    log = ReviewLog(
        card_id=card.id,
        user_id=user.id,
        quality=req.quality,
        time_spent_ms=req.time_spent_ms,
        prev_interval=prev_interval,
        new_interval=updated.interval_days,
        prev_ease=prev_ease,
        new_ease=updated.ease_factor,
    )
    db.add(log)

    # 6. 返回结果
    messages = {
        0: "没关系，马上会再次出现 💪",
        1: "有点难，多复习几次就好 📖",
        2: "快要记住了，加油！🔥",
        3: "不错，记忆在巩固！👍",
        4: "很好，轻松回忆！⭐",
        5: "完美记忆！🎉",
    }

    return ReviewResult(
        card_id=card.id,
        next_review_at=updated.next_review_at,
        interval_display=EbbinghausSRS.format_interval(updated.interval_days),
        ease_factor=updated.ease_factor,
        repetition_count=updated.repetition_count,
        message=messages.get(req.quality, "继续加油！"),
    )