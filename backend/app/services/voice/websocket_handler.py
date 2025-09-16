import json
import logging
from fastapi import WebSocket, WebSocketDisconnect

from .v2v_service import v2v_service

logger = logging.getLogger(__name__)


async def v2v_websocket_handler(websocket: WebSocket, user_id: str):
    """Main WebSocket handler for V2V service."""
    try:
        # Accept the WebSocket connection
        await websocket.accept()
        
        # Basic validation - user_id should be a valid format
        if not user_id or user_id.strip() == "":
            await websocket.close(1008, "Invalid user ID")
            return
        
        # Connect user to V2V service
        await v2v_service.connect(websocket, user_id)
        
        # Handle WebSocket messages
        while True:
            try:
                # Receive message
                message = await websocket.receive_text()
                
                # Handle the message
                await v2v_service.handle_message(websocket, user_id, message)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Internal server error: {str(e)}"
                }))
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Disconnect user from V2V service
        await v2v_service.disconnect(user_id)


async def handle_v2v_websocket(websocket: WebSocket, user_id: str):
    """Alternative handler function for FastAPI WebSocket endpoint."""
    return await v2v_websocket_handler(websocket, user_id)
