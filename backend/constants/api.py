from enum import Enum, auto

class APIConstants(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name
    
    data = auto()
    meta = auto()
    error = auto()
