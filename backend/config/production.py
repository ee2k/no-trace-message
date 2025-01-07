class ProductionConfig:
    DEBUG = False
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB max-body-size
    RATE_LIMIT = 60  # requests per minute
    MAX_MESSAGE_SIZE = 100 * 1024  # 100KB
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    MESSAGE_EXPIRY_MAX = 7 * 24 * 60 * 60  # 7 days in seconds
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'] 