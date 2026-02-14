from app.config import settings


async def generate_post_text(topic: str, style_hint: str | None) -> str:
    if not settings.openai_api_key:
        return f"[AI placeholder] Post about: {topic}. Style: {style_hint or 'default'}. Set OPENAI_API_KEY to enable real generation."
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        prompt = f"Write a short Telegram channel post (2-4 sentences) on topic: {topic}."
        if style_hint:
            prompt += f" Style: {style_hint}."
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content or ""
    except Exception:
        return f"[Draft] Post about: {topic}. Add style: {style_hint or 'neutral'}."
