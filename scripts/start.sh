#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print error and exit
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to print success message
success_msg() {
    echo -e "${GREEN}$1${NC}"
}

# Function to validate environment
validate_env() {
    case $1 in
        development|staging|production)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Create logs and pid directories if they don't exist
mkdir -p logs
mkdir -p .pid

# Check if port is in use
if lsof -i :8000 > /dev/null 2>&1; then
    error_exit "Port 8000 is already in use"
fi

# Check if already running
if [ -f .pid/uvicorn.pid ]; then
    pid=$(cat .pid/uvicorn.pid)
    if ps -p $pid > /dev/null 2>&1; then
        error_exit "Server is already running with PID: $pid"
    else
        # Remove stale PID file
        rm .pid/uvicorn.pid
    fi
fi

# Prompt for environment selection
read -p "Enter environment (development/staging/production): " ENVIRONMENT

# Validate environment input
if ! validate_env "$ENVIRONMENT"; then
    error_exit "Invalid environment. Please choose development, staging, or production."
fi

# Export the environment variable so it's available to load_env.sh
export ENVIRONMENT

# Start the server explicitly without sudo
nohup ./scripts/load_env.sh --port 8000 > ./logs/app.log 2>&1 & 

# Save the PID
echo $! > .pid/uvicorn.pid
success_msg "Server started with PID: $!" 