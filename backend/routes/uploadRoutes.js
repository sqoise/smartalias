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

module.exports = router
