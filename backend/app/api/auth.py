from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.services.auth import create_access_token
from app.services.telegram_auth import verify_telegram_auth

router = APIRouter()


class TelegramAuthInput(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: int
    tariff: str


@router.post("/telegram", response_model=AuthResponse)
async def telegram_login(
    payload: TelegramAuthInput,
    db: AsyncSession = Depends(get_db),
):
    auth_data = payload.model_dump()
    if not verify_telegram_auth(auth_data):
        raise HTTPException(status_code=401, detail="Invalid Telegram auth")
    result = await db.execute(
        select(User).where(User.telegram_id == payload.id)
    )
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            telegram_id=payload.id,
            username=payload.username,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    token = create_access_token({"sub": str(user.id), "telegram_id": user.telegram_id})
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        tariff=user.tariff,
    )
