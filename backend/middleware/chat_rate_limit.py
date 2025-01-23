from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from constants import CONTENT_TYPE, APPLICATION_JSON
from utils.chat_error_codes import STATUS_CODES
from utils.error_codes import CommonErrorCodes
import logging
from typing import Optional

logger = logging.getLogger("chat_rate_limiter")

class ChatRateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, limits: dict = None):
        super().__init__(app)
        self.limits = limits or {
            "message": {"user_limit": 5, "ip_limit": 20, "window_size": 60},
            "typing": {"user_limit": 10, "ip_limit": 30, "window_size": 60},
            "history": {"user_limit": 3, "ip_limit": 15, "window_size": 60}
        }
        self.user_requests = defaultdict(lambda: defaultdict(list))
        self.ip_requests = defaultdict(lambda: defaultdict(list))
        logger.info(f"ChatRateLimiter initialized with limits: {self.limits}")

    async def dispatch(self, request: Request, call_next):
        try:
            client_ip = request.client.host
            path = request.url.path
            now = datetime.now()
            user = request.state.user if hasattr(request.state, 'user') else None

            # Determine operation type based on path
            operation = self._get_operation_type(path)
            if not operation:
                return await call_next(request)

            limit_config = self.limits.get(operation)
            if not limit_config:
                return await call_next(request)

            window_size = limit_config["window_size"]
            minute_ago = now - timedelta(seconds=window_size)

            # Check user rate limit
            if user:
                self.user_requests[user.username][operation] = [
                    ts for ts in self.user_requests[user.username][operation] 
                    if ts > minute_ago
                ]
                if len(self.user_requests[user.username][operation]) >= limit_config["user_limit"]:
                    logger.warning(f"User rate limit exceeded for {user.username} on {operation}")
                    raise HTTPException(
                        status_code=STATUS_CODES[CommonErrorCodes.TOO_MANY_REQUESTS],
                        detail="Too many requests for user",
                        headers={CONTENT_TYPE: APPLICATION_JSON}
                    )

            # Check IP rate limit
            self.ip_requests[client_ip][operation] = [
                ts for ts in self.ip_requests[client_ip][operation] 
                if ts > minute_ago
            ]
            if len(self.ip_requests[client_ip][operation]) >= limit_config["ip_limit"]:
                logger.warning(f"IP rate limit exceeded for {client_ip} on {operation}")
                raise HTTPException(
                    status_code=STATUS_CODES[CommonErrorCodes.TOO_MANY_REQUESTS],
                    detail="Too many requests from IP"
                )

            # Record request
            if user:
                self.user_requests[user.username][operation].append(now)
            self.ip_requests[client_ip][operation].append(now)

            return await call_next(request)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in chat rate limiter: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=STATUS_CODES[CommonErrorCodes.SERVER_ERROR],
                detail={"code": CommonErrorCodes.SERVER_ERROR, "message": "Internal server error"},
                headers={CONTENT_TYPE: APPLICATION_JSON}
            )

    def _get_operation_type(self, path: str) -> Optional[str]:
        if "/typing" in path:
            return "typing"
        elif "/history" in path:
            return "history"
        elif "/messages/" in path:
            return "message"
        return None