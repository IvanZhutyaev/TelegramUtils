from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.api.deps import get_current_user
from app.models import User
from app.database import async_session
from app.services import content_generator

router = APIRouter()

CREATOR_WEEKLY_LIMIT = 5


class GeneratePostInput(BaseModel):
    topic: str
    channel_id: int | None = None
    style_hint: str | None = None


class GeneratePostResponse(BaseModel):
    text: str
    generated_at: str


class ViralHypothesisInput(BaseModel):
    topic: str
    niche: str | None = None


class RepurposeInput(BaseModel):
    source_text: str
    target_format: str


class SmartSandwichInput(BaseModel):
    post_context: str


class ReputationInput(BaseModel):
    negative_comment: str


class MassPersonalInput(BaseModel):
    base_comment: str
    count: int = 5


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


async def _consume_generation(user_id: int) -> None:
    async with async_session() as db:
        u = await db.get(User, user_id)
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        if _need_reset_week(u):
            u.content_generations_used_this_week = 0
            u.content_week_reset_at = datetime.utcnow() + timedelta(days=7)
        limit = _get_weekly_limit(u.tariff)
        if u.content_generations_used_this_week >= limit:
            raise HTTPException(status_code=429, detail=f"Weekly limit ({limit}) reached.")
        u.content_generations_used_this_week += 1
        await db.commit()


@router.post("/generate-post", response_model=GeneratePostResponse)
async def generate_post(
    payload: GeneratePostInput,
    user: User = Depends(get_current_user),
):
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
        text = await content_generator.generate_post_text(payload.topic, payload.style_hint)
        u.content_generations_used_this_week += 1
        await db.commit()
    return GeneratePostResponse(
        text=text,
        generated_at=datetime.utcnow().isoformat(),
    )


@router.post("/viral-hypothesis")
async def viral_hypothesis(
    payload: ViralHypothesisInput,
    user: User = Depends(get_current_user),
):
    await _consume_generation(user.id)
    text = await content_generator.generate_viral_hypothesis(payload.topic, payload.niche)
    return {"text": text, "generated_at": datetime.utcnow().isoformat()}


@router.post("/repurpose")
async def repurpose(
    payload: RepurposeInput,
    user: User = Depends(get_current_user),
):
    await _consume_generation(user.id)
    text = await content_generator.repurpose_content(payload.source_text, payload.target_format)
    return {"text": text, "target_format": payload.target_format, "generated_at": datetime.utcnow().isoformat()}


@router.post("/smart-sandwich")
async def smart_sandwich(
    payload: SmartSandwichInput,
    user: User = Depends(get_current_user),
):
    await _consume_generation(user.id)
    data = await content_generator.smart_sandwich(payload.post_context)
    return {"comments": data, "generated_at": datetime.utcnow().isoformat()}


@router.post("/reputation-templates")
async def reputation_templates(
    payload: ReputationInput,
    user: User = Depends(get_current_user),
):
    await _consume_generation(user.id)
    templates = await content_generator.reputation_reply(payload.negative_comment)
    return {"templates": templates, "generated_at": datetime.utcnow().isoformat()}


@router.post("/mass-personal-reply")
async def mass_personal_reply(
    payload: MassPersonalInput,
    user: User = Depends(get_current_user),
):
    await _consume_generation(user.id)
    replies = await content_generator.mass_personal_replies(payload.base_comment, min(payload.count, 10))
    return {"replies": replies, "generated_at": datetime.utcnow().isoformat()}
