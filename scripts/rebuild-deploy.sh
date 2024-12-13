#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to handle errors
handle_error() {
    log "Error occurred in line $1"
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Navigate to the project directory
cd "$(dirname "$0")/.." || { log "Failed to change to project directory"; exit 1; }

# Pull the latest changes from the git repository
log "Pulling latest changes from git..."
git pull origin dev || { log "Failed to pull latest changes"; exit 1; }

# Stop the running containers
log "Stopping running containers..."
docker compose down || { log "Failed to stop containers"; exit 1; }

# Build the new Docker images
log "Building new Docker images..."
docker compose build || { log "Failed to build Docker images"; exit 1; }

# Start the new containers
log "Starting new containers..."
docker compose up -d || { log "Failed to start containers"; exit 1; }

# Check if the containers are running
log "Checking container status..."
docker compose ps

# Get the list of running containers
running_containers=$(docker compose ps --format '{{.Name}}' --filter "status=running")

# Log the names of running containers
log "Running containers:"
echo "$running_containers" | sed 's/^/  /'

# Check if all expected services are running
expected_services=("app" "db" "redis") # Adjust this list based on your docker-compose.yml
for service in "${expected_services[@]}"; do
    if ! echo "$running_containers" | grep -q "$service"; then
        log "Warning: $service is not running"
    fi
done

# Check the logs of the main application container for any startup errors
log "Checking application logs for startup errors..."
docker compose logs --tail=50 app

log "Deployment completed successfully!"

