/**
 * Resident Controller
 * Handles HTTP requests for resident operations
 */

const ResidentModel = require('../models/residentModel')
const Validator = require('../utils/validator')
const logger = require('../config/logger')

class ResidentController {
  
  // Get all residents
  static async getAll(req, res) {
    try {
      const { page, limit, search } = req.query
      
      if (search) {
        const residents = await ResidentModel.search(Validator.sanitizeInput(search))
        return res.json({
          success: true,
          data: residents,
          message: `Found ${residents.length} residents matching "${search}"`
        })
      }
      
      if (page || limit) {
        const pagination = Validator.validatePagination(page, limit)
        if (!pagination.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid pagination parameters',
            details: pagination.errors
          })
        }
        
        const result = await ResidentModel.getPaginated(pagination.page, pagination.limit)
        return res.json({
          success: true,
          data: result.residents,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          },
          message: `Retrieved ${result.residents.length} residents`
        })
      }
      
      const residents = await ResidentModel.getAll()
      res.json({
        success: true,
        data: residents,
        message: `Retrieved ${residents.length} residents`
      })
      
    } catch (error) {
      logger.error('Error getting residents', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve residents'
      })
    }
  }

  // Get resident by ID
  static async getById(req, res) {
    try {
      const { id } = req.params
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid resident ID is required'
        })
      }
      
      const resident = await ResidentModel.getById(id)
      
      if (!resident) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        })
      }
      
      res.json({
        success: true,
        data: resident,
        message: 'Resident retrieved successfully'
      })
      
    } catch (error) {
      logger.error('Error getting resident by ID', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve resident'
      })
    }
  }

  // Create new resident
  static async create(req, res) {
    try {
      const residentData = req.body
      
      // Validate input
      const validation = Validator.validateResident(residentData)
      if (!validation.isValid) {
        Validator.logValidationError(req, validation, 'resident creation')
        return res.status(400).json({
          success: false,
          error: 'Invalid resident data',
          details: validation.errors
        })
      }
      
      // Sanitize input data
      const sanitizedData = {
        firstName: Validator.sanitizeInput(residentData.firstName),
        lastName: Validator.sanitizeInput(residentData.lastName),
        middleName: Validator.sanitizeInput(residentData.middleName || ''),
        birthDate: residentData.birthDate || null,
        civilStatus: Validator.sanitizeInput(residentData.civilStatus || ''),
        address: Validator.sanitizeInput(residentData.address || ''),
        contactNumber: Validator.sanitizeInput(residentData.contactNumber || ''),
        email: Validator.sanitizeInput(residentData.email || ''),
      }
      
      const newResident = await ResidentModel.create(sanitizedData)
      
      if (!newResident) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create resident'
        })
      }
      
      logger.info(`Resident created by ${req.user.username}`, { residentId: newResident.id })
      
      res.status(201).json({
        success: true,
        data: newResident,
        message: 'Resident created successfully'
      })
      
    } catch (error) {
      logger.error('Error creating resident', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create resident'
      })
    }
  }

  // Update resident
  static async update(req, res) {
    try {
      const { id } = req.params
      const updateData = req.body
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid resident ID is required'
        })
      }
      
      // Validate input
      const validation = Validator.validateResident(updateData)
      if (!validation.isValid) {
        Validator.logValidationError(req, validation, 'resident update')
        return res.status(400).json({
          success: false,
          error: 'Invalid resident data',
          details: validation.errors
        })
      }
      
      // Sanitize input data
      const sanitizedData = {
        firstName: Validator.sanitizeInput(updateData.firstName),
        lastName: Validator.sanitizeInput(updateData.lastName),
        middleName: Validator.sanitizeInput(updateData.middleName || ''),
        birthDate: updateData.birthDate || null,
        civilStatus: Validator.sanitizeInput(updateData.civilStatus || ''),
        address: Validator.sanitizeInput(updateData.address || ''),
        contactNumber: Validator.sanitizeInput(updateData.contactNumber || ''),
        email: Validator.sanitizeInput(updateData.email || ''),
      }
      
      const updatedResident = await ResidentModel.update(id, sanitizedData)
      
      if (!updatedResident) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        })
      }
      
      logger.info(`Resident updated by ${req.user.username}`, { residentId: id })
      
      res.json({
        success: true,
        data: updatedResident,
        message: 'Resident updated successfully'
      })
      
    } catch (error) {
      logger.error('Error updating resident', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update resident'
      })
    }
  }

  // Delete resident
  static async delete(req, res) {
    try {
      const { id } = req.params
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid resident ID is required'
        })
      }
      
      const deleted = await ResidentModel.delete(id)
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        })
      }
      
      logger.info(`Resident deleted by ${req.user.username}`, { residentId: id })
      
      res.json({
        success: true,
        message: 'Resident deleted successfully'
      })
      
    } catch (error) {
      logger.error('Error deleting resident', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete resident'
      })
    }
  }

  // Get resident statistics
  static async getStats(req, res) {
    try {
      const stats = await ResidentModel.getStats()
      
      res.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      })
      
    } catch (error) {
      logger.error('Error getting resident stats', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      })
    }
  }
}

module.exports = ResidentController
