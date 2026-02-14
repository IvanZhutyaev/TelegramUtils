from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import Channel
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

SEARCH_QUERIES_PER_WEEK_CREATOR = 5


class ChannelSearchResult(BaseModel):
    id: int
    title: str | None
    username: str | None
    subscribers_count: int | None


@router.get("/search", response_model=list[ChannelSearchResult])
async def search_channels(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Channel).where(
            Channel.owner_id == user.id,
        ).limit(limit * 3)
    )
    channels = result.scalars().all()
    q_lower = q.lower()
    matched = [
        c for c in channels
        if (c.title and q_lower in c.title.lower())
        or (c.username and q_lower in (c.username or "").lower())
    ][:limit]
    return [
        ChannelSearchResult(
            id=c.id,
            title=c.title,
            username=c.username,
            subscribers_count=c.subscribers_count,
        )
        for c in matched
    ]


@router.post("/connect")
async def connect_channel(
    telegram_channel_id: int,
    username: str | None = None,
    title: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models import Channel as ChannelModel
    result = await db.execute(
        select(Channel).where(Channel.owner_id == user.id)
    )
    owned = result.scalars().all()
    max_channels = 1 if user.tariff == "creator" else (3 if user.tariff == "strategist" else 10)
    if len(owned) >= max_channels:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail=f"Tariff limit: max {max_channels} channels",
        )
    existing = await db.execute(
        select(Channel).where(Channel.telegram_channel_id == telegram_channel_id)
    )
    if existing.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Channel already connected")
    ch = ChannelModel(
        owner_id=user.id,
        telegram_channel_id=telegram_channel_id,
        username=username,
        title=title,
    )
    db.add(ch)
    await db.flush()
    await db.refresh(ch)
    return {"channel_id": ch.id, "title": ch.title, "username": ch.username}
