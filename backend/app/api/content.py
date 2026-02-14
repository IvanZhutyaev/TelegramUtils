from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.api.deps import get_current_user
from app.models import User
from app.database import async_session

router = APIRouter()

CREATOR_WEEKLY_LIMIT = 5


class GeneratePostInput(BaseModel):
    topic: str
    channel_id: int | None = None
    style_hint: str | None = None


class GeneratePostResponse(BaseModel):
    text: str
    generated_at: str


def _get_weekly_limit(tariff: str) -> int:
    if tariff == "agency":
        return 999999
    if tariff == "strategist":
        return 100
    return CREATOR_WEEKLY_LIMIT


def _need_reset_week(user: User) -> bool:
    if not user.content_week_reset_at:
        return True
    return datetime.utcnow() >= user.content_week_reset_at


@router.post("/generate-post", response_model=GeneratePostResponse)
async def generate_post(
    payload: GeneratePostInput,
    user: User = Depends(get_current_user),
):
    from app.database import async_session
    from app.services.content_generator import generate_post_text

    async with async_session() as db:
        u = await db.get(User, user.id)
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        if _need_reset_week(u):
            u.content_generations_used_this_week = 0
            u.content_week_reset_at = datetime.utcnow() + timedelta(days=7)
        limit = _get_weekly_limit(u.tariff)
        if u.content_generations_used_this_week >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Weekly limit ({limit}) reached. Upgrade for more.",
            )
        text = await generate_post_text(payload.topic, payload.style_hint)
        u.content_generations_used_this_week += 1
        await db.commit()
    return GeneratePostResponse(
        text=text,
        generated_at=datetime.utcnow().isoformat(),
    )
