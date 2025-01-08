#!/bin/bash

# Exit on any error
set -e

# Function to handle errors
handle_error() {
    echo "Error occurred in script at line: $1"
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Check if ENVIRONMENT is set
if [ -z "$ENVIRONMENT" ]; then
    echo "Error: ENVIRONMENT variable is not set"
    exit 1
fi

# Copy environment file to backend directory
if [ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
    echo "Error: .env.$ENVIRONMENT file not found"
    exit 1
fi
cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$BACKEND_DIR/.env"

# Print debug info
echo "Current directory: $(pwd)"
echo "Project root: $PROJECT_ROOT"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "Error: Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Change to backend directory
cd "$BACKEND_DIR"

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found in backend directory"
    exit 1
fi

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn is not installed"
    exit 1
fi

# Run uvicorn with port check
if echo "$*" | grep -q -- "--port 80"; then
    sudo -E uvicorn main:app --host 0.0.0.0 $@
else
    if ! echo "$*" | grep -q -- "--port"; then
        echo "Error: Port must be specified (e.g., --port 8000)"
        exit 1
    fi
    uvicorn main:app --host 0.0.0.0 $@
fi
