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
        
        # Validate model on initialization
        self._validate_model()

    def _validate_model(self):
        """Validate that the configured model is available."""
        try:
            if not self.api_key:
                logger.warning("Cannot validate model without API key")
                return
                
            # Use a simple sync call for validation during init
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If we're in an async context, schedule the validation
                    asyncio.create_task(self._async_validate_model())
                else:
                    # If not, run it directly
                    asyncio.run(self._async_validate_model())
            except RuntimeError:
                # No event loop, skip validation
                logger.warning("Cannot validate model without event loop")
        except Exception as e:
            logger.warning(f"Model validation failed: {e}")

    async def _async_validate_model(self):
        """Async model validation."""
        try:
            available_models = await self.get_available_models()
            if self.model not in available_models:
                logger.warning(f"Configured model '{self.model}' not available. Available models: {available_models}")
                # Try to use a fallback model
                fallback_models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
                for fallback in fallback_models:
                    if fallback in available_models:
                        logger.info(f"Using fallback model: {fallback}")
                        self.model = fallback
                        break
                else:
                    logger.error("No suitable fallback model found")
            else:
                logger.info(f"Model '{self.model}' is available")
        except Exception as e:
            logger.warning(f"Async model validation failed: {e}")

    async def generate_response(self, user_input: str, user_id: str, user_sessions: Dict[str, Any], custom_system_prompt: str = None) -> str:
        """Generate AI response using Groq's llama-3.1-70b-versatile (configurable)."""
        try:
            if not self.api_key:
                raise ValueError("GROQ_API_KEY is not set")
            
            session = user_sessions.get(user_id, {})
            conversation_history = session.get("conversation_history", [])

            system_prompt = custom_system_prompt or "You are a helpful AI assistant. You must respond in Kazakh language (қазақ тілі). All your responses should be in Kazakh, using proper Kazakh grammar and vocabulary. Respond naturally and conversationally. Keep responses concise but helpful."
            
            messages = [
                {
                    "role": "system",
                    "content": system_prompt,
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

            logger.info(f"Groq API request - Model: {self.model}, Messages count: {len(messages)}")
            logger.debug(f"Groq API payload: {payload}")

            resp = await self._client.post("/chat/completions", json=payload)
            
            if resp.status_code != 200:
                error_text = await resp.atext()
                logger.error(f"Groq API error {resp.status_code}: {error_text}")
                raise ValueError(f"Groq API error {resp.status_code}: {error_text}")
            
            data = resp.json()
            logger.info(f"Groq API response received successfully")
            return data["choices"][0]["message"]["content"].strip()
            
        except httpx.HTTPStatusError as e:
            error_text = await e.response.atext() if e.response else "No response body"
            logger.error(f"Groq HTTP error {e.response.status_code}: {error_text}")
            raise ValueError(f"Groq API HTTP error {e.response.status_code}: {error_text}")
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

