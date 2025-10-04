.PHONY: help install dev start stop restart status logs clean
.DEFAULT_GOAL := help

FRONTEND_DIR := frontend
BACKEND_DIR := backend

help:
	@echo "SmartLias - Essential Commands"
	@echo ""
	@echo "  make install  - Install all dependencies"
	@echo "  make dev      - Run frontend (3000) and backend (9000) in development"
	@echo "  make start    - Start backend with PM2 (production)"
	@echo "  make stop     - Stop backend"
	@echo "  make restart  - Restart backend"
	@echo "  make status   - Show backend status"
	@echo "  make logs     - Show backend logs"
	@echo "  make clean    - Remove node_modules"

install:
	@echo "Installing dependencies..."
	@cd $(FRONTEND_DIR) && npm install
	@cd $(BACKEND_DIR) && npm install
	@echo "✅ Install complete"

dev:
	@echo "Starting development mode..."
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:9000"
	@echo "  Health:   http://localhost:9000/api/health"
	@echo ""
	@trap 'echo "Stopping..."; kill %1 %2 2>/dev/null' INT; \
	cd $(BACKEND_DIR) && npm run dev & \
	cd $(FRONTEND_DIR) && npm run dev & \
	wait

start:
	@echo "Starting backend with PM2..."
	@cd $(BACKEND_DIR) && npm run pm2:start
	@echo ""
	@echo "✅ Backend started"
	@echo "  Backend:  http://localhost:9000"
	@echo "  Health:   http://localhost:9000/api/health"
	@echo ""
	@echo "Start frontend separately with:"
	@echo "  cd frontend && npm run dev"

stop:
	@echo "Stopping backend..."
	@cd $(BACKEND_DIR) && npm run pm2:stop || true
	@cd $(BACKEND_DIR) && npm run pm2:delete || true
	@echo "✅ Backend stopped"

restart:
	@echo "Restarting backend..."
	@cd $(BACKEND_DIR) && npm run pm2:restart
	@echo "✅ Backend restarted"

status:
	@cd $(BACKEND_DIR) && npm run pm2:status

logs:
	@echo "Backend logs (Ctrl+C to exit):"
	@cd $(BACKEND_DIR) && npm run pm2:logs

clean:
	@echo "Cleaning node_modules..."
	@rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/.next
	@rm -rf $(BACKEND_DIR)/node_modules
	@echo "✅ Clean complete"

