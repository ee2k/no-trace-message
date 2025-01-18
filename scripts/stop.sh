#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.pid/uvicorn.pid"

# Function to print messages
success_msg() {
    echo -e "${GREEN}$1${NC}"
}

warning_msg() {
    echo -e "${RED}$1${NC}"
}

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    warning_msg "No PID file found. Server might not be running."
    # Still try to kill any running uvicorn processes
    if pkill -f "uvicorn main:app"; then
        success_msg "Found and stopped running uvicorn processes"
    fi
    exit 0
fi

# Read PID and try to stop gracefully
pid=$(cat "$PID_FILE")
if ps -p $pid > /dev/null 2>&1; then
    echo "Stopping server with PID: $pid"
    kill $pid
    # Also kill any uvicorn processes
    pkill -f "uvicorn main:app"
    rm "$PID_FILE"
    success_msg "Server stopped"
else
    warning_msg "Server not running (stale PID file)"
    # Still try to kill any running uvicorn processes
    if pkill -f "uvicorn main:app"; then
        success_msg "Found and stopped running uvicorn processes"
    fi
    rm "$PID_FILE"
fi

# Wait a moment to ensure processes are stopped
sleep 2

# Double check no uvicorn processes are left
if pgrep -f "uvicorn main:app" > /dev/null; then
    warning_msg "Some uvicorn processes are still running. Force stopping..."
    pkill -9 -f "uvicorn main:app"
    success_msg "All processes stopped"
fi 