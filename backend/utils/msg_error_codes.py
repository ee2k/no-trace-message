from enum import Enum, auto
from .status_codes import COMMON_STATUS_CODES

class MessageErrorCodes(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    
    # create
    INVALID_EXPIRY = auto()
    INVALID_BURN = auto()
    INVALID_FONT = auto()
    MAX_IMAGES_EXCEEDED = auto()
    INVALID_FILE_TYPE = auto()
    FILE_TOO_LARGE = auto()

    # message, meta, check
    MESSAGE_NOT_FOUND = auto()

    # message
    INVALID_TOKEN = auto()
    TOO_MANY_ATTEMPTS = auto()

# HTTP status codes mapping
STATUS_CODES = {
    # All validation errors -> 400
    MessageErrorCodes.INVALID_EXPIRY: 400,
    MessageErrorCodes.INVALID_BURN: 400,
    MessageErrorCodes.INVALID_FONT: 400,
    MessageErrorCodes.MAX_IMAGES_EXCEEDED: 400,
    MessageErrorCodes.INVALID_FILE_TYPE: 400,
    MessageErrorCodes.FILE_TOO_LARGE: 400,
    MessageErrorCodes.INVALID_TOKEN: 400,
    MessageErrorCodes.TOO_MANY_ATTEMPTS: 400,
    
    # Not found -> 404
    MessageErrorCodes.MESSAGE_NOT_FOUND: 404,
    
    # Merge with common status codes
    **COMMON_STATUS_CODES
} 

# Example usage in error handling
error_response = {
    "code": MessageErrorCodes.INVALID_TOKEN,
    "message": "Invalid token provided"
} 