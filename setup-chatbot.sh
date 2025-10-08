#!/bin/bash

# Populate Chatbot FAQ Database
# This script imports the chatbot schema into the PostgreSQL database

echo "🤖 Setting up SmartLias Chatbot FAQ System..."
echo ""

# Load environment variables
if [ -f backend/.env ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

# Database connection details
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-smartliasdb}
DB_USER=${POSTGRES_USER:-smartlias_user}

echo "📊 Database: $DB_NAME"
echo "🔗 Host: $DB_HOST:$DB_PORT"
echo "👤 User: $DB_USER"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking database connection..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to PostgreSQL database"
    echo "Please make sure:"
    echo "  1. PostgreSQL is running (docker compose up -d)"
    echo "  2. Database credentials in .env are correct"
    exit 1
fi

echo "✅ Database connection OK"
echo ""

# Import chatbot schema
echo "📥 Importing chatbot schema..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f .local/db/chatbot-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Chatbot FAQ system setup complete!"
    echo ""
    echo "📋 Summary:"
    echo "  • FAQ Categories: 6"
    echo "  • Sample FAQs: 11"
    echo "  • Database tables created: 4"
    echo ""
    echo "🚀 You can now use the chatbot feature!"
    echo ""
    echo "📖 Next steps:"
    echo "  1. Add ChatbotButton component to your pages"
    echo "  2. Test the chatbot by asking questions"
    echo "  3. Add more FAQs as needed"
else
    echo ""
    echo "❌ Error: Failed to import chatbot schema"
    echo "Please check the error messages above"
    exit 1
fi
