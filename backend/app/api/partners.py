from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import Channel, NegotiationRequest, User
from app.api.deps import get_current_user

router = APIRouter()

SCOUT_MAX_RESULTS = 10
STRATEGIST_NEGOTIATION_LIMIT = 20


class ScoutChannel(BaseModel):
    username: str
    title: str | None
    subscribers_count: int | None
    er_estimate: float | None
    relevance_score: float


class NegotiationCreate(BaseModel):
    from_channel_id: int
    to_channel_username: str
    proposed_text: str | None = None


class NegotiationOut(BaseModel):
    id: int
    from_channel_id: int
    to_channel_username: str
    proposed_text: str | None
    status: str
    created_at: str
    from_channel_title: str | None = None


@router.get("/scout", response_model=list[ScoutChannel])
async def partner_scout(
    channel_id: int = Query(...),
    limit: int = Query(5, ge=1, le=SCOUT_MAX_RESULTS),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.owner_id == user.id)
    )
    if not ch.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Channel not found")
    result = await db.execute(
        select(Channel).where(Channel.owner_id == user.id).limit(50)
    )
    my_channels = result.scalars().all()
    suggested = [
        ScoutChannel(
            username=f"niche_channel_{i}",
            title=f"Канал в вашей нише {i}",
            subscribers_count=5000 + i * 1000,
            er_estimate=0.03 + i * 0.005,
            relevance_score=0.9 - i * 0.05,
        )
        for i in range(1, limit + 1)
    ]
    return suggested


def _negotiation_allowed(tariff: str) -> bool:
    return tariff in ("strategist", "agency")


@router.post("/negotiation", response_model=NegotiationOut)
async def create_negotiation(
    payload: NegotiationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not _negotiation_allowed(user.tariff):
        raise HTTPException(status_code=403, detail="Available on Strategist or Agency tariff")
    ch = await db.execute(
        select(Channel).where(Channel.id == payload.from_channel_id, Channel.owner_id == user.id)
    )
    channel = ch.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if user.tariff == "strategist":
        count = await db.scalar(
            select(func.count()).select_from(NegotiationRequest).where(
                NegotiationRequest.from_user_id == user.id,
                NegotiationRequest.status == "pending",
            )
        )
        if (count or 0) >= STRATEGIST_NEGOTIATION_LIMIT:
            raise HTTPException(status_code=429, detail=f"Limit {STRATEGIST_NEGOTIATION_LIMIT} active negotiations")
    to_username = payload.to_channel_username.strip().lstrip("@")
    req = NegotiationRequest(
        from_user_id=user.id,
        from_channel_id=payload.from_channel_id,
        to_channel_username=to_username,
        proposed_text=payload.proposed_text,
        status="pending",
    )
    db.add(req)
    await db.flush()
    await db.refresh(req)
    return NegotiationOut(
        id=req.id,
        from_channel_id=req.from_channel_id,
        to_channel_username=req.to_channel_username,
        proposed_text=req.proposed_text,
        status=req.status,
        created_at=req.created_at.isoformat(),
        from_channel_title=channel.title,
    )


@router.get("/negotiation", response_model=dict)
async def list_negotiations(
    direction: str = Query("sent", regex="^(sent|received)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if direction == "sent":
        result = await db.execute(
            select(NegotiationRequest, Channel.title).where(
                NegotiationRequest.from_user_id == user.id,
            ).join(Channel, NegotiationRequest.from_channel_id == Channel.id)
        )
        rows = result.all()
        items = [
            NegotiationOut(
                id=r.id,
                from_channel_id=r.from_channel_id,
                to_channel_username=r.to_channel_username,
                proposed_text=r.proposed_text,
                status=r.status,
                created_at=r.created_at.isoformat(),
                from_channel_title=title,
            )
            for r, title in rows
        ]
    else:
        ch_result = await db.execute(select(Channel.username).where(Channel.owner_id == user.id))
        my_usernames = [str(u).strip().lstrip("@").lower() for (u,) in ch_result.all() if u]
        result = await db.execute(
            select(NegotiationRequest).where(
                func.lower(NegotiationRequest.to_channel_username).in_(my_usernames),
            )
        )
        reqs = result.scalars().all()
        for r in reqs:
            if r.to_user_id is None:
                r.to_user_id = user.id
        await db.flush()
        items = []
        for r in reqs:
            ch = await db.execute(select(Channel).where(Channel.id == r.from_channel_id))
            channel = ch.scalar_one_or_none()
            items.append(NegotiationOut(
                id=r.id,
                from_channel_id=r.from_channel_id,
                to_channel_username=r.to_channel_username,
                proposed_text=r.proposed_text,
                status=r.status,
                created_at=r.created_at.isoformat(),
                from_channel_title=channel.title if channel else None,
            ))
    return {"items": items, "direction": direction}


@router.post("/negotiation/{request_id}/accept")
async def accept_negotiation(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(NegotiationRequest).where(
            NegotiationRequest.id == request_id,
            NegotiationRequest.to_user_id == user.id,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "accepted"
    await db.flush()
    return {"status": "accepted"}


@router.post("/negotiation/{request_id}/decline")
async def decline_negotiation(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(NegotiationRequest).where(
            NegotiationRequest.id == request_id,
            NegotiationRequest.to_user_id == user.id,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        result = await db.execute(
            select(NegotiationRequest).where(
                NegotiationRequest.id == request_id,
                NegotiationRequest.from_user_id == user.id,
            )
        )
        req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "declined"
    await db.flush()
    return {"status": "declined"}
