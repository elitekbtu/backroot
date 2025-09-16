import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import HTTPBearer
from app.core.security import decode_token
from .service import realtime_service
from .schema import RealtimeConnectionInfo

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


async def get_current_user_id(token: str = Depends(security)) -> str:
    """Get current user ID from token."""
    try:
        payload = decode_token(token.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return str(user_id)
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


@router.websocket("/realtime/{user_id}")
async def realtime_websocket(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for realtime voice communication with OpenAI.
    
    This endpoint provides real-time voice interaction using OpenAI's Realtime API.
    Users can speak and receive AI responses in real-time.
    
    Args:
        websocket: WebSocket connection
        user_id: User identifier for the session
    
    Message Types:
        - session.update: Update session configuration
        - conversation.item.input: Send audio or text input
        - conversation.item.create: Create new conversation item
        - conversation.item.update: Update existing conversation item
        - conversation.item.delete: Delete conversation item
        - ping: Ping for connection health check
    
    Response Types:
        - session.update: Session configuration updates
        - response.audio: Audio response from AI
        - response.delta: Partial text response from AI
        - response.done: Complete response from AI
        - conversation.item.created: New conversation item created
        - conversation.item.updated: Conversation item updated
        - conversation.item.deleted: Conversation item deleted
        - error: Error messages
        - pong: Ping response
    """
    try:
        # Connect user to realtime service
        await realtime_service.connect(websocket, user_id)
        
        # Handle WebSocket messages
        while True:
            try:
                # Receive message
                message = await websocket.receive_text()
                
                # Handle the message
                await realtime_service.handle_message(websocket, user_id, message)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message for user {user_id}: {e}")
                await websocket.send_text(f'{{"type": "error", "error": {{"code": "internal_error", "message": "{str(e)}"}}}}')
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Disconnect user from realtime service
        await realtime_service.disconnect(user_id)


@router.websocket("/realtime")
async def realtime_websocket_authenticated(websocket: WebSocket, user_id: str = Depends(get_current_user_id)):
    """
    Authenticated WebSocket endpoint for realtime voice communication.
    
    This endpoint requires authentication and provides real-time voice interaction
    using OpenAI's Realtime API.
    
    Args:
        websocket: WebSocket connection
        user_id: User identifier from authenticated token
    
    Message Types and Responses are the same as /realtime/{user_id}
    """
    try:
        # Connect user to realtime service
        await realtime_service.connect(websocket, user_id)
        
        # Handle WebSocket messages
        while True:
            try:
                # Receive message
                message = await websocket.receive_text()
                
                # Handle the message
                await realtime_service.handle_message(websocket, user_id, message)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message for user {user_id}: {e}")
                await websocket.send_text(f'{{"type": "error", "error": {{"code": "internal_error", "message": "{str(e)}"}}}}')
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Disconnect user from realtime service
        await realtime_service.disconnect(user_id)


@router.get("/realtime/status")
async def get_realtime_status():
    """
    Get the status of the realtime service.
    
    Returns:
        dict: Service status information
    """
    return {
        "status": "active",
        "active_connections": len(realtime_service.active_connections),
        "openai_connections": len(realtime_service.openai_connections),
        "model": realtime_service.model
    }


@router.get("/realtime/health")
async def health_check():
    """
    Health check endpoint for the realtime service.
    
    Returns:
        dict: Health status
    """
    return {
        "status": "healthy",
        "service": "realtime",
        "version": "1.0.0"
    }