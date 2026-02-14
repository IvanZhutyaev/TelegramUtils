from app.config import settings


def _openai_client():
    if not settings.openai_api_key:
        return None
    from openai import AsyncOpenAI
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def generate_post_text(topic: str, style_hint: str | None) -> str:
    client = _openai_client()
    if not client:
        return f"[AI placeholder] Post about: {topic}. Style: {style_hint or 'default'}. Set OPENAI_API_KEY to enable real generation."
    try:
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


async def generate_viral_hypothesis(topic: str, niche: str | None) -> str:
    client = _openai_client()
    if not client:
        return f"[AI] Viral hypothesis for: {topic}. Niche: {niche or 'general'}. Set OPENAI_API_KEY for full analysis."
    try:
        prompt = f"Based on viral Telegram posts patterns, suggest a short 'formula of virality' for topic: {topic}."
        if niche:
            prompt += f" Niche: {niche}."
        prompt += " List 3-5 concrete tactics (hook, structure, CTA)."
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content or ""
    except Exception:
        return f"Viral hypothesis draft: {topic}. Niche: {niche or 'general'}."


async def repurpose_content(source_text: str, target_format: str) -> str:
    client = _openai_client()
    formats = {"thread": "thread of 3-5 short tweets", "stories": "3 story slides text", "teaser": "video teaser script", "article": "short article intro"}
    fmt = formats.get(target_format.lower(), target_format)
    if not client:
        return f"[AI] Repurpose to {fmt}:\n{source_text[:200]}..."
    try:
        prompt = f"Convert this post into {fmt}. Keep the main message.\n\nPost:\n{source_text[:3000]}"
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content or ""
    except Exception:
        return f"Repurposed ({fmt}): {source_text[:150]}..."


async def smart_sandwich(post_context: str) -> dict:
    client = _openai_client()
    if not client:
        return {
            "first": "First comment: ask a short question to start discussion.",
            "second": "Second: develop the topic, add one thought.",
            "third": "Third: brief summary or CTA.",
        }
    try:
        prompt = f"Post context: {post_context[:500]}. Generate engagement strategy - 3 comments. First: one short question. Second: develop discussion. Third: summary or call to action. Reply in JSON: {{\"first\": \"...\", \"second\": \"...\", \"third\": \"...\"}}"
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content or "{}"
        import json
        for start in ("{", "```"):
            if start in text:
                idx = text.find(start)
                if start == "```":
                    idx = text.find("{", idx)
                end = text.rfind("}") + 1
                if end > idx:
                    text = text[idx:end]
                    break
        data = json.loads(text)
        return {"first": data.get("first", ""), "second": data.get("second", ""), "third": data.get("third", "")}
    except Exception:
        return {"first": "What do you think?", "second": "Let's discuss.", "third": "Share your experience."}


async def reputation_reply(negative_comment: str) -> list[str]:
    client = _openai_client()
    if not client:
        return ["Thank you for feedback. We'll look into it.", "We're sorry you had this experience. Please contact us in private."]
    try:
        prompt = f"Negative comment: \"{negative_comment[:300]}\". Generate 2 short diplomatic reply templates (1-2 sentences each) to resolve conflict. Number them."
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content or ""
        lines = [l.strip() for l in text.replace("1.", "").replace("2.", "|").split("|") if l.strip()]
        return lines[:3] if lines else ["Thanks for your feedback. We'll improve."]
    except Exception:
        return ["Thank you for your feedback."]


async def mass_personal_replies(base_comment: str, count: int) -> list[str]:
    client = _openai_client()
    if not count or count > 10:
        count = 5
    if not client:
        return [f"Thanks! (variant {i+1})" for i in range(count)]
    try:
        prompt = f"Comment theme: \"{base_comment[:200]}\". Generate {count} different short personal thank-you or reply variants (1 sentence each) for similar comments. Each must be unique."
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content or ""
        lines = [l.strip().lstrip("-123456789.) ").strip() for l in text.split("\n") if l.strip()][:count]
        return lines if lines else [f"Thank you! ({i+1})" for i in range(count)]
    except Exception:
        return [f"Thanks! ({i+1})" for i in range(count)]
