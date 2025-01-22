from .api import APIConstants
from .http import AUTH_HEADER, CONTENT_TYPE, APPLICATION_JSON
from .response import ResponseConstants
from .status import StatusConstants

# Create direct references for easier access
code = ResponseConstants.code
message = ResponseConstants.message
status = ResponseConstants.status
ok = ResponseConstants.ok
data = APIConstants.data
meta = APIConstants.meta
error = APIConstants.error
success = StatusConstants.success
failure = StatusConstants.failure
pending = StatusConstants.pending
