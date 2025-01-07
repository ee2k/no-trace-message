from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute=6):
        super().__init__(app)
        self.requests = defaultdict(list)
        self.limit = requests_per_minute

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        
        # Skip rate limiting for non-API routes
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip] 
            if req_time > minute_ago
        ]
        
        # Check limit
        if len(self.requests[client_ip]) >= self.limit:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )
            
        # Add new request
        self.requests[client_ip].append(now)
        
        return await call_next(request) 