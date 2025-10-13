const modernDocxService = require('../services/modernDocxService')
const logger = require('../config/logger')
const fs = require('fs').promises
const path = require('path')
const DocumentRequestRepository = require('../repositories/DocumentRequestRepository')
const { formatDocumentType } = require('../config/documentConstants')

/**
 * Generate custom filename based on document type and resident data
 * Format: <DOCUMENT>_<FULLNAME>_<REQ-ID>_<DATE>.docx
 */
function generateCustomFilename(documentType, residentName, documentId) {
  // Get current date in YYYYMMDD format
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateString = `${year}${month}${day}`
  
  // Clean and format document type
  const formattedDocType = documentType.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  
  // Clean and format full resident name (keep all parts)
  const cleanFullName = residentName.trim()
    .replace(/\s+/g, '_')  // Replace spaces with underscores
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')  // Remove special characters except underscores
  
  // Clean document ID
  const cleanDocId = documentId ? documentId.replace(/[^A-Z0-9\-]/g, '') : 'N_A'
  
  // Generate filename: <DOCUMENT>_<FULLNAME>_<REQ-ID>_<DATE>.docx
  return `${formattedDocType}_${cleanFullName}_${cleanDocId}_${dateString}.docx`
}

/**
 * Generate and download filled PDF document
 */
const generatePDF = async (req, res) => {
  try {
    const {
      documentId,
      documentType,
      residentName,
      address,
      purpose,
      requestDate,
      fee // Accept fee from request body
    } = req.body

    // Validate required fields
    if (!documentId || !documentType || !residentName || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: documentId, documentType, residentName, purpose'
      })
    }

    // Prepare resident data
    const residentData = {
      documentId,
      residentName,
      address: address || 'Lias, Marilao, Bulacan',
      purpose,
      requestDate: requestDate || new Date().toISOString(),
      documentType,
      fee: fee || 0 // Pass fee from database (default to 0 if not provided)
    }

    // Check if DOCX template exists and use modern service
    const templateExists = await modernDocxService.templateExists(documentType)
    if (!templateExists) {
      return res.status(404).json({
        success: false,
        message: `Template not found for document type: ${documentType}`
      })
    }

    console.log('Using MODERN DOCX service for:', documentType)
    
    // Generate DOCX using modern DOCX service (preserves all formatting)
    const docxBuffer = await modernDocxService.generateDocument(documentType, residentData)
    
    // Log buffer info for debugging
    console.log('DOCX Buffer generated:')
    console.log('  Type:', typeof docxBuffer)
    console.log('  Is Buffer?', Buffer.isBuffer(docxBuffer))
    console.log('  Is Uint8Array?', docxBuffer instanceof Uint8Array)
    console.log('  Size:', docxBuffer.length)
    console.log('  First 4 bytes:', docxBuffer.slice(0, 4))
    
    // Convert to Buffer if it's a Uint8Array
    const buffer = Buffer.isBuffer(docxBuffer) ? docxBuffer : Buffer.from(docxBuffer)
    console.log('  After conversion - Is Buffer?', Buffer.isBuffer(buffer))
    
    // Log the generation
    logger.info('DOCX generated using modern DOCX service', {
      documentId,
      documentType,
      residentName,
      bufferSize: buffer.length,
      user: req.user?.username
    })

    // Generate filename in format: <DOCUMENT>_<FULLNAME>_<REQ-ID>_<DATE>.docx
    const filename = generateCustomFilename(documentType, residentName, documentId)
    
    // Send response using raw Node.js response methods to avoid JSON serialization
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', String(buffer.length))
    
    // Write the buffer directly and end - DO NOT use res.send() as it converts Buffer to JSON
    res.write(buffer)
    res.end()
    
    return

  } catch (error) {
    logger.error('Error generating DOCX', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      user: req.user?.username
    })

    res.status(500).json({
      success: false,
      message: 'Failed to generate DOCX document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

/**
 * Get available templates
 */
const getAvailableTemplates = async (req, res) => {
  try {
    // Query database for all document types that have templates
    const documents = await DocumentRequestRepository.getAllCatalog()
    
    // Filter documents that have template filenames
    const availableTemplates = documents
      .filter(doc => doc.filename) // Only include documents with template files
      .map(doc => ({
        type: doc.title.toLowerCase().replace(/\s+/g, '_'),
        name: doc.title,
        filename: doc.filename,
        available: true
      }))

    res.json({
      success: true,
      templates: availableTemplates
    })

  } catch (error) {
    logger.error('Error getting available templates', {
      error: error.message,
      user: req.user?.username
    })

    res.status(500).json({
      success: false,
      message: 'Failed to get available templates'
    })
  }
}

/**
 * Download DOCX template file with authentication
 */
const downloadTemplate = async (req, res) => {
  try {
    const { documentType } = req.params
    
    // Get template path
    const templatePath = path.join(__dirname, '../templates', `${documentType}_template.docx`)
    
    // Check if template exists
    try {
      await fs.access(templatePath)
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Template not found for document type: ${documentType}`
      })
    }
    
    // Read and serve the DOCX file for download
    const docxBuffer = await fs.readFile(templatePath)
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${documentType}_template.docx"`,
      'Content-Length': docxBuffer.length
    })
    
    res.send(docxBuffer)
    
    logger.info(`Template downloaded: ${documentType}`, {
      templatePath,
      userId: req.user?.userId
    })
    
  } catch (error) {
    logger.error('Error downloading template:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to download template',
      error: error.message
    })
  }
}



module.exports = {
  generatePDF,
  getAvailableTemplates,
  downloadTemplate
}
