import hashlib
import hmac
from app.config import settings


def verify_telegram_auth(auth_data: dict) -> bool:
    check_hash = auth_data.get("hash")
    if not check_hash:
        return False
    auth_data_str = {k: str(v) for k, v in auth_data.items() if k != "hash"}
    data_check_string = "\n".join(
        f"{k}={auth_data_str[k]}" for k in sorted(auth_data_str)
    )
    secret_key = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    calculated = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(calculated, check_hash)
