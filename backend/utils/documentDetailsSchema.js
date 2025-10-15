/**
 * Document Details Schema
 * Defines the expected additional fields for each document type
 */

/**
 * Document-specific detail field schemas
 * Each document type can have its own set of additional required/optional fields
 */
const DOCUMENT_DETAILS_SCHEMA = {
  'Electrical Permit': {
    fields: {
      installation_type: { 
        type: 'select', 
        required: false, 
        label: 'Installation Type',
        options: ['New installation', 'Modification', 'Repair', 'Replacement']
      },
      electrical_load: { 
        type: 'text', 
        required: false, 
        label: 'Electrical Load (KW)',
        validation: 'numeric'
      },
      contractor_name: { 
        type: 'text', 
        required: false, 
        label: 'Licensed Contractor Name'
      }
    }
  },
  
  'Fence Permit': {
    fields: {
      fence_type: { 
        type: 'select', 
        required: false, 
        label: 'Fence Type',
        options: ['Concrete', 'Wood', 'Steel', 'Chain link', 'Other']
      },
      fence_height: { 
        type: 'text', 
        required: false, 
        label: 'Fence Height (meters)',
        validation: 'numeric'
      },
      property_boundary: { 
        type: 'select', 
        required: false, 
        label: 'Property Boundary',
        options: ['Front', 'Back', 'Side', 'All around']
      }
    }
  },
  
  'Excavation Permit': {
    fields: {
      excavation_purpose: { 
        type: 'select', 
        required: false, 
        label: 'Excavation Purpose',
        options: ['Foundation', 'Septic tank', 'Water line', 'Drainage', 'Swimming pool', 'Other']
      },
      excavation_depth: { 
        type: 'text', 
        required: false, 
        label: 'Excavation Depth (meters)',
        validation: 'numeric'
      },
      area_size: { 
        type: 'text', 
        required: false, 
        label: 'Area Size (square meters)',
        validation: 'numeric'
      }
    }
  },
  
  'Barangay Clearance': {
    fields: {
      derogatory_info: { 
        type: 'textarea', 
        required: false, 
        label: 'Any Derogatory Information',
        placeholder: 'State any pending cases, violations, or legal issues (if none, write "None")'
      },
      years_residing: { 
        type: 'text', 
        required: false, 
        label: 'Years Residing in Barangay',
        validation: 'numeric'
      }
    }
  },
  
  'Certificate of Residency': {
    fields: {
      years_residing: { 
        type: 'text', 
        required: false, 
        label: 'Years Residing in Barangay',
        validation: 'numeric'
      },
      previous_address: { 
        type: 'text', 
        required: false, 
        label: 'Previous Address'
      }
    }
  },
  
  'Business Permit Clearance': {
    fields: {
      business_name: { 
        type: 'text', 
        required: true, 
        label: 'Business Name'
      },
      business_address: { 
        type: 'text', 
        required: true, 
        label: 'Business Address'
      },
      business_type: { 
        type: 'select', 
        required: false, 
        label: 'Business Type',
        options: ['Retail', 'Service', 'Manufacturing', 'Food establishment', 'Professional service', 'Other']
      },
      number_of_employees: { 
        type: 'text', 
        required: false, 
        label: 'Number of Employees',
        validation: 'numeric'
      }
    }
  },
  
  'Certificate of Indigency (Medical)': {
    fields: {
      medical_condition: { 
        type: 'text', 
        required: false, 
        label: 'Medical Condition/Diagnosis'
      },
      hospital_clinic: { 
        type: 'text', 
        required: false, 
        label: 'Hospital/Clinic Name'
      },
      estimated_cost: { 
        type: 'text', 
        required: false, 
        label: 'Estimated Medical Cost',
        validation: 'numeric'
      }
    }
  },
  
  'Certificate of Indigency (Financial)': {
    fields: {
      monthly_income: { 
        type: 'text', 
        required: false, 
        label: 'Monthly Household Income',
        validation: 'numeric'
      },
      assistance_type: { 
        type: 'select', 
        required: false, 
        label: 'Type of Assistance Needed',
        options: ['Educational', 'Medical', 'Housing', 'Food assistance', 'Emergency', 'Other']
      },
      family_size: { 
        type: 'text', 
        required: false, 
        label: 'Number of Family Members',
        validation: 'numeric'
      }
    }
  }
}

/**
 * Get details schema for a specific document type
 * @param {string} documentType - Document type title
 * @returns {object} Schema object with field definitions
 */
const getDetailsSchema = (documentType) => {
  return DOCUMENT_DETAILS_SCHEMA[documentType] || { fields: {} }
}

/**
 * Validate details object against document type schema
 * @param {string} documentType - Document type title
 * @param {object} details - Details object to validate
 * @returns {object} Validation result with isValid and errors
 */
const validateDetails = (documentType, details) => {
  const schema = getDetailsSchema(documentType)
  const errors = []
  
  if (!details || typeof details !== 'object') {
    return { isValid: true, errors: [] } // Details are optional
  }
  
  // Check required fields
  for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
    if (fieldConfig.required && (!details[fieldName] || !details[fieldName].trim())) {
      errors.push(`${fieldConfig.label} is required for ${documentType}`)
    }
  }
  
  // Validate field values
  for (const [fieldName, value] of Object.entries(details)) {
    const fieldConfig = schema.fields[fieldName]
    
    if (!fieldConfig) {
      continue // Allow unknown fields (for flexibility)
    }
    
    if (value && fieldConfig.validation === 'numeric') {
      if (isNaN(parseFloat(value))) {
        errors.push(`${fieldConfig.label} must be a valid number`)
      }
    }
    
    if (value && fieldConfig.options && !fieldConfig.options.includes(value)) {
      errors.push(`${fieldConfig.label} must be one of: ${fieldConfig.options.join(', ')}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get all document types that have custom detail fields
 * @returns {array} Array of document type names
 */
const getDocumentTypesWithDetails = () => {
  return Object.keys(DOCUMENT_DETAILS_SCHEMA)
}

module.exports = {
  DOCUMENT_DETAILS_SCHEMA,
  getDetailsSchema,
  validateDetails,
  getDocumentTypesWithDetails
}
