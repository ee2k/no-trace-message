from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from utils.msg_error_codes import ErrorCodes, STATUS_CODES
from utils.constants import CODE
import logging
import os
from dotenv import load_dotenv
from starlette.responses import JSONResponse

# Load environment variables
load_dotenv()

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
        try:
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
                    response_content = {
                        "detail": {
                            CODE: ErrorCodes.TOO_MANY_ATTEMPTS.value
                        }
                    }
                    logger.debug(f"Rate limit response: {response_content}")
                    return JSONResponse(
                        status_code=STATUS_CODES[ErrorCodes.TOO_MANY_REQUESTS],
                        content=response_content
                    )
                
                # Add new request
                self.ip_requests[client_ip].append(now)
                logger.info(f"Request allowed for IP {client_ip} - Total requests: {len(self.ip_requests[client_ip])}")
            
            return await call_next(request)
        except Exception as e:
            logger.error(f"Error in rate limiter: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            ) 