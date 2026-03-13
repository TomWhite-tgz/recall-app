"""
艾宾浩斯遗忘曲线 + SM-2 混合 SRS 引擎
"""
import math
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from typing import Optional
from enum import Enum


class ReviewQuality(Enum):
    FORGOT = 0
    HARD = 1
    HESITATED = 2
    RECALLED = 3
    EASY = 4
    PERFECT = 5


@dataclass
class SRSCard:
    card_id: str
    ease_factor: float = 2.5
    interval_days: float = 0
    repetition_count: int = 0
    next_review_at: Optional[datetime] = None
    last_reviewed_at: Optional[datetime] = None

    EBBINGHAUS_INTERVALS = [
        5 / 1440,
        30 / 1440,
        0.5,
        1,
        2,
        4,
        7,
        15,
        30,
        60,
    ]


class EbbinghausSRS:
    """核心 SRS 引擎"""

    @staticmethod
    def calculate_next_review(card: SRSCard, quality: ReviewQuality) -> SRSCard:
        q = quality.value
        now = datetime.now(timezone.utc)

        if q < 3:
            card.repetition_count = 0
            card.interval_days = SRSCard.EBBINGHAUS_INTERVALS[0]
            card.ease_factor = max(1.3, card.ease_factor - 0.2)
        else:
            card.repetition_count += 1

            if card.repetition_count <= len(SRSCard.EBBINGHAUS_INTERVALS):
                idx = card.repetition_count - 1
                base = SRSCard.EBBINGHAUS_INTERVALS[idx]
                multiplier = {3: 0.9, 4: 1.0, 5: 1.3}
                card.interval_days = base * multiplier[q]
            else:
                card.interval_days *= card.ease_factor

            card.ease_factor = max(
                1.3,
                card.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            )

        card.next_review_at = now + timedelta(days=card.interval_days)
        card.last_reviewed_at = now
        return card

    @staticmethod
    def get_retention_rate(last_reviewed: datetime, interval_days: float, ease: float) -> float:
        if not last_reviewed:
            return 0.0
        t = (datetime.utcnow() - last_reviewed).total_seconds() / 86400
        S = max(interval_days * ease, 0.01)
        return max(0.0, min(1.0, math.exp(-t / S)))

    @staticmethod
    def format_interval(days: float) -> str:
        if days < 1 / 1440:
            return "< 1分钟"
        if days < 1 / 24:
            return f"{int(days * 1440)}分钟"
        if days < 1:
            return f"{int(days * 24)}小时"
        if days < 30:
            return f"{int(days)}天"
        if days < 365:
            return f"{int(days / 30)}个月"
        return f"{days / 365:.1f}年"