const fs = require('fs').promises
const path = require('path')
const createReport = require('docx-templates').default
const DocumentRequestRepository = require('../repositories/DocumentRequestRepository')

class ModernDocxService {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates')
  }

    /**
   * Generate filled DOCX document with perfect formatting
   * @param {string} documentType - Document type title (e.g., 'Electrical Permit')
   * @param {Object} residentData - Data to fill in template
   * @returns {Buffer} - Generated DOCX buffer
   */
  async generateDocument(documentType, residentData) {
    try {
      // Get document from database to retrieve template filename
      const documentInfo = await DocumentRequestRepository.getDocumentByTitle(documentType)
      
      if (!documentInfo) {
        throw new Error(`Document type not found in catalog: ${documentType}`)
      }

      if (!documentInfo.filename) {
        throw new Error(`No template file configured for document type: ${documentType}`)
      }

      // Get template path using filename from database
      const templatePath = path.join(this.templateDir, documentInfo.filename)
      
      // Check if template file exists
      try {
        await fs.access(templatePath)
      } catch (error) {
        throw new Error(`Template file not found: ${documentInfo.filename}`)
      }

      // Read the DOCX template
      const templateBuffer = await fs.readFile(templatePath)
      
      // Prepare data for template replacement
      const templateData = this.prepareTemplateData(residentData)

      // Use docx-templates to fill the template (preserves ALL formatting)
      const filledDocxBuffer = await createReport({
        template: templateBuffer,
        data: templateData,
        cmdDelimiter: ['[', ']'], // Use square brackets as delimiters
        noSandBox: true,
        processLineBreaks: false // Preserve original line breaks
      })
      
      // Ensure we return a proper Node.js Buffer (not Uint8Array)
      // Some libraries return Uint8Array which Express might serialize as JSON
      const properBuffer = Buffer.isBuffer(filledDocxBuffer) 
        ? filledDocxBuffer 
        : Buffer.from(filledDocxBuffer)
      
      // Return the filled DOCX buffer - perfect formatting preserved
      return properBuffer

    } catch (error) {
      console.error('Error in modern DOCX processing:', error)
      throw new Error(`Failed to generate DOCX: ${error.message}`)
    }
  }

  /**
   * Prepare template data for separate placeholders
   * @param {Object} residentData - Original resident data
   * @returns {Object} - Template data for separate placeholder replacement
   */
  prepareTemplateData(residentData) {
    // Parse resident name
    const nameParts = residentData.residentName.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    let middleInitial = ''
    let lastName = ''
    
    if (nameParts.length === 3) {
      middleInitial = nameParts[1].charAt(0) + '.'
      lastName = nameParts[2]
    } else if (nameParts.length === 2) {
      lastName = nameParts[1]
      middleInitial = ''
    } else if (nameParts.length > 3) {
      middleInitial = nameParts[1].charAt(0) + '.'
      lastName = nameParts[nameParts.length - 1]
    }

    // Format dates
    const now = new Date()
    const currentDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const day = now.getDate()
    const ordinalDay = this.getOrdinalDay(day)
    const shortMonth = now.toLocaleDateString('en-US', { month: 'short' })
    const year = now.getFullYear()

    // Use fee from database (passed from frontend via controller)
    const fee = Number(residentData.fee) || 0

    // Return data for specific placeholders only
    return {
      // Name components
      'FIRSTNAME': firstName.toUpperCase(),
      'MI': middleInitial,
      'LASTNAME': lastName.toUpperCase(),
      
      // Address
      'ADDRESS': residentData.address || 'Lias, Marilao, Bulacan',
      
      // Date components
      'DAY': ordinalDay,
      'MONTH': shortMonth,
      'YEAR': year.toString(),
      
      // Document details
      'REQID': residentData.documentId || 'N/A',
      'DATE': currentDate,
      'FEE': fee.toFixed(2)
    }
  }

  /**
   * Check if template exists for a document type
   * @param {string} documentType - Document type title
   * @returns {boolean} - True if template file exists
   */
  async templateExists(documentType) {
    try {
      // Get document from database
      const documentInfo = await DocumentRequestRepository.getDocumentByTitle(documentType)
      
      if (!documentInfo || !documentInfo.filename) {
        return false
      }

      // Check if template file exists on disk
      const templatePath = path.join(this.templateDir, documentInfo.filename)
      await fs.access(templatePath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get ordinal day format (1st, 2nd, 3rd, etc.)
   */
  getOrdinalDay(day) {
    if (day >= 11 && day <= 13) {
      return `${day}th`
    }
    const lastDigit = day % 10
    switch (lastDigit) {
      case 1: return `${day}st`
      case 2: return `${day}nd`
      case 3: return `${day}rd`
      default: return `${day}th`
    }
  }
}

module.exports = new ModernDocxService()
