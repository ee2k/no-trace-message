from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import logging
import os
from pathlib import Path

# Get the backend directory (root of the program)
BACKEND_ROOT = Path(__file__).parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent
logs_dir = PROJECT_ROOT / "logs"

# Ensure logs directory exists
os.makedirs(logs_dir, exist_ok=True)

# Configure logger
logger = logging.getLogger("unmatched_request_limiter")
logger.setLevel(logging.INFO)

# Create file handler
file_handler = logging.FileHandler(logs_dir / "unmatched_requests.log")
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class UnmatchedRequestLimiter(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.unmatched_requests = defaultdict(list)
        self.banned_ips = {}
        self.limits = {
            "unmatched": {"ip_limit": 10, "window_size": 60, "ban_duration": 300}
        }

    async def dispatch(self, request: Request, call_next):
        try:
            client_ip = request.client.host
            now = datetime.now()
            
            # Check if IP is banned
            if self._is_ip_banned(client_ip, now):
                logger.warning(f"Blocked banned IP: {client_ip}")
                self._log_banned_ip(client_ip, "Access attempt while banned")
                raise HTTPException(status_code=429, detail="Too many unmatched requests")
                
            response = await call_next(request)
            
            # Track unmatched requests
            if response.status_code == 404:
                self._track_unmatched_request(client_ip, now)
                self._log_unmatched_request(client_ip, request.url.path)
                
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in unmatched request limiter: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def _track_unmatched_request(self, ip: str, now: datetime):
        """Track unmatched requests and ban IP if necessary"""
        window_size = self.limits["unmatched"]["window_size"]
        minute_ago = now - timedelta(seconds=window_size)
        
        # Clean old requests
        self.unmatched_requests[ip] = [
            ts for ts in self.unmatched_requests[ip] 
            if ts > minute_ago
        ]
        
        # Add new request
        self.unmatched_requests[ip].append(now)
        
        # Check if IP should be banned
        if len(self.unmatched_requests[ip]) >= self.limits["unmatched"]["ip_limit"]:
            ban_duration = self.limits["unmatched"]["ban_duration"]
            self.banned_ips[ip] = now + timedelta(seconds=ban_duration)
            logger.warning(f"Banned IP {ip} for {ban_duration} seconds")
            self._log_banned_ip(ip, f"Banned for {ban_duration} seconds")

    def _is_ip_banned(self, ip: str, now: datetime) -> bool:
        """Check if IP is currently banned"""
        if ip in self.banned_ips:
            if now < self.banned_ips[ip]:
                return True
            # Clean up expired bans
            del self.banned_ips[ip]
            logger.info(f"Ban expired for IP: {ip}")
        return False

    def _log_unmatched_request(self, ip: str, path: str):
        """Log unmatched request to file"""
        logger.info(f"Unmatched request - IP: {ip}, Path: {path}")

    def _log_banned_ip(self, ip: str, action: str):
        """Log banned IP activity to file"""
        logger.info(f"Banned IP activity - IP: {ip}, Action: {action}") 