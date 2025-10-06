/**
 * Database Configuration
 * Supports both local PostgreSQL (development) and Supabase (production)
 */

const config = require('./config')
const logger = require('./logger')

class Database {
  constructor() {
    this.pg = null // PostgreSQL client (for local development)
    this.supabase = null // Supabase client (for production)
    this.type = null // 'mock', 'postgres', or 'supabase'
  }

  async connect() {
    // Development: Use local PostgreSQL (Docker)
    if (config.isDevelopment && config.DATABASE_URL) {
      return await this.connectPostgreSQL()
    }

    // Production: Use Supabase
    if (config.isProduction && config.SUPABASE_URL) {
      return await this.connectSupabase()
    }

    // No database configured
    logger.error('No database configured. Set DATABASE_URL or SUPABASE_URL in .env')
    console.error('Database: No connection configured!')
    throw new Error('Database configuration required. Please configure DATABASE_URL in your .env file.')
  }

  async connectPostgreSQL() {
    try {
      const { Pool } = require('pg')
      
      this.pg = new Pool({
        connectionString: config.DATABASE_URL,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })

      // Test connection
      const client = await this.pg.connect()
      await client.query('SELECT NOW()')
      client.release()

      this.type = 'postgres'
      logger.info('PostgreSQL connection established', { 
        host: config.POSTGRES_HOST,
        database: config.POSTGRES_DB 
      })
      console.log(`Database: Connected to PostgreSQL (${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB})`)
      return true

    } catch (error) {
      logger.error('PostgreSQL connection failed', { 
        error: error.message,
        host: config.POSTGRES_HOST,
        database: config.POSTGRES_DB,
        port: config.POSTGRES_PORT
      })
      console.error(`PostgreSQL connection failed: ${error.message}`)
      console.error(`Host: ${config.POSTGRES_HOST}:${config.POSTGRES_PORT}`)
      console.error(`Database: ${config.POSTGRES_DB}`)
      console.error(`User: ${config.POSTGRES_USER}`)
      
      // Provide specific error guidance
      if (error.message.includes('password authentication failed')) {
        console.error('Issue: Incorrect username or password')
        console.error('Solution: Check POSTGRES_USER and POSTGRES_PASSWORD in .env file')
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('Issue: Database does not exist')
        console.error('Solution: Create the database or check POSTGRES_DB in .env file')
      } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        console.error('Issue: Cannot connect to PostgreSQL server')
        console.error('Solution: Make sure PostgreSQL is running on the specified host and port')
      }
      
      throw error
    }
  }

  async connectSupabase() {
    try {
      const { createClient } = require('@supabase/supabase-js')
      
      this.supabase = createClient(
        config.SUPABASE_URL,
        config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY
      )

      // Test connection
      const { error } = await this.supabase.from('users').select('count').limit(1)
      if (error) throw error

      this.type = 'supabase'
      logger.info('Supabase connection established')
      console.log('Database: Connected to Supabase')
      return true

    } catch (error) {
      logger.error('Supabase connection failed', {
        error: error.message,
        url: config.SUPABASE_URL?.substring(0, 50) + '...'
      })
      console.error(`❌ Supabase connection failed: ${error.message}`)
      console.error('   💡 Check your Supabase URL and API keys')
      throw error
    }
  }

  async disconnect() {
    if (this.pg) {
      await this.pg.end()
      logger.info('PostgreSQL connection closed')
      console.log('Database: PostgreSQL connection closed')
    }
    
    // Supabase doesn't require explicit disconnect
    this.pg = null
    this.supabase = null
    this.type = null
  }

  isConnected() {
    return this.type !== null
  }

  getClient() {
    if (this.type === 'postgres') return this.pg
    if (this.type === 'supabase') return this.supabase
    return null
  }

  getType() {
    return this.type
  }

  // Execute query with automatic client selection
  async query(text, params) {
    if (this.type === 'postgres') {
      return await this.pg.query(text, params)
    }
    throw new Error('Query method only available for PostgreSQL')
  }
}

module.exports = new Database()
