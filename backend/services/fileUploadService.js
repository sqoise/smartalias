/**
 * File Upload Service for Residency Document Verification
 * Handles uploading, validation, and cleanup of resident ID documents
 */

const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const logger = require('../config/logger')

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/')
    this.maxFileSize = 3 * 1024 * 1024 // 3MB - optimal for document photos
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    this.allowedExtensions = ['.jpg', '.jpeg', '.png']
    
    // Ensure uploads directory exists
    this.ensureUploadDirectory()
  }

  /**
   * Ensure the uploads directory exists
   */
  ensureUploadDirectory() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true })
        logger.info('Created uploads directory', { path: this.uploadDir })
      }
    } catch (error) {
      logger.error('Failed to create uploads directory', { error: error.message, path: this.uploadDir })
      throw new Error('Upload directory initialization failed')
    }
  }

  /**
   * Generate unique filename for document upload
   * Format: temp_<timestamp>_<random8>.<ext>
   */
  generateFilename(originalExtension) {
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(4).toString('hex') // 8 characters
    const extension = originalExtension.toLowerCase()
    return `temp_${timestamp}_${randomString}${extension}`
  }

  /**
   * Configure multer storage for document uploads
   */
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir)
      },
      filename: (req, file, cb) => {
        try {
          const ext = path.extname(file.originalname)
          const filename = this.generateFilename(ext)
          
          logger.info('Generating filename for upload', { 
            originalName: file.originalname, 
            generatedName: filename 
          })
          
          cb(null, filename)
        } catch (error) {
          logger.error('Error generating filename', { error: error.message })
          cb(error)
        }
      }
    })

    const fileFilter = (req, file, cb) => {
      try {
        // Check file type
        if (!this.allowedTypes.includes(file.mimetype)) {
          logger.warn('Invalid file type attempted', { 
            mimetype: file.mimetype, 
            filename: file.originalname 
          })
          return cb(new Error('Only JPEG, JPG, and PNG files are allowed'))
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase()
        if (!this.allowedExtensions.includes(ext)) {
          logger.warn('Invalid file extension attempted', { 
            extension: ext, 
            filename: file.originalname 
          })
          return cb(new Error('Only .jpg, .jpeg, and .png extensions are allowed'))
        }

        cb(null, true)
      } catch (error) {
        logger.error('Error in file filter', { error: error.message })
        cb(error)
      }
    }

    return multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 1 // Only one file per upload
      },
      fileFilter: fileFilter
    })
  }

  /**
   * Get single file upload middleware
   */
  getSingleUploadMiddleware(fieldName = 'attachment_image') {
    const upload = this.getMulterConfig()
    return upload.single(fieldName)
  }

  /**
   * Validate uploaded file
   */
  validateUploadedFile(file) {
    if (!file) {
      throw new Error('No file uploaded')
    }

    // Additional validation after upload
    const stats = fs.statSync(file.path)
    if (stats.size > this.maxFileSize) {
      this.deleteFile(file.path)
      throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`)
    }

    // Check if file actually exists and is readable
    if (!fs.existsSync(file.path)) {
      throw new Error('Uploaded file not found')
    }

    logger.info('File validation successful', {
      filename: file.filename,
      size: stats.size,
      mimetype: file.mimetype
    })

    return true
  }

  /**
   * Delete file from uploads directory
   */
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        logger.info('File deleted successfully', { filePath })
        return true
      } else {
        logger.warn('File not found for deletion', { filePath })
        return false
      }
    } catch (error) {
      logger.error('Error deleting file', { error: error.message, filePath })
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Delete file by filename
   */
  deleteFileByName(filename) {
    const filePath = path.join(this.uploadDir, filename)
    return this.deleteFile(filePath)
  }

  /**
   * Get full file path from filename
   */
  getFilePath(filename) {
    return path.join(this.uploadDir, filename)
  }

  /**
   * Check if file exists
   */
  fileExists(filename) {
    const filePath = this.getFilePath(filename)
    return fs.existsSync(filePath)
  }

  /**
   * Clean up old user files (when user uploads new document)
   */
  cleanupUserFiles(userId) {
    try {
      const files = fs.readdirSync(this.uploadDir)
      const userFiles = files.filter(file => file.startsWith(`${userId}_access_`))
      
      userFiles.forEach(file => {
        const filePath = path.join(this.uploadDir, file)
        this.deleteFile(filePath)
      })
      
      logger.info('Cleaned up old user files', { userId, deletedCount: userFiles.length })
      return userFiles.length
    } catch (error) {
      logger.error('Error cleaning up user files', { error: error.message, userId })
      throw new Error('Failed to cleanup old files')
    }
  }

  /**
   * Get file info
   */
  getFileInfo(filename) {
    try {
      const filePath = this.getFilePath(filename)
      if (!fs.existsSync(filePath)) {
        return null
      }

      const stats = fs.statSync(filePath)
      return {
        filename: filename,
        path: filePath,
        size: stats.size,
        uploadDate: stats.birthtime,
        lastModified: stats.mtime
      }
    } catch (error) {
      logger.error('Error getting file info', { error: error.message, filename })
      return null
    }
  }

  /**
   * Handle multer errors
   */
  handleUploadError(error) {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return 'File size exceeds 5MB limit'
        case 'LIMIT_FILE_COUNT':
          return 'Only one file allowed per upload'
        case 'LIMIT_UNEXPECTED_FILE':
          return 'Unexpected file field'
        default:
          return `Upload error: ${error.message}`
      }
    }
    
    return error.message || 'Unknown upload error'
  }
}

module.exports = FileUploadService
