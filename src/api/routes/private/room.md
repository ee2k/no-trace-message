```javascript
# Room data structure
Rooms: {
    "room_id_1": {
        "id": "room_id_1",
        "type": "private",
        "created_at": timestamp,
        "expires_at": timestamp,
        "max_participants": 6,
        "creator_token": "xxx",
        "tokens": {
            "token1": expires_at,
            "token2": expires_at
        },
        "participants": {
            "user1": {
                "status": "active",
                "joined_at": timestamp
            }
        },
        "messages": [
            {
                "id": msg_id,
                "sender": "user1",
                "content": "text",
                "type": "text/image",
                "sent_at": timestamp,
                "expires_at": timestamp  // for disappearing messages
            }
        ]
    }
}
```