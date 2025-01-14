from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from utils.error_codes import ErrorCodes, CODE, STATUS_CODES
import logging
import os

# Configure logger
logger = logging.getLogger("rate_limiter")
# Get log level from environment
log_level = os.getenv("LOG_LEVEL", "info").upper()
logger.setLevel(getattr(logging, log_level))

class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, ip_limit=10, window_size=60):
        super().__init__(app)
        self.ip_limit = ip_limit
        self.window_size = window_size
        self.ip_requests = defaultdict(list)
        logger.info(f"RateLimiter initialized with limit={ip_limit} requests per {window_size} seconds")
    
    async def dispatch(self, request: Request, call_next):
        logger.debug(f"RateLimiter checking request path: {request.url.path}")
        
        # Only rate limit message creation
        if request.url.path == "/message/create":
            client_ip = request.client.host
            now = datetime.now()
            minute_ago = now - timedelta(seconds=self.window_size)
            
            logger.info(f"Rate limiting check for IP {client_ip} on path {request.url.path}")
            logger.debug(f"Current requests for IP {client_ip}: {len(self.ip_requests[client_ip])}")
            
            # Clean old requests
            self.ip_requests[client_ip] = [
                ts for ts in self.ip_requests[client_ip] 
                if ts > minute_ago
            ]
            
            logger.debug(f"Requests after cleaning for IP {client_ip}: {len(self.ip_requests[client_ip])}")
            
            # Check IP limit
            if len(self.ip_requests[client_ip]) >= self.ip_limit:
                oldest = self.ip_requests[client_ip][0]
                wait_time = (oldest + timedelta(seconds=self.window_size) - now).seconds
                logger.warning(f"Rate limit exceeded for IP {client_ip} - Count: {len(self.ip_requests[client_ip])}, Wait time: {wait_time}s")
                raise HTTPException(
                    status_code=STATUS_CODES[ErrorCodes.TOO_MANY_REQUESTS], 
                    detail={CODE: ErrorCodes.TOO_MANY_ATTEMPTS.value, "wait_time": wait_time}
                )
                
            # Add new request
            self.ip_requests[client_ip].append(now)
            logger.info(f"Request allowed for IP {client_ip} - Total requests: {len(self.ip_requests[client_ip])}")
        else:
            logger.debug(f"Path {request.url.path} not rate limited")
        
        return await call_next(request) 