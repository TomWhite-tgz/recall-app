from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


# ===== 用户 =====
class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ===== 卡片组 =====
class DeckCreate(BaseModel):
    name: str
    description: str = ""
    color: str = "#4A90D9"


class DeckResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    color: str
    created_at: datetime
    card_count: int = 0
    due_count: int = 0

    class Config:
        from_attributes = True


# ===== 卡片 =====
class CardCreate(BaseModel):
    deck_id: uuid.UUID
    content_type: str = "text"
    front_content: dict  # {"type": "text", "value": "什么是闭包?"}
    back_content: dict   # {"type": "text", "value": "闭包是..."}
    tags: List[str] = []
    notes: str = ""


class CardResponse(BaseModel):
    id: uuid.UUID
    deck_id: uuid.UUID
    content_type: str
    front_content: dict
    back_content: dict
    tags: list
    ease_factor: float
    interval_days: float
    repetition_count: int
    next_review_at: Optional[datetime]
    total_reviews: int
    correct_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== 复习 =====
class ReviewSubmit(BaseModel):
    card_id: uuid.UUID
    quality: int = Field(ge=0, le=5, description="评分 0-5")
    time_spent_ms: int = Field(ge=0, description="花费时间(毫秒)")


class ReviewResult(BaseModel):
    card_id: uuid.UUID
    next_review_at: datetime
    interval_display: str     # "5分钟" / "2天" / "15天"
    ease_factor: float
    repetition_count: int
    message: str


# ===== 统计 =====
class StatsOverview(BaseModel):
    total_cards: int
    due_today: int
    reviewed_today: int
    streak_days: int
    avg_retention: float