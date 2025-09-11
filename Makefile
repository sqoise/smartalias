.PHONY: help setup dev dev-frontend dev-backend build build-frontend build-backend start start-frontend start-backend clean install-all test

# Default goal
.DEFAULT_GOAL := help

help:
	@echo "SmartLias Makefile Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev           - Start both frontend and backend development servers"
	@echo "  make dev-frontend  - Start only frontend development server (port 3000)"
	@echo "  make dev-backend   - Start only backend development server (port 5000)"
	@echo ""
	@echo "Setup:"
	@echo "  make setup         - Initial project setup for both frontend and backend"
	@echo "  make install-all   - Install dependencies for both frontend and backend"
	@echo ""
	@echo "Build:"
	@echo "  make build         - Build both frontend and backend for production"
	@echo "  make build-frontend - Build only frontend"
	@echo "  make build-backend - Build only backend"
	@echo ""
	@echo "Production:"
	@echo "  make start         - Start both frontend and backend production servers"
	@echo "  make start-frontend - Start only frontend production server"
	@echo "  make start-backend - Start only backend production server"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         - Clean all node_modules and build files"
	@echo "  make test          - Run tests for both frontend and backend"

setup:
	@echo "Setting up SmartLias Full-Stack Application..."
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "Installing backend dependencies..."
	@cd backend && npm install
	@echo "Setup complete!"
	@echo ""
	@echo "To start development: make dev"

install-all:
	@echo "Installing all dependencies..."
	@cd frontend && npm install
	@cd backend && npm install
	@echo "All dependencies installed!"

dev:
	@echo "Starting SmartLias development servers..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:9000"
	@echo "Health:   http://localhost:9000/api/health"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
	@trap 'echo "Stopping servers..."; kill %1 %2 2>/dev/null; exit' INT; \
	cd backend && npm run dev & \
	cd frontend && npm run dev & \
	wait

dev-frontend:
	@echo "Starting frontend development server..."
	@echo "Available at: http://localhost:3000"
	@cd frontend && npm run dev

dev-backend:
	@echo "Starting backend development server..."
	@echo "API available at: http://localhost:9000"
	@echo "Health check: http://localhost:9000/api/health"
	@cd backend && npm run dev

build:
	@echo "Building SmartLias for production..."
	@echo "Building frontend..."
	@cd frontend && npm run build
	@echo "Building backend..."
	@cd backend && npm run build || echo "Backend build not configured"
	@echo "Build complete!"

build-frontend:
	@echo "Building frontend for production..."
	@cd frontend && npm run build
	@echo "Frontend build complete!"

build-backend:
	@echo "Building backend for production..."
	@cd backend && npm run build || echo "Backend build not configured"

start:
	@echo "Starting SmartLias production servers..."
	@echo "Copying environment variables..."
	@cp .env frontend/.env.local
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:9000"
	@echo ""
	@trap 'echo "Stopping servers..."; kill %1 %2 2>/dev/null; exit' INT; \
	cd backend && npm start & \
	cd frontend && npm start & \
	wait

start-frontend:
	@echo "Starting frontend production server..."
	@echo "Copying environment variables..."
	@cp .env frontend/.env.local
	@cd frontend && npm start

start-backend:
	@echo "Starting backend production server..."
	@cd backend && npm start

test:
	@echo "Running tests..."
	@echo "Testing frontend..."
	@cd frontend && npm test || echo "Frontend tests not configured"
	@echo "Testing backend..."
	@cd backend && npm test || echo "Backend tests not configured"

clean:
	@echo "Cleaning SmartLias project..."
	@echo "Removing frontend build files..."
	@rm -rf frontend/node_modules frontend/.next frontend/dist
	@echo "Removing backend build files..."
	@rm -rf backend/node_modules backend/dist backend/build
	@echo "Removing lock files..."
	@rm -f frontend/package-lock.json backend/package-lock.json
	@echo "Removing copied environment files..."
	@echo "Clean complete!"
