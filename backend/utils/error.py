class Coded_Error(Exception):
    """Base class for all errors. Automatically extracts the error code from the class name."""
    def __init__(self, code, status_code: int):
        self.code = code
        self.status_code = status_code

    def to_dict(self):
        """Convert the error to a dictionary for API responses."""
        return {"code": self.code}