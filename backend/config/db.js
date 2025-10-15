/**
 * Database Configuration
 * Supports PostgreSQL connection via DATABASE_URL (works for both local and Supabase)
 */

const config = require('./config')
const logger = require('./logger')

class Database {
  constructor() {
    this.pg = null // PostgreSQL client (works for both local and Supabase)
    this.type = null // 'postgres'
  }

  async connect() {
    // Use DATABASE_URL (works for both local PostgreSQL and Supabase PostgreSQL)
    if (config.DATABASE_URL) {
      return await this.connectPostgreSQL()
    }

    // No database configured
    logger.error('No database configured. Set DATABASE_URL in .env')
    console.error('Database: No DATABASE_URL configured!')
    console.error('For local: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname')
    console.error('For Supabase: Get connection string from Dashboard → Settings → Database → Connection String → URI')
    throw new Error('Database configuration required. Please set DATABASE_URL in your .env file.')
  }

  async connectPostgreSQL() {
    try {
      const { Pool } = require('pg')
      
      // Parse DATABASE_URL to extract components
      const url = new URL(config.DATABASE_URL)
      
      // Log connection attempt details
      logger.info('Attempting PostgreSQL connection', {
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        ssl: url.hostname.includes('supabase.co')
      })
      console.log(`Database: Connecting to ${url.hostname}:${url.port || 5432}`)
      console.log(`Database: SSL ${url.hostname.includes('supabase.co') ? 'enabled' : 'disabled'}`)
      
      // Configuration with explicit options
      const poolConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // Remove leading slash
        user: url.username,
        password: url.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        // Enable SSL for Supabase, disable for local
        ssl: url.hostname.includes('supabase.co') 
          ? { rejectUnauthorized: false } 
          : false,
      }
      
      this.pg = new Pool(poolConfig)

      // Test connection
      const client = await this.pg.connect()
      await client.query('SELECT NOW()')
      client.release()

      this.type = 'postgres'
      logger.info('PostgreSQL connection established', { 
        connectionString: config.DATABASE_URL?.substring(0, 50) + '...'
      })
      
      // Detect if it's Supabase or local based on connection string
      const isSupabase = config.DATABASE_URL.includes('supabase.co')
      const dbType = isSupabase ? 'Supabase PostgreSQL' : 'Local PostgreSQL'
      console.log(`Database: Connected to ${dbType}`)
      return true

    } catch (error) {
      logger.error('PostgreSQL connection failed', { 
        error: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port,
        connectionString: config.DATABASE_URL?.substring(0, 50) + '...'
      })
      console.error(`PostgreSQL connection failed: ${error.message}`)
      console.error(`Error code: ${error.code || 'N/A'}`)
      console.error(`Error syscall: ${error.syscall || 'N/A'}`)
      if (error.address) {
        console.error(`Attempted address: ${error.address}:${error.port}`)
      }
      
      // Provide specific error guidance
      if (error.message.includes('ENETUNREACH') || error.code === 'ENETUNREACH') {
        console.error('Issue: Network unreachable (likely IPv6 routing problem)')
        console.error('Solution: Check if DATABASE_URL uses correct connection string')
        console.error('Try using Supabase connection pooler or IPv4-only endpoint')
      } else if (error.message.includes('password authentication failed')) {
        console.error('Issue: Incorrect username or password')
        console.error('Solution: Check your DATABASE_URL credentials')
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('Issue: Database does not exist')
        console.error('Solution: Create the database or check DATABASE_URL')
      } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        console.error('Issue: Cannot connect to PostgreSQL server')
        console.error('Solution: Make sure PostgreSQL is running or check DATABASE_URL')
      } else if (error.message.includes('getaddrinfo')) {
        console.error('Issue: Cannot resolve database host')
        console.error('Solution: Check your internet connection or DATABASE_URL host')
      }
      
      throw error
    }
  }

  async disconnect() {
    if (this.pg) {
      await this.pg.end()
      logger.info('PostgreSQL connection closed')
      console.log('Database: PostgreSQL connection closed')
    }
    
    this.pg = null
    this.type = null
  }

  isConnected() {
    return this.type !== null
  }

  getClient() {
    return this.pg
  }

  getType() {
    return this.type
  }

  // Execute PostgreSQL query
  async query(text, params) {
    if (this.type === 'postgres' && this.pg) {
      return await this.pg.query(text, params)
    }
    
    throw new Error('No database connection available. Make sure DATABASE_URL is set.')
  }
}

module.exports = new Database()
