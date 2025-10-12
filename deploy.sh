#!/bin/bash

# Queen Hills Backend Deployment Script
# This script deploys the NestJS backend to a VPS

set -e

echo "🚀 Starting Queen Hills Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="queen-hills-backend"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if environment file exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file $ENV_FILE not found. Creating from template..."
        cp .env.example "$ENV_FILE"
        print_warning "Please update $ENV_FILE with your production values"
        exit 1
    fi
    print_status "Environment file found"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Build and start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build
    
    print_status "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for database
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T db pg_isready -U postgres > /dev/null 2>&1; then
            print_status "Database is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within timeout"
        exit 1
    fi
    
    # Wait for application
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; then
            print_status "Application is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Application failed to start within timeout"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npm run db:migrate
    
    print_status "Database migrations completed"
}

# Seed initial data
seed_database() {
    print_status "Seeding initial data..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npm run db:seed
    
    print_status "Database seeding completed"
}

# Show deployment status
show_status() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "📊 Service Status:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
    echo "🌐 Application URLs:"
    echo "  - API: http://localhost:3001/api/v1"
    echo "  - Health: http://localhost:3001/api/v1/health"
    echo "  - Docs: http://localhost:3001/api/docs"
    echo ""
    echo "📝 Logs:"
    echo "  - View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  - App logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f app"
    echo "  - DB logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f db"
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_docker
    check_env_file
    deploy_services
    wait_for_services
    run_migrations
    seed_database
    show_status
    
    print_status "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"
