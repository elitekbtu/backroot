from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any

from .v2v_service import v2v_service
from .websocket_handler import v2v_websocket_handler
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/voice", tags=["voice"])


@router.websocket("/ws/v2v/{user_id}")
async def v2v_websocket(websocket: WebSocket, user_id: str):
    """V2V WebSocket endpoint for voice-to-voice communication."""
    await v2v_websocket_handler(websocket, user_id)


@router.get("/status")
async def get_voice_service_status():
    """Get voice service status."""
    try:
        # Check OpenAI API key validation
        from .openai_client import OpenAIClient
        openai_client = OpenAIClient()
        api_key_valid = await openai_client.validate_api_key()
        
        return {
            "status": "operational" if api_key_valid else "error",
            "openai_api_key_valid": api_key_valid,
            "active_connections": len(v2v_service.active_connections),
            "active_sessions": len(v2v_service.user_sessions)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/test-models")
async def test_openai_models():
    """Test if all OpenAI models (GPT, TTS, STT) are working correctly."""
    try:
        model_test_results = await v2v_service.test_models()
        
        return {
            "status": "success",
            "models": model_test_results,
            "message": "Model testing completed"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to test models"
        }


@router.get("/models")
async def get_openai_models():
    """Get available OpenAI models."""
    try:
        from .openai_client import OpenAIClient
        openai_client = OpenAIClient()
        available_models = await openai_client.get_available_models()
        
        return {
            "status": "success",
            "available_models": available_models,
            "configured_models": {
                "gpt": openai_client.gpt_model,
                "tts": openai_client.tts_model,
                "stt": openai_client.stt_model
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to get available models"
        }


@router.get("/sessions/{user_id}")
async def get_user_session_info(
    user_id: str,
    current_user = Depends(get_current_user_from_token)
):
    """Get information about a user's voice session."""
    try:
        # Verify user can only access their own session
        if str(current_user.id) != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        session = v2v_service.user_sessions.get(user_id, {})
        if not session:
            raise HTTPException(status_code=404, detail="User session not found")
        
        return {
            "user_id": user_id,
            "connected_at": session.get("connected_at"),
            "is_processing": session.get("is_processing", False),
            "conversation_count": len(session.get("conversation_history", []))
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving session info: {str(e)}")


@router.delete("/sessions/{user_id}")
async def clear_user_session(
    user_id: str,
    current_user = Depends(get_current_user_from_token)
):
    """Clear a user's voice session and conversation history."""
    try:
        # Verify user can only clear their own session
        if str(current_user.id) != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        await v2v_service.clear_conversation_history_by_id(user_id)
        return {"message": "User session cleared successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing session: {str(e)}")


@router.get("/stats")
async def get_voice_service_stats(
    current_user = Depends(get_current_user_from_token)
):
    """Get voice service statistics."""
    try:
        total_conversations = sum(
            len(session.get("conversation_history", []))
            for session in v2v_service.user_sessions.values()
        )
        
        return {
            "active_connections": len(v2v_service.active_connections),
            "active_sessions": len(v2v_service.user_sessions),
            "total_conversations": total_conversations,
            "service_status": "operational"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")
