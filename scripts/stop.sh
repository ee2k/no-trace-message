#!/bin/bash

# Check if PID file exists
if [ ! -f .pid/uvicorn.pid ]; then
    echo "No PID file found. Server might not be running."
    # Still try to kill any running uvicorn processes
    if pkill -f "uvicorn main:app"; then
        echo "Found and stopped running uvicorn processes"
    fi
    exit 0
fi

# Read PID and try to stop gracefully
pid=$(cat .pid/uvicorn.pid)
if ps -p $pid > /dev/null 2>&1; then
    echo "Stopping server with PID: $pid"
    kill $pid
    # Also kill any uvicorn processes
    pkill -f "uvicorn main:app"
    rm .pid/uvicorn.pid
    echo "Server stopped"
else
    echo "Server not running (stale PID file)"
    # Still try to kill any running uvicorn processes
    if pkill -f "uvicorn main:app"; then
        echo "Found and stopped running uvicorn processes"
    fi
    rm .pid/uvicorn.pid
fi

# Wait a moment to ensure processes are stopped
sleep 2

# Double check no uvicorn processes are left
if pgrep -f "uvicorn main:app" > /dev/null; then
    echo "Warning: Some uvicorn processes are still running"
    pkill -9 -f "uvicorn main:app"
fi 