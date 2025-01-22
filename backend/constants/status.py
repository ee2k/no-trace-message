from enum import Enum, auto

class StatusConstants(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    
    success = auto()
    failure = auto()
    pending = auto() 