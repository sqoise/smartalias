

# SmartLias (Barangay Lias Management System)

A modern full-stack web application for Barangay management built with **separated frontend-backend architecture**.

## Architecture

```
SmartLias/
├── frontend/          # Next.js React Application (Port 3000)
├── backend/           # Express.js API Server (Port 9000)
├── Makefile          # Development & Build Commands
├── WIKI.md           # Detailed Architecture Documentation
└── README.md         # This file
```

## Features

### Frontend (Next.js)
- **Modern UI**: Built with React and Tailwind CSS
- **Server-Side Rendering**: Better SEO and performance
- **Component-Based**: Reusable UI components
- **Responsive Design**: Works on all devices
- **Role-Based Access**: Admin and user interfaces

### Backend (Express.js)
- **RESTful API**: Clean and organized endpoints
- **Authentication**: JWT-based user authentication
- **Database Integration**: Supabase PostgreSQL
- **Security**: Rate limiting, CORS, input validation
- **Middleware**: Organized business logic

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd smartlias
```

### 2. Setup Project
```bash
make setup
```
This installs dependencies for both frontend and backend.

### 3. Start Development
```bash
make dev
```
Starts both servers:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:9000
- **Health Check**: http://localhost:9000/health
Starts both servers:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:9000
- **Health Check**: http://localhost:9000/health

## Available Commands

```bash
# Development
make dev              # Start both frontend and backend
make dev-frontend     # Start only frontend (port 3000)
make dev-backend      # Start only backend (port 5000)

# Setup & Installation
make setup           # Complete project setup
make install-all     # Install all dependencies

# Production Build
make build           # Build both for production
make start           # Start production servers

# Maintenance
make clean           # Clean all build files
make test            # Run tests
make help            # Show all commands
```

## Project Structure

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/        # Next.js pages (app directory)
│   ├── layouts/      # Page layout components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API communication
│   ├── lib/          # Utility functions
│   ├── data/         # Static data (demo)
│   └── styles/       # CSS and styling
├── public/           # Static assets
├── package.json      # Frontend dependencies
└── .env.development  # Frontend environment variables
```

### Backend (`/backend`)
```
backend/
├── routes/           # API route definitions
├── controllers/      # Business logic handlers
├── models/           # Data models
├── middleware/       # Express middleware
├── config/           # Configuration files
├── utils/            # Helper functions
├── server.js         # Application entry point
├── package.json      # Backend dependencies
└── .env.development  # Backend environment variables
```

## Environment Setup

### Separate Environment Files
This project uses **separate environment files** for frontend and backend services:

**Frontend Environment** (`frontend/.env.development`):
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration  
NEXT_PUBLIC_API_BASE_URL=http://localhost:9000/api
NEXT_PUBLIC_APP_NAME=SmartLias
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Backend Environment** (`backend/.env.development`):
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
```

**How it works:**
- **Frontend**: Loads `frontend/.env.development` automatically when NODE_ENV=development
- **Backend**: Loads `backend/.env.development` directly
- **Separation**: Each service manages its own configuration independently

## Development Workflow

1. **Start Development**: `make dev`
2. **Frontend Development**: Modify files in `/frontend/src`
3. **Backend Development**: Modify files in `/backend`
4. **API Testing**: Use http://localhost:9000/health
5. **Database**: Configure Supabase connection in backend

## Documentation

- **[WIKI.md](./WIKI.md)** - Detailed architecture documentation
- **Frontend**: Next.js documentation at https://nextjs.org/docs
- **Backend**: Express.js documentation at https://expressjs.com

## Development Philosophy

This project demonstrates **modern full-stack development practices**:

- **Separated Concerns**: Frontend focuses on UI, backend handles data
- **API-First Design**: RESTful endpoints for clear communication
- **Scalable Architecture**: Each layer can be developed and deployed independently
- **Developer Experience**: Simple commands to run complex operations

Perfect for thesis defense demonstrating real-world application architecture!

### Admin Account
- **Username**: admin
- **Password**: password123

### User Account  
- **Username**: user
- **Password**: password123

## Project Structure

```
smartlias/
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── change-password/   # Password change functionality
│   └── admin/             # Admin-only pages
├── components/            # Reusable React components
├── data/                  # Sample JSON data files
│   ├── users.json        # Demo user accounts
│   └── residents.json    # Demo residents data
├── lib/                   # Utility libraries
│   ├── frontend-auth.js  # Authentication utilities
│   └── constants.js      # Application constants
└── public/               # Static assets
```

## Git Basics Guide

A simple guide to the most commonly used Git commands.

## Basic Git Workflow

### 1. Check Status
```bash
git status
```
Shows the current state of your working directory and staging area.

### 2. Add Changes
```bash
git add .
```
Stages all changes in the current directory for commit.

**Alternative:**
```bash
git add filename.txt
```
Stages a specific file.

### 3. Commit Changes
```bash
git commit -m "Your commit message"
```
Commits staged changes with a descriptive message.

### 4. Push Changes
```bash
git push
```
Uploads your local commits to the remote repository.

**First time pushing a new branch:**
```bash
git push -u origin branch-name
```

## Working with Branches

### 5. Switch Branches
```bash
git checkout branch-name
```
Switches to an existing branch.

**Create and switch to new branch:**
```bash
git checkout -b new-branch-name
```

### 6. Fetch Updates
```bash
git fetch
```
Downloads updates from remote repository without merging them.

### 7. Pull Updates
```bash
git pull
```
Downloads and merges updates from remote repository to your current branch.

## Common Workflow Example

1. Make changes to your files
2. `git add .` - Stage all changes
3. `git commit -m "Description of changes"` - Commit changes
4. `git push` - Push to remote repository

## Before Starting Work

```bash
git pull
```
Always pull the latest changes before starting new work.

## Tips

- Write clear, descriptive commit messages
- Commit frequently with small, logical changes
- Always pull before pushing to avoid conflicts
- Use `git status` frequently to see what's happening
