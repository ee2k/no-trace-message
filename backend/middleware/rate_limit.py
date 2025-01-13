from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from utils.error_codes import ErrorCodes, CODE, STATUS_CODES

class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, browser_limit=3, ip_limit=10, window_size=60):
        super().__init__(app)
        self.browser_limit = browser_limit  # 3 per minute
        self.ip_limit = ip_limit  # 10 per minute
        self.window_size = window_size  # 60 seconds
        self.ip_requests = defaultdict(list)  # {ip: [timestamp, timestamp, ...]}
        
    async def dispatch(self, request: Request, call_next):
        # Only rate limit message creation
        if request.url.path != "/api/message/create":
            return await call_next(request)
            
        client_ip = request.client.host
        now = datetime.now()
        minute_ago = now - timedelta(seconds=self.window_size)
        
        # Clean old requests
        self.ip_requests[client_ip] = [
            ts for ts in self.ip_requests[client_ip] 
            if ts > minute_ago
        ]
        
        # Check IP limit
        if len(self.ip_requests[client_ip]) >= self.ip_limit:
            oldest = self.ip_requests[client_ip][0]
            wait_time = (oldest + timedelta(seconds=self.window_size) - now).seconds
            raise HTTPException(status_code=STATUS_CODES[ErrorCodes.TOO_MANY_REQUESTS], detail={CODE: ErrorCodes.TOO_MANY_ATTEMPTS.value, "wait_time": wait_time})
            
        # Add new request
        self.ip_requests[client_ip].append(now)
        
        return await call_next(request) 