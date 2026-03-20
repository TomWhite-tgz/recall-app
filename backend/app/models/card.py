import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, ForeignKey, Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    timezone = Column(String(50), default="Asia/Shanghai")
    daily_goal = Column(Integer, default=20)
    created_at = Column(DateTime, default=datetime.utcnow)

    decks = relationship("Deck", back_populates="user", cascade="all, delete-orphan")

    notify_enabled = Column(Boolean, default=True)
    notify_times = Column(JSONB, default=["08:00", "12:00", "20:00"])
    custom_intervals = Column(JSONB, default=None)  # 用户自定义间隔，null则用默认艾宾浩斯
class Deck(Base):
    __tablename__ = "decks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    color = Column(String(7), default="#4A90D9")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    content_type = Column(String(20), nullable=False, default="text")
    front_content = Column(JSONB, nullable=False)
    back_content = Column(JSONB, nullable=False)
    tags = Column(JSONB, default=[])
    notes = Column(Text, default="")

    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Float, default=0)
    repetition_count = Column(Integer, default=0)
    next_review_at = Column(DateTime, nullable=True, index=True)
    last_reviewed_at = Column(DateTime, nullable=True)

    total_reviews = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    status = Column(String(20), default="active")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deck = relationship("Deck", back_populates="cards")
    review_logs = relationship("ReviewLog", back_populates="card", cascade="all, delete-orphan")


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    quality = Column(Integer, nullable=False)
    time_spent_ms = Column(Integer, default=0)

    prev_interval = Column(Float)
    new_interval = Column(Float)
    prev_ease = Column(Float)
    new_ease = Column(Float)

    reviewed_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("Card", back_populates="review_logs")