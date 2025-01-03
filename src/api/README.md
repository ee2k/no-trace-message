# Message request format

## request url

```
https://domain/api/message/create
```

## request body

```json
{
  "content": {
    "text": "Your secret message here",
    "images": [
      {
        "data": "base64_encoded_image_string",
        "type": "image/jpeg"
      }
    ]
  },
  "settings": {
    "expiryMinutes": 60,  // Time until message expires if not read (1-4320 minutes)
    "burnSeconds": 7.0    // Time message remains visible after reading (0.1-600 seconds)
  }
}
```

# Message response format
```json
{
  "id": "abc123xyz789",
  "token": "secure_random_token_here",
  "expires_at": "2024-02-20T15:30:00Z",
  // "url": "https://domain/message/abc123xyz789?token=secure_random_token_here"
}
```

# Burn message URL format
```
https://domain/message/messageID?token=one_time_token
```

## request body
```json
{
  "id": "abc123xyz789"
}
```