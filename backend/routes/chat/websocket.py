from fastapi import WebSocket, HTTPException, Depends
from fastapi.responses import JSONResponse
from utils.exceptions import APIException
from utils.chat_error_codes import ErrorCodes
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        self.active_connections[room_id] = websocket
        logger.info(f"New WebSocket connection for room {room_id}")

    async def disconnect(self, room_id: str):
        if room_id in self.active_connections:
            del self.active_connections[room_id]
            logger.info(f"WebSocket disconnected for room {room_id}")

    async def send_message(self, room_id: str, message: str):
        if room_id in self.active_connections:
            await self.active_connections[room_id].send_text(message)
            logger.debug(f"Message sent to room {room_id}")

websocket_manager = WebSocketManager()

async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """Handle WebSocket connections"""
    try:
        await websocket_manager.connect(websocket, room_id)
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages
            await websocket_manager.send_message(room_id, f"Echo: {data}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"code": ErrorCodes.SERVER_ERROR, "message": str(e)}
        )
    finally:
        await websocket_manager.disconnect(room_id) 