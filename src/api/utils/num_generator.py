import random
import string
from typing import Callable

def generate_message_id(
    length: int = 10,
    exists_check: Callable[[str], bool] = lambda _: False,
    max_attempts: int = 5
) -> str:
    """
    Generate a random message ID with collision checking.
    
    Args:
        length: Length of the ID (default: 10)
        exists_check: Function to check if ID exists
        max_attempts: Maximum number of generation attempts (default: 5)
    
    Returns:
        str: Generated unique ID
        
    Raises:
        RuntimeError: If unable to generate unique ID after max attempts
    """
    chars = string.ascii_letters + string.digits  # [0-9a-zA-Z]
    
    for attempt in range(max_attempts):
        # Generate random ID
        message_id = ''.join(random.choices(chars, k=length))
        
        # Check if ID exists
        if not exists_check(message_id):
            return message_id
            
    raise RuntimeError(f"Failed to generate unique message ID after {max_attempts} attempts")

def generate_access_token(length: int = 8) -> str:
    """
    Generate a random access token.
    
    Args:
        length: Length of the token (default: 8)
    
    Returns:
        str: Generated token
    """
    chars = string.ascii_letters + string.digits  # [0-9a-zA-Z]
    return ''.join(random.choices(chars, k=length)) 