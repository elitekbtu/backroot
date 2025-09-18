import logging
from typing import Dict, Any

import httpx

from app.core.config import get_settings


logger = logging.getLogger(__name__)
settings = get_settings()


class GroqClient:
    """Client for Groq chat completions using OpenAI-compatible API semantics."""

    def __init__(self):
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not set. Groq client will fail without it.")
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1"
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    async def generate_response(self, user_input: str, user_id: str, user_sessions: Dict[str, Any]) -> str:
        """Generate AI response using Groq's llama-3.1-70b-versatile (configurable)."""
        try:
            session = user_sessions.get(user_id, {})
            conversation_history = session.get("conversation_history", [])

            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise but helpful.",
                }
            ]
            for exchange in conversation_history[-10:]:
                messages.append({"role": "user", "content": exchange.get("user_input", "")})
                messages.append({"role": "assistant", "content": exchange.get("ai_response", "")})
            messages.append({"role": "user", "content": user_input})

            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 150,
                "temperature": 0.7,
            }

            resp = await self._client.post("/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"Groq generate_response error: {e}")
            raise ValueError(f"AI response generation failed: {e}")

    async def validate_api_key(self) -> bool:
        try:
            # Minimal call to verify auth; list models endpoint
            resp = await self._client.get("/models")
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Groq API key validation failed: {e}")
            return False

    async def get_available_models(self) -> list[str]:
        try:
            resp = await self._client.get("/models")
            resp.raise_for_status()
            data = resp.json()
            return [m.get("id") for m in data.get("data", [])]
        except Exception as e:
            logger.error(f"Error getting Groq models: {e}")
            return []

