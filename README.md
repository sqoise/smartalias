

# smartlias (Barangay Lias Management System)


A modern management system for Barangay Lias built with Next.js and Supabase.

## Getting Started

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartlias
   ```

2. **Run the setup script**
   ```bash
   make setup
   ```
   This will automatically install Node.js, npm, create the Next.js app, install dependencies, and set up the project structure.

3. **Configure environment variables**
   - Open `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start development server**
   ```bash
   make dev
   ```
   The application will be available at `http://localhost:3000`

### Available Make Commands

- `make setup` - Initial project setup
- `make dev` - Start development server
- `make build` - Build for production
- `make start` - Start production server
- `make clean` - Clean and reinstall dependencies

### Manual Setup (Alternative)

If you prefer to run the setup script directly:
```bash
chmod +x .local/scripts/setup-blms.sh
./.local/scripts/setup-blms.sh
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
