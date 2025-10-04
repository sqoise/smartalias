#!/bin/bash

# SmartLias PostgreSQL 16 Setup Script
# This script sets up PostgreSQL 16 using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker Compose is not available."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p .local/docker
    mkdir -p .local/db
    mkdir -p .local/logs
    
    print_success "Directories created"
}

# Start PostgreSQL container
start_postgres() {
    print_status "Starting PostgreSQL 16 container..."
    
    cd .local/docker
    
    # Build and start the containers
    docker compose up -d
    
    print_status "Waiting for PostgreSQL to be ready..."
    
    # Wait for PostgreSQL to be healthy
    timeout=60
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if docker compose exec postgres pg_isready -U smartlias_user -d smartliasdb &> /dev/null; then
            print_success "PostgreSQL is ready!"
            break
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
        
        if [ $elapsed -ge $timeout ]; then
            print_error "PostgreSQL failed to start within $timeout seconds"
            exit 1
        fi
    done
    
    cd ../..
}

# Display connection information
show_connection_info() {
    print_success "PostgreSQL 16 setup completed!"
    echo
    echo "Connection Details:"
    echo "==================="
    echo "Host: localhost"
    echo "Port: 5432"
    echo "Database: smartliasdb"
    echo "Username: smartlias_user"
    echo "Password: smartlias_password"
    echo "Timezone: Asia/Manila"
    echo
    echo "pgAdmin Web Interface:"
    echo "======================"
    echo "URL: http://localhost:8080"
    echo "Email: admin@smartlias.local"
    echo "Password: admin123"
    echo
    echo "Docker Commands:"
    echo "================"
    echo "Start:   cd .local/docker && docker compose up -d"
    echo "Stop:    cd .local/docker && docker compose down"
    echo "Logs:    cd .local/docker && docker compose logs postgres"
    echo "Connect: docker exec -it smartlias_postgres psql -U smartlias_user -d smartliasdb"
    echo
    echo "Import Schema:"
    echo "=============="
    echo "docker exec -i smartlias_postgres psql -U smartlias_user -d smartliasdb < .local/db/smartliasdb_pg.sql"
}

# Main execution
main() {
    print_status "Starting SmartLias PostgreSQL 16 setup..."
    echo
    
    check_docker
    check_docker_compose
    create_directories
    start_postgres
    show_connection_info
    
    echo
    print_success "Setup completed successfully!"
}

# Run main function
main "$@"
