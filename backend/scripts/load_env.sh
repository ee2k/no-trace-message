#!/bin/bash
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
cd "$BACKEND_DIR"

if [ "$ENVIRONMENT" = "production" ]; then
    cp .env.production .env
else
    cp .env.development .env
fi

# Print debug info
echo "Current directory: $(pwd)"
echo "Project root: $PROJECT_ROOT"

# Check if port 80 is requested (fixed syntax)
if echo "$*" | grep -q -- "--port 80"; then
    sudo -E uvicorn main:app $@
else
    sudo -E uvicorn main:app --port 80 $@
fi
