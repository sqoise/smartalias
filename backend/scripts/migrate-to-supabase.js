/**
 * Supabase Database Migration Script
 * 
 * This script helps you migrate your local PostgreSQL schema to Supabase
 * 
 * Usage:
 *   node scripts/migrate-to-supabase.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

// SQL migration files in order
const migrationFiles = [
  '001-core-tables.sql',
  '002-announcements-schema.sql',
  '003-documents-schema.sql',
  '004-chatbot-schema.sql',
  '005-enable-similarity.sql',
  '004-user-verification-migration.sql',
  'fix-document-requests-foreign-key.sql',
  'migrate-add-details-column.sql'
]

async function runMigration() {
  log('\n🚀 SmartLias Supabase Migration Tool\n', colors.cyan)

  // Check for Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Error: Supabase credentials not found!', colors.red)
    log('\nPlease set the following in your .env file:', colors.yellow)
    log('  SUPABASE_URL=https://your-project-id.supabase.co')
    log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n')
    process.exit(1)
  }

  log(`📦 Supabase URL: ${supabaseUrl}`, colors.blue)
  log(`🔑 Service Role Key: ${supabaseKey.substring(0, 20)}...\n`, colors.blue)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test connection
  log('🔍 Testing Supabase connection...', colors.yellow)
  const { data, error } = await supabase.from('users').select('count').limit(1)
  
  if (error && !error.message.includes('does not exist')) {
    log(`❌ Connection failed: ${error.message}\n`, colors.red)
    process.exit(1)
  }

  log('✅ Connection successful!\n', colors.green)

  // Get SQL files directory
  const sqlDir = path.join(__dirname, '../../.local/db')

  if (!fs.existsSync(sqlDir)) {
    log(`❌ SQL directory not found: ${sqlDir}`, colors.red)
    log('\nPlease make sure your SQL migration files are in:', colors.yellow)
    log('  /Users/sqoise/repository/new/smartlias/.local/db/\n')
    process.exit(1)
  }

  log('📁 SQL files directory found!\n', colors.green)
  log('⚠️  WARNING: This will create/modify tables in your Supabase database.', colors.yellow)
  log('   Make sure you have a backup if needed.\n', colors.yellow)

  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  readline.question('Do you want to continue? (yes/no): ', async (answer) => {
    readline.close()

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      log('\n❌ Migration cancelled.\n', colors.yellow)
      process.exit(0)
    }

    log('\n🔄 Starting migration...\n', colors.cyan)

    // Process each SQL file
    for (const fileName of migrationFiles) {
      const filePath = path.join(sqlDir, fileName)

      if (!fs.existsSync(filePath)) {
        log(`⚠️  Skipping ${fileName} (file not found)`, colors.yellow)
        continue
      }

      log(`📄 Processing ${fileName}...`, colors.blue)

      try {
        let sqlContent = fs.readFileSync(filePath, 'utf8')

        // Clean up SQL content
        sqlContent = sqlContent
          .replace(/\\c smartliasdb;/g, '') // Remove database connection command
          .replace(/--.*$/gm, '') // Remove SQL comments
          .trim()

        if (!sqlContent) {
          log(`   ⚠️  File is empty, skipping`, colors.yellow)
          continue
        }

        // Note: Supabase doesn't support direct SQL execution via JS client for DDL
        // You need to run these in the SQL Editor
        log(`   ℹ️  Please run this file manually in Supabase SQL Editor`, colors.yellow)
        log(`   📋 File location: ${filePath}`, colors.cyan)

      } catch (error) {
        log(`   ❌ Error reading file: ${error.message}`, colors.red)
      }
    }

    log('\n📝 Migration Instructions:', colors.cyan)
    log('\nSince Supabase requires SQL files to be run in the SQL Editor:', colors.yellow)
    log('\n1. Go to your Supabase Dashboard')
    log('2. Click "SQL Editor" in the left sidebar')
    log('3. Run each SQL file in order:')
    
    migrationFiles.forEach((file, index) => {
      const filePath = path.join(sqlDir, file)
      if (fs.existsSync(filePath)) {
        log(`   ${index + 1}. ${file}`)
      }
    })

    log('\n4. Make sure to remove the "\\c smartliasdb;" line from each file')
    log('5. Click "Run" for each SQL file\n')
    
    log('✅ Migration preparation complete!\n', colors.green)
    log('💡 Tip: After running all SQL files, restart your backend server.\n', colors.cyan)
  })
}

// Run the migration
runMigration().catch(error => {
  log(`\n❌ Migration failed: ${error.message}\n`, colors.red)
  process.exit(1)
})
