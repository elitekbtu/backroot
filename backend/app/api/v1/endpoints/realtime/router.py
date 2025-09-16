import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import HTTPBearer
from app.core.security import decode_token
from .service import realtime_service
from .schema import RealtimeRequest, RealtimeResponse

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

async def get_current_user_id(token: str = Depends(security)) -> str:
    """Получить ID пользователя из токена"""
    try:
        payload = decode_token(token.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return str(user_id)
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.websocket("/ws/{user_id}")
async def realtime_websocket(websocket: WebSocket, user_id: str):
    """НЕПРЕРЫВНОЕ realtime WebSocket соединение"""
    await websocket.accept()
    logger.info(f"Realtime WebSocket connected for user {user_id}")
    
    session = None
    try:
        # Создаем сессию
        session = await realtime_service.create_session(user_id)
        await websocket.send_text(json.dumps({
            "type": "session_created",
            "session_id": session.session_id,
            "message": "НЕПРЕРЫВНАЯ сессия начата!"
        }))
        
        # Запускаем НЕПРЕРЫВНОЕ realtime соединение
        async for event in realtime_service.start_realtime_connection(session.session_id):
            await websocket.send_text(json.dumps(event))
            
            # Если это ошибка, прерываем соединение
            if event.get("type") == "error":
                break
                
    except WebSocketDisconnect:
        logger.info(f"Realtime WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Realtime WebSocket error for user {user_id}: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": str(e)
            }))
        except:
            pass
    finally:
        if session:
            await realtime_service.end_session(session.session_id)

@router.websocket("/ws/{user_id}/audio")
async def realtime_audio_websocket(websocket: WebSocket, user_id: str):
    """WebSocket для обработки аудио в реальном времени"""
    logger.info(f"WebSocket connection attempt for user {user_id}")
    
    try:
        await websocket.accept()
        logger.info(f"Realtime Audio WebSocket connected for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to accept WebSocket connection for user {user_id}: {e}")
        return
    
    session = None
    try:
        # Создаем сессию
        logger.info(f"Creating session for user {user_id}")
        session = await realtime_service.create_session(user_id)
        logger.info(f"Session created: {session.session_id}")
        
        # Регистрируем соединение для аудио обработки
        realtime_service.realtime_connections[session.session_id] = {
            "session": session,
            "is_connected": True,
            "websocket": websocket
        }
        logger.info(f"Connection registered for session {session.session_id}")
        
        await websocket.send_text(json.dumps({
            "type": "session_created",
            "session_id": session.session_id,
            "message": "Аудио сессия готова!"
        }))
        logger.info(f"Session created message sent for session {session.session_id}")
        
        # Обрабатываем входящие сообщения
        logger.info(f"Starting message processing loop for session {session.session_id}")
        while True:
            try:
                logger.debug(f"Waiting for message from session {session.session_id}")
                data = await websocket.receive_text()
                logger.debug(f"Received message from session {session.session_id}: {data[:100]}...")
                message = json.loads(data)
                
                if message.get("type") == "audio" and message.get("audio_data"):
                    logger.info(f"Processing audio for session {session.session_id}")
                    # Обрабатываем аудио
                    audio_format = message.get("format", "webm")
                    success = await realtime_service.send_audio_to_realtime(
                        session.session_id,
                        message["audio_data"],
                        audio_format
                    )
                    
                    if success:
                        # Get the AI response from the connection
                        response_data = realtime_service.realtime_connections.get(session.session_id)
                        if response_data and "text_response" in response_data:
                            # Send the AI response back to the frontend
                            await websocket.send_text(json.dumps({
                                "type": "text",
                                "content": response_data["text_response"],
                                "session_id": session.session_id
                            }))
                            logger.info(f"Sent AI response to frontend for session {session.session_id}")
                            
                            # Clear the response from the connection
                            del response_data["text_response"]
                        
                        # Also send confirmation
                        await websocket.send_text(json.dumps({
                            "type": "status",
                            "status": "audio_processed",
                            "session_id": session.session_id
                        }))
                        logger.info(f"Audio processed successfully for session {session.session_id}")
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": "Ошибка обработки аудио"
                        }))
                        logger.error(f"Audio processing failed for session {session.session_id}")
                        
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session {session.session_id}")
                break
            except Exception as e:
                logger.error(f"Error processing audio message for session {session.session_id}: {e}")
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "error": str(e)
                    }))
                except:
                    logger.error(f"Failed to send error message to session {session.session_id}")
                    break
                
    except WebSocketDisconnect:
        logger.info(f"Realtime Audio WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"Realtime Audio WebSocket error for user {user_id}: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": str(e)
            }))
        except:
            pass
    finally:
        if session:
            # Очищаем соединение из realtime_connections
            if session.session_id in realtime_service.realtime_connections:
                del realtime_service.realtime_connections[session.session_id]
            await realtime_service.end_session(session.session_id)

@router.post("/start", response_model=RealtimeResponse)
async def start_realtime_session(user_id: str = Depends(get_current_user_id)):
    """Начать новую realtime сессию"""
    try:
        session = await realtime_service.create_session(user_id)
        return RealtimeResponse(
            type="session_created",
            session_id=session.session_id,
            status="active"
        )
    except Exception as e:
        logger.error(f"Error starting realtime session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-audio", response_model=RealtimeResponse)
async def send_audio_to_session(
    request: RealtimeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Отправить аудио в realtime сессию"""
    try:
        if not request.session_id or not request.audio_chunk:
            raise HTTPException(status_code=400, detail="Session ID and audio data required")
        
        success = await realtime_service.send_audio_to_realtime(
            request.session_id, 
            request.audio_chunk.data
        )
        
        if success:
            return RealtimeResponse(
                type="audio_received",
                session_id=request.session_id,
                status="processing"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to process audio")
            
    except Exception as e:
        logger.error(f"Error sending audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/end", response_model=RealtimeResponse)
async def end_realtime_session(
    request: RealtimeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Завершить realtime сессию"""
    try:
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        await realtime_service.end_session(request.session_id)
        return RealtimeResponse(
            type="session_ended",
            session_id=request.session_id,
            status="inactive"
        )
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_realtime_status():
    """Получить статус realtime сервиса"""
    return {
        "active_sessions": len(realtime_service.active_sessions),
        "status": "running"
    }