#!/bin/bash
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Copy environment file to backend directory
if [ "$ENVIRONMENT" = "production" ]; then
    cp "$PROJECT_ROOT/.env.production" "$BACKEND_DIR/.env"
else
    cp "$PROJECT_ROOT/.env.development" "$BACKEND_DIR/.env"
fi

# Print debug info
echo "Current directory: $(pwd)"
echo "Project root: $PROJECT_ROOT"

# Change to backend directory
cd "$BACKEND_DIR"

# Check if port 80 is requested (fixed syntax)
if echo "$*" | grep -q -- "--port 80"; then
    sudo -E uvicorn main:app $@
else
    sudo -E uvicorn main:app --port 80 $@
fi
