from enum import Enum, auto

class APITags(str, Enum):
    def _generate_next_value_(name, start, count, last_values):
        return name

    message = auto
    chat = auto
    image = auto
