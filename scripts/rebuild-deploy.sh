#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Navigate to the project directory
# Replace '/path/to/your/project' with the actual path to your project
cd /path/to/your/project

# Pull the latest changes from the git repository
# Uncomment and modify if you want to pull from a specific branch
log "Pulling latest changes from git..."
# git pull origin main

# Stop the running containers
log "Stopping running containers..."
docker-compose down

# Remove old images (optional)
log "Removing old images..."
docker image prune -af

# Build the new Docker images
log "Building new Docker images..."
docker-compose build

# Start the new containers
log "Starting new containers..."
docker-compose up -d

# Check if the containers are running
log "Checking container status..."
docker-compose ps

# Optional: Run any post-deployment tasks
# log "Running post-deployment tasks..."
# docker-compose exec app npm run migrate

log "Deployment completed successfully!"