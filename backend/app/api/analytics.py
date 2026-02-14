from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Channel, ChannelStatsSnapshot
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


class ChannelStats(BaseModel):
    channel_id: int
    subscribers_count: int | None
    growth_7d: float | None
    er_estimate: float | None
    period_days: int


class PsychographicOut(BaseModel):
    emotions: dict[str, float]
    types: dict[str, float]
    sample_comments_count: int


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


@router.get("/channel/{channel_id}/heatmap", response_model=dict)
async def get_channel_heatmap(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = await db.execute(
        select(Channel).where(
            Channel.id == channel_id,
            Channel.owner_id == user.id,
        )
    )
    channel = ch.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    result = await db.execute(
        select(ChannelStatsSnapshot).where(
            ChannelStatsSnapshot.channel_id == channel_id,
            ChannelStatsSnapshot.period_type == "heatmap",
        )
    )
    snapshots = result.scalars().all()
    key_to_cell = {(s.period_value, s.day_of_week or 0): s for s in snapshots}
    heatmap = []
    for h in range(24):
        for d in range(7):
            cell = key_to_cell.get((h, d))
            if cell and cell.posts_count:
                avg_v = cell.total_views / cell.posts_count
                avg_r = cell.total_reactions / cell.posts_count
                heatmap.append({
                    "hour_utc": h,
                    "day_of_week": d,
                    "posts_count": cell.posts_count,
                    "avg_views": avg_v,
                    "avg_reactions": avg_r,
                    "score": avg_v * 0.3 + avg_r * 10,
                })
            else:
                heatmap.append({
                    "hour_utc": h,
                    "day_of_week": d,
                    "posts_count": 0,
                    "avg_views": 0.0,
                    "avg_reactions": 0.0,
                    "score": 0.0,
                })
    best_post_hour = 12
    best_reply_hour = 14
    if heatmap:
        by_score = sorted(heatmap, key=lambda x: x["score"], reverse=True)
        if by_score and by_score[0]["score"] > 0:
            best_post_hour = by_score[0]["hour_utc"]
            best_reply_hour = (best_post_hour + 2) % 24
    return {
        "channel_id": channel_id,
        "cells": heatmap,
        "best_post_hour_utc": best_post_hour,
        "best_reply_hour_utc": best_reply_hour,
    }


@router.get("/channel/{channel_id}/psychographic", response_model=PsychographicOut)
async def get_channel_psychographic(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = await db.execute(
        select(Channel).where(
            Channel.id == channel_id,
            Channel.owner_id == user.id,
        )
    )
    if not ch.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Channel not found")
    return PsychographicOut(
        emotions={
            "joy": 0.35,
            "trust": 0.28,
            "interest": 0.22,
            "neutral": 0.12,
            "criticism": 0.03,
        },
        types={
            "enthusiasts": 0.25,
            "silent_readers": 0.55,
            "critics": 0.08,
            "discussants": 0.12,
        },
        sample_comments_count=0,
    )
