from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import Channel, Competitor
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


def _max_competitors(tariff: str) -> int:
    if tariff == "agency":
        return 50
    if tariff == "strategist":
        return 15
    return 1


class CompetitorCreate(BaseModel):
    channel_id: int
    telegram_username: str
    title: str | None = None


class CompetitorOut(BaseModel):
    id: int
    channel_id: int
    telegram_username: str | None
    title: str | None
    subscribers_count: int | None
    er_estimate: float | None
    created_at: str


@router.get("", response_model=list[CompetitorOut])
async def list_competitors(
    channel_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Competitor).where(Competitor.owner_id == user.id)
    if channel_id is not None:
        ch = await db.execute(select(Channel).where(Channel.id == channel_id, Channel.owner_id == user.id))
        if not ch.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Channel not found")
        q = q.where(Competitor.channel_id == channel_id)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        CompetitorOut(
            id=c.id,
            channel_id=c.channel_id,
            telegram_username=c.telegram_username,
            title=c.title,
            subscribers_count=c.subscribers_count,
            er_estimate=c.er_estimate,
            created_at=c.created_at.isoformat(),
        )
        for c in rows
    ]


@router.post("", response_model=CompetitorOut)
async def add_competitor(
    payload: CompetitorCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = await db.execute(
        select(Channel).where(Channel.id == payload.channel_id, Channel.owner_id == user.id)
    )
    if not ch.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Channel not found")
    result = await db.execute(select(Competitor).where(Competitor.owner_id == user.id))
    current = len(result.scalars().all())
    if current >= _max_competitors(user.tariff):
        raise HTTPException(
            status_code=403,
            detail=f"Tariff limit: max {_max_competitors(user.tariff)} competitors",
        )
    existing = await db.execute(
        select(Competitor).where(
            Competitor.owner_id == user.id,
            Competitor.channel_id == payload.channel_id,
            Competitor.telegram_username == payload.telegram_username.strip().lstrip("@"),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Competitor already added")
    comp = Competitor(
        owner_id=user.id,
        channel_id=payload.channel_id,
        telegram_username=payload.telegram_username.strip().lstrip("@"),
        title=payload.title,
    )
    db.add(comp)
    await db.flush()
    await db.refresh(comp)
    return CompetitorOut(
        id=comp.id,
        channel_id=comp.channel_id,
        telegram_username=comp.telegram_username,
        title=comp.title,
        subscribers_count=comp.subscribers_count,
        er_estimate=comp.er_estimate,
        created_at=comp.created_at.isoformat(),
    )


@router.get("/benchmark")
async def get_benchmark(
    channel_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.owner_id == user.id)
    )
    channel = ch.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    result = await db.execute(
        select(Competitor).where(
            Competitor.owner_id == user.id,
            Competitor.channel_id == channel_id,
        )
    )
    competitors = result.scalars().all()
    our_er = 0.0
    our_subs = channel.subscribers_count or 0
    niche_avg_er = 0.0
    niche_avg_subs = 0
    if competitors:
        ers = [c.er_estimate for c in competitors if c.er_estimate is not None]
        subs = [c.subscribers_count for c in competitors if c.subscribers_count is not None]
        niche_avg_er = sum(ers) / len(ers) if ers else 0
        niche_avg_subs = sum(subs) // len(subs) if subs else 0
    return {
        "channel_id": channel_id,
        "your_subscribers": our_subs,
        "your_er_estimate": our_er,
        "niche_avg_subscribers": niche_avg_subs,
        "niche_avg_er": niche_avg_er,
        "competitors_count": len(competitors),
    }


@router.get("/ads-tracker")
async def get_ads_tracker(
    channel_id: int = Query(...),
    competitor_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models import CompetitorAdActivity

    ch = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.owner_id == user.id)
    )
    if not ch.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Channel not found")
    q = select(Competitor).where(Competitor.owner_id == user.id, Competitor.channel_id == channel_id)
    if competitor_id is not None:
        q = q.where(Competitor.id == competitor_id)
    comps = (await db.execute(q)).scalars().all()
    comp_ids = [c.id for c in comps]
    if not comp_ids:
        return {"activities": []}
    q2 = select(CompetitorAdActivity).where(CompetitorAdActivity.competitor_id.in_(comp_ids))
    acts = (await db.execute(q2)).scalars().all()
    return {
        "activities": [
            {
                "id": a.id,
                "competitor_id": a.competitor_id,
                "detected_at": a.detected_at.isoformat(),
                "description": a.description,
            }
            for a in acts
        ],
    }


@router.get("/audience-overlap")
async def get_audience_overlap(
    channel_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.owner_id == user.id)
    )
    if not ch.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Channel not found")
    result = await db.execute(
        select(Competitor).where(
            Competitor.owner_id == user.id,
            Competitor.channel_id == channel_id,
        )
    )
    comps = result.scalars().all()
    overlaps = []
    for c in comps:
        overlaps.append({
            "competitor_id": c.id,
            "competitor_username": c.telegram_username,
            "competitor_title": c.title,
            "overlap_estimate": None,
            "came_from_you_estimate": None,
        })
    return {"channel_id": channel_id, "overlaps": overlaps}
