#!/bin/bash

# ============================================
# SmartLias Database Deployment Script
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="smartliasdb"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}SmartLias Database Deployment Script${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Function to run SQL file
run_sql_file() {
    local file=$1
    local database=$2
    
    echo -e "${YELLOW}Running: $file${NC}"
    
    if [ -z "$database" ]; then
        # For database creation (connect to postgres database)
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -f "$file"
    else
        # For other files (connect to specific database)
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d "$database" -f "$file"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success: $file${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed: $file${NC}"
        return 1
    fi
}

# Check if all schema files exist
schema_files=(
    "000-create-users-and-database.sql"
    "001-core-tables.sql"
    "002-announcements-schema.sql"
    "003-documents-schema.sql"
    "004-chatbot-schema.sql"
    "005-enable-similarity.sql"
)

echo -e "${BLUE}Checking schema files...${NC}"
for file in "${schema_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Schema file not found: $file${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Found: $file${NC}"
done

echo ""
echo -e "${YELLOW}About to deploy database schema in the following order:${NC}"
for i in "${!schema_files[@]}"; do
    echo -e "${BLUE}$((i+1)). ${schema_files[i]}${NC}"
done

echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo -e "${BLUE}Starting deployment...${NC}"
echo ""

# Deploy schema files in order
run_sql_file "000-create-users-and-database.sql"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create database. Aborting deployment.${NC}"
    exit 1
fi

run_sql_file "001-core-tables.sql" $DB_NAME
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create core tables. Aborting deployment.${NC}"
    exit 1
fi

run_sql_file "002-announcements-schema.sql" $DB_NAME
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create announcements schema. Aborting deployment.${NC}"
    exit 1
fi

run_sql_file "003-documents-schema.sql" $DB_NAME
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create documents schema. Aborting deployment.${NC}"
    exit 1
fi

run_sql_file "004-chatbot-schema.sql" $DB_NAME
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create chatbot schema. Aborting deployment.${NC}"
    exit 1
fi

# Optional similarity functions (may fail if extensions not available)
echo -e "${YELLOW}Installing optional similarity functions...${NC}"
run_sql_file "005-enable-similarity.sql" $DB_NAME
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Similarity functions enabled${NC}"
else
    echo -e "${YELLOW}⚠ Similarity functions not available (this is optional)${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"

echo ""
echo -e "${BLUE}Verification:${NC}"
echo -e "${YELLOW}To verify the deployment, run:${NC}"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;\""

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your application configuration with database credentials"
echo "2. Test application connectivity to the database"
echo "3. Review and customize sample data as needed"
echo "4. Consider setting up database backups"

echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
