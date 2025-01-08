#!/bin/bash

# Create logs and pid directories if they don't exist
mkdir -p logs
mkdir -p .pid

# Check if port is in use
if lsof -i :8000 > /dev/null 2>&1; then
    echo "Error: Port 8000 is already in use"
    exit 1
fi

# Check if already running
if [ -f .pid/uvicorn.pid ]; then
    pid=$(cat .pid/uvicorn.pid)
    if ps -p $pid > /dev/null 2>&1; then
        echo "Server is already running with PID: $pid"
        exit 1
    else
        # Remove stale PID file
        rm .pid/uvicorn.pid
    fi
fi

# Start the server explicitly without sudo
ENVIRONMENT=staging nohup ./scripts/load_env.sh --port 8000 > ./logs/app.log 2>&1 & 

# Save the PID
echo $! > .pid/uvicorn.pid
echo "Server started with PID: $!" 