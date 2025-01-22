from enum import Enum, auto

class ResponseConstants(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    
    code = auto()
    message = auto()
    status = auto()
    ok = auto() 