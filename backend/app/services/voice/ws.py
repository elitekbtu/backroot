# app/services/voice/ws.py
from __future__ import annotations
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openai import OpenAI

from app.core.config import get_settings
from app.services.voice import AzureSpeechService

router = APIRouter()

# Lazily build clients once per worker
_settings = get_settings()
_openai = OpenAI(api_key=_settings.OPENAI_API_KEY)
_azure = AzureSpeechService(
    key=_settings.AZURE_SPEECH_KEY,
    region=_settings.AZURE_SPEECH_REGION,
    stt_locale=_settings.AZURE_SPEECH_LOCALE,      # e.g., "kk-KZ"
    tts_voice=_settings.AZURE_TTS_VOICE,           # e.g., "kk-KZ-AigulNeural"
)

@router.websocket("/ws/voice-chat")
async def websocket_voice_chat(ws: WebSocket):
    """
    Client contract:
      - Send one audio chunk (bytes) per user utterance (audio/webm; codecs=opus).
      - Receive one audio chunk (bytes) back: MP3 of the GPT reply.
    """
    await ws.accept()
    try:
        while True:
            # 1) Receive audio bytes (OGG/Opus from MediaRecorder)
            audio_bytes = await ws.receive_bytes()

            # 2) Azure STT
            user_text = _azure.stt_from_ogg_opus_bytes(audio_bytes)
            if not user_text:
                # Send empty text marker or silence mp3—here we just return empty text marker
                await ws.send_text("")   # frontend can ignore
                continue

            # 3) GPT-4o response (tourism guide persona—tweak as you wish)
            chat = _openai.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert tourism guide for Astana. Reply concisely in the user's language."},
                    {"role": "user", "content": user_text},
                ],
            )
            reply_text = chat.choices[0].message.content

            # 4) Azure TTS -> MP3 bytes (Kazakh female voice by default)
            mp3_bytes = _azure.tts_to_mp3_bytes(reply_text)

            # 5) Send audio back
            await ws.send_bytes(mp3_bytes)

    except WebSocketDisconnect:
        return
    except Exception as e:
        # Optional: send a textual error frame
        try:
            await ws.send_text(f"ERROR: {e}")
        except Exception:
            pass
