/**
 * Resident Controller
 * Handles HTTP requests for resident operations
 */

const ResidentRepository = require('../repositories/ResidentRepository')
const Resident = require('../models/Resident')
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
      
      // Sanitize and format input data
      const sanitizedData = {
        firstName: Validator.formatTitleCase(Validator.sanitizeInput(residentData.firstName)),
        lastName: Validator.formatTitleCase(Validator.sanitizeInput(residentData.lastName)),
        middleName: residentData.middleName ? Validator.formatTitleCase(Validator.sanitizeInput(residentData.middleName)) : '',
        suffix: Validator.sanitizeInput(residentData.suffix || ''),
        birthDate: Validator.sanitizeInput(residentData.birthDate || ''),
        gender: Validator.sanitizeInput(residentData.gender || ''),
        civilStatus: Validator.sanitizeInput(residentData.civilStatus || ''),
        homeNumber: Validator.sanitizeInput(residentData.homeNumber || ''),
        mobileNumber: Validator.sanitizeInput(residentData.mobileNumber || ''),
        email: Validator.sanitizeInput(residentData.email || ''),
        address: Validator.formatTitleCase(Validator.sanitizeInput(residentData.address || '')),
        purok: Validator.sanitizeInput(residentData.purok || ''),
        religion: Validator.sanitizeInput(residentData.religion || ''),
        occupation: Validator.sanitizeInput(residentData.occupation || ''),
        specialCategory: Validator.sanitizeInput(residentData.specialCategory || ''),
        notes: Validator.sanitizeInput(residentData.notes || '')
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
      
      // Sanitize and format input data
      const sanitizedData = {
        firstName: Validator.formatTitleCase(Validator.sanitizeInput(updateData.firstName)),
        lastName: Validator.formatTitleCase(Validator.sanitizeInput(updateData.lastName)),
        middleName: updateData.middleName ? Validator.formatTitleCase(Validator.sanitizeInput(updateData.middleName)) : '',
        suffix: Validator.sanitizeInput(updateData.suffix || ''),
        birthDate: Validator.sanitizeInput(updateData.birthDate || ''),
        gender: Validator.sanitizeInput(updateData.gender || ''),
        civilStatus: Validator.sanitizeInput(updateData.civilStatus || ''),
        homeNumber: Validator.sanitizeInput(updateData.homeNumber || ''),
        mobileNumber: Validator.sanitizeInput(updateData.mobileNumber || ''),
        email: Validator.sanitizeInput(updateData.email || ''),
        address: Validator.formatTitleCase(Validator.sanitizeInput(updateData.address || '')),
        purok: Validator.sanitizeInput(updateData.purok || ''),
        religion: Validator.sanitizeInput(updateData.religion || ''),
        occupation: Validator.sanitizeInput(updateData.occupation || ''),
        specialCategory: Validator.sanitizeInput(updateData.specialCategory || ''),
        notes: Validator.sanitizeInput(updateData.notes || '')
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
