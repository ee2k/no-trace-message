from enum import Enum, auto

class ErrorCodes(str, Enum):
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
    
    # General
    SERVER_ERROR = auto()

    # Rate limiting
    TOO_MANY_REQUESTS = auto()

# HTTP status codes mapping
STATUS_CODES = {
    # All validation errors -> 400
    ErrorCodes.INVALID_EXPIRY: 400,
    ErrorCodes.INVALID_BURN: 400,
    ErrorCodes.INVALID_FONT: 400,
    ErrorCodes.MAX_IMAGES_EXCEEDED: 400,
    ErrorCodes.INVALID_FILE_TYPE: 400,
    ErrorCodes.FILE_TOO_LARGE: 400,
    ErrorCodes.INVALID_TOKEN: 400,
    ErrorCodes.TOO_MANY_ATTEMPTS: 400,
    
    # Rate limiting -> 429
    ErrorCodes.TOO_MANY_REQUESTS: 429,
    
    # Not found -> 404
    ErrorCodes.MESSAGE_NOT_FOUND: 404,
    
    # Server errors -> 500
    ErrorCodes.SERVER_ERROR: 500,
} 