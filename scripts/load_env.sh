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

# Check if virtual environment exists, create if it doesn't
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo "Creating virtual environment..."
    python3.11 -m venv "$PROJECT_ROOT/venv"
fi

# Activate virtual environment
source "$PROJECT_ROOT/venv/bin/activate"

# Verify Python version after activation
PYTHON_VERSION=$(python3 --version)
if [[ "$PYTHON_VERSION" != "Python 3.11"* ]]; then
    echo "Error: Wrong Python version after venv activation. Found: $PYTHON_VERSION"
    exit 1
fi

# Install requirements if needed
if ! pip show uvicorn > /dev/null 2>&1 || ! pip show websockets > /dev/null 2>&1; then
    echo "Installing requirements..."
    pip install -r "$PROJECT_ROOT/requirements.txt"
    pip install 'uvicorn[standard]'  # Add WebSocket support
fi

# After installation
if ! pip show websockets > /dev/null 2>&1; then
    echo "Error: websockets package not installed"
    exit 1
fi

# Check if ENVIRONMENT is set
if [ -z "$ENVIRONMENT" ]; then
    echo "Error: ENVIRONMENT variable is not set"
    exit 1
fi

# Copy environment file to backend directory
if [ ! -f "$PROJECT_ROOT/env/.env.$ENVIRONMENT" ]; then
    echo "Error: .env.$ENVIRONMENT file not found"
    exit 1
fi
cp "$PROJECT_ROOT/env/.env.$ENVIRONMENT" "$BACKEND_DIR/.env"

# Print debug info
echo "Current directory: $(pwd)"
echo "Project root: $PROJECT_ROOT"
echo "Python path: $(which python)"
echo "Python version: $(python --version)"
echo "Uvicorn path: $(which uvicorn)"

# Change to backend directory
cd "$BACKEND_DIR"

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found in backend directory"
    exit 1
fi

# Start uvicorn with hot reload in development
if [ "$ENVIRONMENT" = "development" ]; then
    exec uvicorn main:app --reload --host 0.0.0.0 --port "${1:-8000}" "$@"
else
    exec uvicorn main:app --host 0.0.0.0 --port "${1:-8000}" "$@"
fi
