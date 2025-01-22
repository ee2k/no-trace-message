from enum import Enum, auto

class CommonErrorCodes(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    
    # General errors
    SERVER_ERROR = auto()
    INVALID_REQUEST = auto()
    UNAUTHORIZED = auto()
    TOO_MANY_REQUESTS = auto()
    NOT_FOUND = auto()
    FORBIDDEN = auto()