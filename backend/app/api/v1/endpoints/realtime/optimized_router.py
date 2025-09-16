import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .optimized_service import optimized_realtime_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/{user_id}/audio")
async def optimized_realtime_audio_websocket(websocket: WebSocket, user_id: str):
    """Optimized WebSocket для обработки аудио в реальном времени с OpenAI Realtime API."""
    logger.info(f"Optimized WebSocket connection attempt for user {user_id}")
    
    try:
        await websocket.accept()
        logger.info(f"Optimized Realtime Audio WebSocket connected for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to accept WebSocket connection for user {user_id}: {e}")
        return
    
    session = None
    try:
        # Create session
        logger.info(f"Creating optimized session for user {user_id}")
        session = await optimized_realtime_service.create_session(user_id)
        logger.info(f"Session created: {session.session_id}")
        
        # Start realtime connection
        if not await optimized_realtime_service.start_realtime_connection(session.session_id, websocket):
            logger.error(f"Failed to start realtime connection for session {session.session_id}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": "Failed to start realtime connection"
            }))
            return
        
        # Send session created message
        await websocket.send_text(json.dumps({
            "type": "session_created",
            "session_id": session.session_id,
            "message": "Оптимизированная аудио сессия готова!"
        }))
        logger.info(f"Session created message sent for session {session.session_id}")
        
        # Main message processing loop
        logger.info(f"Starting optimized message processing loop for session {session.session_id}")
        while True:
            try:
                logger.debug(f"Waiting for message from session {session.session_id}")
                data = await websocket.receive_text()
                logger.debug(f"Received message from session {session.session_id}: {data[:100]}...")
                message = json.loads(data)
                
                if message.get("type") == "audio" and message.get("audio_data"):
                    logger.info(f"Processing audio for session {session.session_id}")
                    
                    # Decode base64 audio data
                    import base64
                    audio_data = base64.b64decode(message["audio_data"])
                    logger.info(f"Decoded audio data: {len(audio_data)} bytes")
                    
                    # Send audio to OpenAI Realtime API
                    success = await optimized_realtime_service.send_audio_to_realtime(
                        session.session_id,
                        audio_data
                    )
                    
                    if success:
                        logger.info(f"Audio sent to OpenAI Realtime API for session {session.session_id}")
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": "Ошибка отправки аудио в OpenAI Realtime API"
                        }))
                        logger.error(f"Failed to send audio to OpenAI Realtime API for session {session.session_id}")
                
                elif message.get("type") == "commit_audio":
                    # Commit audio buffer
                    success = await optimized_realtime_service.commit_audio(session.session_id)
                    if success:
                        logger.info(f"Audio committed for session {session.session_id}")
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": "Ошибка коммита аудио"
                        }))
                
                elif message.get("type") == "create_response":
                    # Create response
                    success = await optimized_realtime_service.create_response(session.session_id)
                    if success:
                        logger.info(f"Response creation requested for session {session.session_id}")
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": "Ошибка создания ответа"
                        }))
                        
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session {session.session_id}")
                break
            except Exception as e:
                logger.error(f"Error processing message for session {session.session_id}: {e}")
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "error": str(e)
                    }))
                except:
                    logger.error(f"Failed to send error message to session {session.session_id}")
                    break
                    
    except WebSocketDisconnect:
        logger.info(f"Optimized Realtime Audio WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Optimized Realtime Audio WebSocket error for user {user_id}: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": str(e)
            }))
        except:
            pass
    finally:
        if session:
            await optimized_realtime_service.end_session(session.session_id)