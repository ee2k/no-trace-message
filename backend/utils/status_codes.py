from .error_codes import CommonErrorCodes

COMMON_STATUS_CODES = {
    # Server errors
    CommonErrorCodes.SERVER_ERROR: 500,
    CommonErrorCodes.TOO_MANY_REQUESTS: 429,
    CommonErrorCodes.NOT_FOUND: 404,
    CommonErrorCodes.FORBIDDEN: 403,
    CommonErrorCodes.UNAUTHORIZED: 401,
    CommonErrorCodes.INVALID_REQUEST: 400
} 