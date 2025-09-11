/**
 * Database Configuration
 * Future database connection setup (Supabase/PostgreSQL)
 */

const config = require('./config')

class Database {
  constructor() {
    this.connection = null
  }

  async connect() {
    if (config.USE_MOCK_DATA) {
      console.log('Using mock data (JSON files)')
      return true
    }

    // Future: Real database connection
    if (config.DATABASE_URL) {
      try {
        // TODO: Implement actual database connection
        // const { Client } = require('pg')
        // this.connection = new Client({ connectionString: config.DATABASE_URL })
        // await this.connection.connect()
        console.log('Database connection ready (placeholder)')
        return true
      } catch (error) {
        console.error('Database connection failed:', error.message)
        return false
      }
    }

    console.log('No database configured, using mock data')
    return true
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end()
      console.log('Database disconnected')
    }
  }

  isConnected() {
    return config.USE_MOCK_DATA || !!this.connection
  }
}

module.exports = new Database()
