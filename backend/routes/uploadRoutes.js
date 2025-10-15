const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs-extra')
const { authenticateToken } = require('../middleware/authMiddleware')

const router = express.Router()

// File type configurations
const FILE_CONFIGS = {
  image: {
    maxSize: 2 * 1024 * 1024, // 2MB limit for images
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    processImage: true
  },
  document: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    errorMessage: 'Only PDF, DOC, DOCX, and TXT files are allowed'
  }
}

// Create dynamic multer configuration
const createUploadMiddleware = (fileType) => {
  const config = FILE_CONFIGS[fileType]
  
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxSize,
    },
    fileFilter: (req, file, cb) => {
      if (config.allowedTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error(config.errorMessage), false)
      }
    }
  })
}

// Create directories if they don't exist
const ensureDirectories = async (basePath) => {
  await fs.ensureDir(basePath)
}

// Generate unique filename
const generateFilename = (originalName) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = path.extname(originalName).toLowerCase()
  return `${timestamp}_${random}${ext}`
}

// Generic file upload handler
const handleFileUpload = async (req, res, uploadType, fileFieldName = 'file') => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: `No ${uploadType} file provided`
      })
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    
    // Create directory structure: uploads/{uploadType}/2024/10/
    const basePath = path.join(__dirname, '../../uploads', uploadType, year.toString(), month)
    await ensureDirectories(basePath)

    const filename = generateFilename(req.file.originalname)
    const filePath = path.join(basePath, filename)

    // Handle different file types
    if (uploadType === 'announcements' && req.file.mimetype.startsWith('image/')) {
      // Process images with Sharp (compress and resize)
      await sharp(req.file.buffer)
        .jpeg({ quality: 85 })
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toFile(filePath)
    } else {
      // Save documents as-is (no processing needed)
      await fs.writeFile(filePath, req.file.buffer)
    }

    // Return file URL
    const fileUrl = `/uploads/${uploadType}/${year}/${month}/${filename}`
    res.json({
      success: true,
      data: {
        file_url: fileUrl,
        original_filename: req.file.originalname,
        file_type: uploadType
      }
    })

  } catch (error) {
    console.error(`Upload error (${uploadType}):`, error)
    res.status(500).json({
      success: false,
      message: `Failed to upload ${uploadType}`
    })
  }
}

// Upload announcement image
router.post('/announcement-image', authenticateToken, createUploadMiddleware('image').single('image'), async (req, res) => {
  await handleFileUpload(req, res, 'announcements', 'image')
})

// Upload document for requests
router.post('/document', authenticateToken, createUploadMiddleware('document').single('document'), async (req, res) => {
  await handleFileUpload(req, res, 'documents', 'document')
})

// Generic upload endpoint (for future use)
router.post('/file/:type', authenticateToken, (req, res, next) => {
  const { type } = req.params
  const validTypes = ['announcements', 'documents', 'residents']
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid upload type'
    })
  }

  // Determine file type based on upload type
  const fileType = type === 'announcements' ? 'image' : 'document'
  const fieldName = type === 'announcements' ? 'image' : 'file'
  
  createUploadMiddleware(fileType).single(fieldName)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
    await handleFileUpload(req, res, type, fieldName)
  })
})

// ============================================
// DOCUMENT VERIFICATION ROUTES
// ============================================

const fileUploadService = require('../services/fileUploadService')
const UserRepository = require('../repositories/UserRepository')
const { requireAdmin } = require('../middleware/authMiddleware')
const { apiResponse } = require('../utils/apiResponse')
const logger = require('../config/logger')

/**
 * Upload residency document for verification
 * POST /api/upload/residency-document
 */
router.post('/residency-document', authenticateToken, (req, res) => {
  const upload = fileUploadService.getSingleUploadMiddleware('attachment_image')
  
  upload(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        const errorMessage = fileUploadService.handleUploadError(err)
        logger.warn('File upload failed', { 
          error: errorMessage, 
          userId: req.user?.userId 
        })
        return res.status(400).json(apiResponse.error(errorMessage))
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json(apiResponse.error('No file uploaded'))
      }

      // Validate the uploaded file
      try {
        fileUploadService.validateUploadedFile(req.file)
      } catch (validationError) {
        return res.status(400).json(apiResponse.error(validationError.message))
      }

      // Update user's attachment in database
      const userId = req.user.userId
      const attachmentPath = req.file.filename

      const updatedUser = await UserRepository.updateAttachment(userId, attachmentPath)

      logger.info('Residency document uploaded successfully', {
        userId: userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      })

      res.json(apiResponse.success({
        message: 'Residency document uploaded successfully. Your account is now pending admin approval.',
        filename: req.file.filename,
        isActive: updatedUser.is_active
      }))

    } catch (error) {
      logger.error('Error processing document upload', { 
        error: error.message, 
        userId: req.user?.userId 
      })

      // Clean up uploaded file if database update failed
      if (req.file) {
        try {
          fileUploadService.deleteFileByName(req.file.filename)
        } catch (cleanupError) {
          logger.error('Failed to cleanup file after error', { 
            filename: req.file.filename, 
            error: cleanupError.message 
          })
        }
      }

      res.status(500).json(apiResponse.error('Failed to process document upload'))
    }
  })
})

/**
 * Get pending users for admin approval
 * GET /api/upload/pending-users
 */
router.get('/pending-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingUsers = await UserRepository.getPendingUsers()

    logger.info('Fetched pending users for approval', { 
      count: pendingUsers.length, 
      adminId: req.user.userId 
    })

    res.json(apiResponse.success({
      pendingUsers: pendingUsers,
      count: pendingUsers.length
    }))

  } catch (error) {
    logger.error('Error fetching pending users', { 
      error: error.message, 
      adminId: req.user?.userId 
    })
    res.status(500).json(apiResponse.error('Failed to fetch pending users'))
  }
})

/**
 * Approve user account
 * POST /api/upload/approve-user/:userId
 */
router.post('/approve-user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const adminId = req.user.userId

    if (!userId || isNaN(userId)) {
      return res.status(400).json(apiResponse.error('Invalid user ID'))
    }

    const approvedUser = await UserRepository.approveUser(userId, adminId)

    logger.info('User account approved', { 
      userId: userId, 
      adminId: adminId, 
      username: approvedUser.username 
    })

    res.json(apiResponse.success({
      message: 'User account approved successfully. SMS notification sent.',
      user: {
        id: approvedUser.id,
        username: approvedUser.username,
        isActive: approvedUser.is_active,
        resident: approvedUser.resident
      }
    }))

  } catch (error) {
    logger.error('Error approving user', { 
      error: error.message, 
      userId: req.params.userId, 
      adminId: req.user?.userId 
    })
    res.status(500).json(apiResponse.error('Failed to approve user'))
  }
})

/**
 * Delete user account
 * DELETE /api/upload/delete-user/:userId
 */
router.delete('/delete-user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const adminId = req.user.userId

    if (!userId || isNaN(userId)) {
      return res.status(400).json(apiResponse.error('Invalid user ID'))
    }

    const deletedUser = await UserRepository.deleteUser(userId, adminId)

    logger.info('User account deleted', { 
      userId: userId, 
      adminId: adminId, 
      username: deletedUser.username
    })

    res.json(apiResponse.success({
      message: 'User account deleted successfully',
      user: {
        id: deletedUser.id,
        username: deletedUser.username,
        deleted: deletedUser.deleted
      }
    }))

  } catch (error) {
    logger.error('Error deleting user', { 
      error: error.message, 
      userId: req.params.userId, 
      adminId: req.user?.userId 
    })
    res.status(500).json(apiResponse.error('Failed to delete user'))
  }
})

/**
 * Get approval statistics for admin dashboard
 * GET /api/upload/stats
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await UserRepository.getApprovalStats()

    res.json(apiResponse.success({
      pending: parseInt(stats.pending) || 0,
      approved: parseInt(stats.approved) || 0,
      total: parseInt(stats.total) || 0
    }))

  } catch (error) {
    logger.error('Error fetching approval stats', { 
      error: error.message, 
      adminId: req.user?.userId 
    })
    res.status(500).json(apiResponse.error('Failed to fetch approval statistics'))
  }
})

module.exports = router
