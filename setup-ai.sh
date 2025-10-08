#!/bin/bash

# SmartLias Chatbot - AI Activation Script
# This script helps you activate Google Gemini AI for your chatbot

echo "================================================"
echo "  SmartLias Chatbot - AI Activation Helper"
echo "================================================"
echo ""

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "Please create it first:"
    echo "  cp backend/.env.example backend/.env"
    exit 1
fi

echo "✅ Found backend/.env file"
echo ""

# Check current Gemini settings
echo "Current Gemini Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "GEMINI_ENABLED" backend/.env; then
    ENABLED=$(grep "GEMINI_ENABLED" backend/.env)
    echo "$ENABLED"
else
    echo "GEMINI_ENABLED=not set (defaults to false)"
fi

if grep -q "GEMINI_API_KEY" backend/.env; then
    KEY=$(grep "GEMINI_API_KEY" backend/.env | cut -d'=' -f2)
    if [ -z "$KEY" ]; then
        echo "GEMINI_API_KEY=(empty)"
    else
        KEY_PREVIEW=$(echo "$KEY" | cut -c1-10)
        echo "GEMINI_API_KEY=${KEY_PREVIEW}... (hidden)"
    fi
else
    echo "GEMINI_API_KEY=not set"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if already configured
if grep -q "GEMINI_ENABLED=true" backend/.env && grep -q "GEMINI_API_KEY=AIza" backend/.env; then
    echo "✅ Gemini AI is already configured!"
    echo ""
    echo "Next steps:"
    echo "1. Restart backend: make stop && make dev"
    echo "2. Test with a complex question"
    echo "3. Look for 🤖 AI Generated badge"
    exit 0
fi

# Guide user through setup
echo "📋 Setup Instructions:"
echo ""
echo "Step 1: Get FREE API Key (no credit card required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Open browser: https://ai.google.dev"
echo "2. Sign in with Google account"
echo "3. Click 'Get API Key' button"
echo "4. Create new project (or select existing)"
echo "5. Click 'Create API Key'"
echo "6. Copy the key (starts with AIza...)"
echo ""

read -p "Do you have your API key ready? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "No problem! Get your key from:"
    echo "👉 https://ai.google.dev"
    echo ""
    echo "Run this script again when ready."
    exit 0
fi

echo ""
echo "Step 2: Enter Your API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Paste your Gemini API key: " API_KEY

# Validate API key format
if [[ ! $API_KEY =~ ^AIza[a-zA-Z0-9_-]{35}$ ]]; then
    echo ""
    echo "⚠️  Warning: Key format doesn't look correct"
    echo "Expected format: AIzaSy... (39 characters)"
    echo "Your key length: ${#API_KEY} characters"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Please check your API key."
        exit 1
    fi
fi

echo ""
echo "Step 3: Update Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup .env file
cp backend/.env backend/.env.backup
echo "✅ Created backup: backend/.env.backup"

# Update or add GEMINI_ENABLED
if grep -q "GEMINI_ENABLED" backend/.env; then
    sed -i.bak 's/^GEMINI_ENABLED=.*/GEMINI_ENABLED=true/' backend/.env
    echo "✅ Updated GEMINI_ENABLED=true"
else
    echo "" >> backend/.env
    echo "# Google Gemini AI Configuration" >> backend/.env
    echo "GEMINI_ENABLED=true" >> backend/.env
    echo "✅ Added GEMINI_ENABLED=true"
fi

# Update or add GEMINI_API_KEY
if grep -q "GEMINI_API_KEY" backend/.env; then
    sed -i.bak "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$API_KEY|" backend/.env
    echo "✅ Updated GEMINI_API_KEY"
else
    echo "GEMINI_API_KEY=$API_KEY" >> backend/.env
    echo "✅ Added GEMINI_API_KEY"
fi

# Clean up sed backup files
rm -f backend/.env.bak

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Step 4: Restart Backend Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run these commands:"
echo ""
echo "  make stop"
echo "  make dev"
echo ""

read -p "Restart backend now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Stopping backend..."
    make stop 2>/dev/null
    
    echo ""
    echo "Starting backend with AI enabled..."
    make dev &
    
    echo ""
    echo "Waiting for backend to start..."
    sleep 3
    
    echo ""
    echo "✅ Backend restarted!"
else
    echo ""
    echo "Restart manually when ready:"
    echo "  make stop && make dev"
fi

echo ""
echo "Step 5: Test AI Chatbot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Open: http://localhost:3000/home"
echo "2. Ask complex question: 'How do I get help for my disabled relative?'"
echo "3. Look for: 🤖 AI Generated badge"
echo "4. Check logs: tail -f backend/logs/application.log"
echo ""

echo "Step 6: Monitor AI Usage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "See AI activity:"
echo "  grep 'AI answer generated' backend/logs/application.log"
echo ""
echo "Check quota status:"
echo "  grep -i quota backend/logs/error.log"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 AI Enhancement Activated!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your chatbot now uses:"
echo "  📚 PostgreSQL (90%) - Fast exact matches"
echo "  📚 Fuse.js (5%) - Typo tolerance"
echo "  🤖 Gemini AI (5%) - Smart complex answers"
echo ""
echo "Total Cost: \$0/month (free tier)"
echo ""
echo "For more info, see: GEMINI-AI-SETUP.md"
echo ""
