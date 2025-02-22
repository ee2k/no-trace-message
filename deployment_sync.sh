#!/bin/bash
# sync changed files to remote server without a full rebuild

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

# Get the repository name from the current directory
REPO_NAME=$(basename "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")

# Configuration
if [ $# -ne 2 ]; then
    echo "Usage: $0 <remote_user> <remote_host>"
    exit 1
fi

REMOTE_USER=$1
REMOTE_HOST=$2
REMOTE_DIR="/var/www/$REPO_NAME"
echo "Syncing changed files to $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"

# Upload changed files
success_msg "Syncing changed files..."
rsync -avz \
    --exclude '.pid' \
    --exclude '.vscode' \
    --exclude 'data' \
    --exclude 'logs' \
    --exclude '.git' \
    --exclude 'venv' \
    --exclude '.env' \
    --exclude '.output' \
    --exclude '**/__pycache__' \
    --exclude '*.pyc' \
    --exclude '**/.DS_Store' \
    --exclude '.gitignore' \
    --exclude '.gitattributes' \
    --exclude './*.sh' \
    --exclude 'CHANGELOG.md' \
    ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/ || error_exit "rsync failed"

success_msg "Quick sync completed successfully!" 