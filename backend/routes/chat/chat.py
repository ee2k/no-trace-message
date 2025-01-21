from fastapi import APIRouter

router = APIRouter()

# Route definitions with metadata
routes = {
    "/ws/{room_id}": {
        "method": "WEBSOCKET",
        "summary": "Connect to chat websocket"
    },
    "/{room_id}/history": {
        "method": "GET",
        "summary": "Get chat history"
    },
    "/{room_id}/messages/{message_id}/read": {
        "method": "PUT",
        "summary": "Update message read status"
    },
    "/{room_id}/typing": {
        "method": "POST",
        "summary": "Update typing status"
    }
}

# Handler functions will go here
# Route registration will go here (similar to private/room.py)
