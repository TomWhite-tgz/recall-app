from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import List
import uuid

from app.db.database import get_db
from app.models.card import Card, User
from app.schemas.review_schema import CardCreate, CardResponse
from app.core.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=CardResponse)
async def create_card(
    req: CardCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 新卡片：5分钟后第一次复习
    first_review = datetime.utcnow() + timedelta(minutes=5)

    card = Card(
        deck_id=req.deck_id,
        user_id=user.id,
        content_type=req.content_type,
        front_content=req.front_content,
        back_content=req.back_content,
        tags=req.tags,
        notes=req.notes,
        next_review_at=first_review,
    )
    db.add(card)
    await db.flush()
    await db.refresh(card)
    return card


@router.get("/deck/{deck_id}", response_model=List[CardResponse])
async def list_cards_in_deck(
    deck_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Card)
        .where(Card.deck_id == deck_id, Card.user_id == user.id)
        .order_by(Card.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{card_id}")
async def delete_card(
    card_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Card).where(Card.id == card_id, Card.user_id == user.id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="卡片不存在")
    await db.delete(card)
    return {"message": "已删除"}