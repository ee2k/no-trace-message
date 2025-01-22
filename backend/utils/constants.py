# from enum import Enum, auto

# class Constants(str, Enum):
#     def _generate_next_value_(name, start, count, last_values):
#         return name
    
#     # Response fields
#     code = auto()
#     message = auto()
#     status = auto()
#     ok = auto()
    
#     # API response structure
#     error = auto()
#     data = auto()
#     meta = auto()
    
#     # Common status values
#     success = auto()
#     failure = auto()
#     pending = auto()
    
#     # HTTP headers
#     Authorization = auto()

# # HTTP headers (not part of the enum)
# CONTENT_TYPE = "Content-Type"
# application_json = "application/json"

# # Create direct references for easier access
# code = Constants.code
# message = Constants.message
# status = Constants.status
# ok = Constants.ok
# error = Constants.error
# data = Constants.data
# meta = Constants.meta
# success = Constants.success
# failure = Constants.failure
# pending = Constants.pending
# Authorization = Constants.Authorization