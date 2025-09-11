/**
 * Resident Model
 * Handles resident data operations (currently with JSON files, future: database)
 */

const fs = require('fs').promises
const path = require('path')
const config = require('../config/config')
const logger = require('../config/logger')

class ResidentModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/residents.json')
  }

  // Load residents from JSON file
  async loadResidents() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      logger.error('Failed to load residents data', error)
      return []
    }
  }

  // Save residents to JSON file
  async saveResidents(residents) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(residents, null, 2), 'utf8')
      return true
    } catch (error) {
      logger.error('Failed to save residents data', error)
      return false
    }
  }

  // Get all residents
  async getAll() {
    if (config.USE_MOCK_DATA) {
      return await this.loadResidents()
    }
    
    // Future: Database query
    // return await this.db.query('SELECT * FROM residents ORDER BY created_at DESC')
    
    return await this.loadResidents()
  }

  // Get resident by ID
  async getById(id) {
    const residents = await this.getAll()
    return residents.find(resident => resident.id === parseInt(id))
  }

  // Create new resident
  async create(residentData) {
    const residents = await this.loadResidents()
    
    // Generate new ID
    const newId = residents.length > 0 
      ? Math.max(...residents.map(r => r.id)) + 1 
      : 1
    
    const newResident = {
      id: newId,
      ...residentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    residents.push(newResident)
    
    if (config.USE_MOCK_DATA) {
      const saved = await this.saveResidents(residents)
      if (!saved) return null
    }
    
    // Future: Database insert
    // return await this.db.query('INSERT INTO residents (...) VALUES (...)')
    
    logger.info(`New resident created: ${newResident.firstName} ${newResident.lastName}`)
    return newResident
  }

  // Update resident
  async update(id, updateData) {
    const residents = await this.loadResidents()
    const index = residents.findIndex(resident => resident.id === parseInt(id))
    
    if (index === -1) return null
    
    residents[index] = {
      ...residents[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    if (config.USE_MOCK_DATA) {
      const saved = await this.saveResidents(residents)
      if (!saved) return null
    }
    
    // Future: Database update
    // return await this.db.query('UPDATE residents SET ... WHERE id = ?', [id])
    
    logger.info(`Resident updated: ID ${id}`)
    return residents[index]
  }

  // Delete resident
  async delete(id) {
    const residents = await this.loadResidents()
    const index = residents.findIndex(resident => resident.id === parseInt(id))
    
    if (index === -1) return false
    
    const deletedResident = residents[index]
    residents.splice(index, 1)
    
    if (config.USE_MOCK_DATA) {
      const saved = await this.saveResidents(residents)
      if (!saved) return false
    }
    
    // Future: Database delete
    // return await this.db.query('DELETE FROM residents WHERE id = ?', [id])
    
    logger.info(`Resident deleted: ${deletedResident.firstName} ${deletedResident.lastName}`)
    return true
  }

  // Search residents
  async search(query) {
    const residents = await this.getAll()
    const searchTerm = query.toLowerCase()
    
    return residents.filter(resident =>
      resident.firstName.toLowerCase().includes(searchTerm) ||
      resident.lastName.toLowerCase().includes(searchTerm) ||
      (resident.middleName && resident.middleName.toLowerCase().includes(searchTerm)) ||
      (resident.email && resident.email.toLowerCase().includes(searchTerm)) ||
      (resident.contactNumber && resident.contactNumber.includes(query))
    )
  }

  // Get residents with pagination
  async getPaginated(page = 1, limit = 10) {
    const residents = await this.getAll()
    const offset = (page - 1) * limit
    
    return {
      residents: residents.slice(offset, offset + limit),
      total: residents.length,
      page,
      limit,
      totalPages: Math.ceil(residents.length / limit)
    }
  }

  // Get statistics
  async getStats() {
    const residents = await this.getAll()
    
    return {
      total: residents.length,
      recentCount: residents.filter(r => {
        const created = new Date(r.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return created > thirtyDaysAgo
      }).length
    }
  }
}

module.exports = new ResidentModel()
