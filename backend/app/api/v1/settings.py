from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.db.database import get_db
from app.models.card import User
from app.core.auth import get_current_user

router = APIRouter()


class NotificationSettings(BaseModel):
    notify_enabled: bool = True
    notify_times: List[str] = ["08:00", "12:00", "20:00"]
    custom_intervals: Optional[List[float]] = None  # 自定义间隔(天)


class NotificationSettingsResponse(BaseModel):
    notify_enabled: bool
    notify_times: list
    custom_intervals: list | None


@router.get("/notification", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    user: User = Depends(get_current_user),
):
    """获取通知设置"""
    return {
        "notify_enabled": user.notify_enabled if hasattr(user, 'notify_enabled') else True,
        "notify_times": user.notify_times if hasattr(user, 'notify_times') else ["08:00", "12:00", "20:00"],
        "custom_intervals": user.custom_intervals if hasattr(user, 'custom_intervals') else None,
    }


@router.put("/notification")
async def update_notification_settings(
    req: NotificationSettings,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新通知设置"""
    user.notify_enabled = req.notify_enabled
    user.notify_times = req.notify_times
    user.custom_intervals = req.custom_intervals

    return {"message": "设置已更新"}