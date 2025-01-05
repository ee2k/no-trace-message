# Message request format

## request url

```
https://domain/api/message/create
```

# Message response format
```json
{
  "id": "abc123xyz789",
  "token": "secure_random_token_here",
  "expires_at": "2024-02-20T15:30:00Z",
}
```

# Burn message URL format
```
https://domain/message/messageID

# custom token
https://domain/message/messageID?token=one_time_token
```
