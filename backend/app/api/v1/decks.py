from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import List
import uuid

from app.db.database import get_db
from app.models.card import Deck, Card, User
from app.schemas.review_schema import DeckCreate, DeckResponse
from app.core.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=DeckResponse)
async def create_deck(
    req: DeckCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deck = Deck(user_id=user.id, name=req.name, description=req.description, color=req.color)
    db.add(deck)
    await db.flush()
    await db.refresh(deck)
    return DeckResponse(
        id=deck.id, name=deck.name, description=deck.description,
        color=deck.color, created_at=deck.created_at,
    )


@router.get("/", response_model=List[DeckResponse])
async def list_decks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deck).where(Deck.user_id == user.id).order_by(Deck.created_at.desc())
    )
    decks = result.scalars().all()

    response = []
    for deck in decks:
        # 统计卡片数和待复习数
        card_count_q = await db.execute(
            select(func.count()).where(Card.deck_id == deck.id)
        )
        due_count_q = await db.execute(
            select(func.count()).where(
                Card.deck_id == deck.id,
                Card.status == "active",
                Card.next_review_at <= datetime.utcnow(),
            )
        )
        response.append(DeckResponse(
            id=deck.id, name=deck.name, description=deck.description,
            color=deck.color, created_at=deck.created_at,
            card_count=card_count_q.scalar() or 0,
            due_count=due_count_q.scalar() or 0,
        ))
    return response


@router.delete("/{deck_id}")
async def delete_deck(
    deck_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Deck).where(Deck.id == deck_id, Deck.user_id == user.id)
    )
    deck = result.scalar_one_or_none()
    if not deck:
        raise HTTPException(status_code=404, detail="卡片组不存在")
    await db.delete(deck)
    return {"message": "已删除"}