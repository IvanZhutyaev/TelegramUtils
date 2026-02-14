from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Channel
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


class ChannelStats(BaseModel):
    channel_id: int
    subscribers_count: int | None
    growth_7d: float | None
    er_estimate: float | None
    period_days: int


@router.get("/channel/{channel_id}", response_model=ChannelStats)
async def get_channel_analytics(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Channel).where(
            Channel.id == channel_id,
            Channel.owner_id == user.id,
        )
    )
    channel = result.scalar_one_or_none()
    if not channel:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Channel not found")
    return ChannelStats(
        channel_id=channel.id,
        subscribers_count=channel.subscribers_count,
        growth_7d=None,
        er_estimate=None,
        period_days=7,
    )


@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Channel).where(Channel.owner_id == user.id))
    channels = result.scalars().all()
    return {
        "channels": [
            {
                "id": c.id,
                "title": c.title,
                "username": c.username,
                "subscribers_count": c.subscribers_count,
            }
            for c in channels
        ],
        "tariff": user.tariff,
    }
