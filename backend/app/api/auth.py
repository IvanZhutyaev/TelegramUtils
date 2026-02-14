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
    id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int | None = None
    hash: str | None = None
    init_data: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    user_id: int
    tariff: str


def _auth_data_from_init_data(init_data: str) -> dict | None:
    from urllib.parse import parse_qs
    parsed = parse_qs(init_data, keep_blank_values=True)
    out = {}
    for k, v in parsed.items():
        if k == "user":
            import json
            u = json.loads(v[0]) if v else {}
            out["id"] = u.get("id")
            out["first_name"] = u.get("first_name", "")
            out["last_name"] = u.get("last_name", "")
            out["username"] = u.get("username", "")
        elif k in ("auth_date", "hash"):
            out[k] = v[0] if v else ""
    return out if "hash" in out and "id" in out else None


@router.post("/telegram", response_model=AuthResponse)
async def telegram_login(
    payload: TelegramAuthInput,
    db: AsyncSession = Depends(get_db),
):
    if payload.init_data:
        auth_data = _auth_data_from_init_data(payload.init_data)
        if not auth_data or not verify_telegram_auth(auth_data):
            raise HTTPException(status_code=401, detail="Invalid Telegram init_data")
        telegram_id = int(auth_data["id"])
    elif payload.id is not None and payload.hash:
        auth_data = payload.model_dump(exclude={"init_data"})
        auth_data = {k: v for k, v in auth_data.items() if v is not None}
        if not verify_telegram_auth(auth_data):
            raise HTTPException(status_code=401, detail="Invalid Telegram auth")
        telegram_id = payload.id
    else:
        raise HTTPException(status_code=400, detail="Provide init_data or telegram id+hash")
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        fn = auth_data.get("first_name") or ""
        ln = auth_data.get("last_name") or ""
        un = auth_data.get("username") or ""
        user = User(
            telegram_id=telegram_id,
            username=un,
            first_name=fn,
            last_name=ln,
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
