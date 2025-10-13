/**
 * Document Request Utilities
 * Frontend utilities for document request formatting and processing
 */

/**
 * Format request ID for display
 * @param {number} id - Request ID from database
 * @param {string|Date} createdAt - Creation date
 * @returns {string} Formatted ID like "REQ-2025-0001"
 */
export const formatRequestId = (id, createdAt) => {
  if (!id || !createdAt) return 'REQ-0000-0000'
  
  const year = new Date(createdAt).getFullYear()
  const paddedId = String(id).padStart(4, '0')
  return `REQ-${year}-${paddedId}`
}

/**
 * Parse request ID to get numeric ID
 * @param {string} formattedId - Formatted ID like "REQ-2025-0001"
 * @returns {number|null} Numeric ID or null if invalid
 */
export const parseRequestId = (formattedId) => {
  if (!formattedId || typeof formattedId !== 'string') return null
  
  const match = formattedId.match(/^REQ-\d{4}-(\d{4})$/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Format document request status for display
 * @param {string|number} status - Status from API
 * @returns {object} Status display object
 */
export const formatRequestStatus = (status) => {
  const statusMap = {
    0: { text: 'Pending', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    1: { text: 'Processing', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    2: { text: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    3: { text: 'Ready for Pickup', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    4: { text: 'Completed', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    'pending': { text: 'Pending', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    'processing': { text: 'Processing', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'rejected': { text: 'Rejected', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    'ready': { text: 'Ready for Pickup', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'completed': { text: 'Completed', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
  }
  
  return statusMap[status] || { text: 'Unknown', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
}

/**
 * Format fee for display
 * @param {number} fee - Fee amount
 * @param {string} status - Request status
 * @returns {string} Formatted fee display
 */
export const formatFeeDisplay = (fee, status) => {
  if (!fee || fee === 0) return 'Free'
  
  const amount = parseFloat(fee).toFixed(2)
  
  if (status === 'completed' || status === 4) {
    return `₱${amount} (Paid)`
  }
  
  if (status === 'ready' || status === 3) {
    return `₱${amount} (Payable on Pickup)`
  }
  
  return `₱${amount}`
}

/**
 * Get available status transitions for a current status
 * @param {string|number} currentStatus - Current status
 * @param {string} userRole - User role (admin, staff, resident)
 * @returns {array} Available status transitions
 */
export const getAvailableStatusTransitions = (currentStatus, userRole = 'resident') => {
  if (userRole === 'resident') {
    return [] // Residents cannot change status
  }
  
  const statusValue = typeof currentStatus === 'string' ? 
    { 'pending': 0, 'processing': 1, 'rejected': 2, 'ready': 3, 'completed': 4 }[currentStatus] : 
    currentStatus
  
  const transitions = {
    0: [
      { value: 'processing', label: 'Mark as Processing', color: 'blue' },
      { value: 'rejected', label: 'Reject Request', color: 'red', requiresRemarks: true }
    ],
    1: [
      { value: 'ready', label: 'Mark as Ready for Pickup', color: 'green' },
      { value: 'rejected', label: 'Reject Request', color: 'red', requiresRemarks: true }
    ],
    3: [
      { value: 'completed', label: 'Mark as Completed', color: 'gray' }
    ]
  }
  
  return transitions[statusValue] || []
}

/**
 * Validate status transition
 * @param {string|number} fromStatus - Current status
 * @param {string|number} toStatus - Target status
 * @returns {boolean} Whether transition is valid
 */
export const isValidStatusTransition = (fromStatus, toStatus) => {
  const fromValue = typeof fromStatus === 'string' ? 
    { 'pending': 0, 'processing': 1, 'rejected': 2, 'ready': 3, 'completed': 4 }[fromStatus] : 
    fromStatus
    
  const toValue = typeof toStatus === 'string' ? 
    { 'pending': 0, 'processing': 1, 'rejected': 2, 'ready': 3, 'completed': 4 }[toStatus] : 
    toStatus
  
  const validTransitions = {
    0: [1, 2], // pending -> processing, rejected
    1: [2, 3], // processing -> rejected, ready
    3: [4]     // ready -> completed
  }
  
  return validTransitions[fromValue]?.includes(toValue) || false
}

/**
 * Format purpose options for dropdown
 * @param {string} documentType - Document type
 * @returns {array} Purpose options
 */
export const getPurposeOptions = (documentType) => {
  const purposeMap = {
    'electrical_permit': [
      'New electrical installation',
      'Electrical repair/modification',
      'Safety compliance',
      'Business requirement',
      'Other'
    ],
    'barangay_clearance': [
      'Employment requirement',
      'Business permit application',
      'Travel abroad',
      'School enrollment',
      'Government transaction',
      'Other'
    ],
    'certificate_of_residency': [
      'School enrollment',
      'Government transaction',
      'Employment requirement',
      'Other'
    ],
    'certificate_of_good_moral': [
      'Employment requirement',
      'School application',
      'Character reference',
      'Other'
    ],
    'certificate_of_indigency_medical': [
      'Medical assistance',
      'Hospital discount',
      'Health insurance',
      'Other'
    ],
    'certificate_of_indigency_financial': [
      'Financial assistance',
      'Educational grant',
      'Government program',
      'Other'
    ],
    'business_permit_clearance': [
      'New business registration',
      'Business permit renewal',
      'Business expansion',
      'Other'
    ]
  }
  
  return purposeMap[documentType] || ['General purpose', 'Other']
}

/**
 * Check if user can request a document type again
 * @param {array} existingRequests - User's existing requests for this document type
 * @returns {object} Can request status and reason
 */
export const canRequestDocumentAgain = (existingRequests) => {
  if (!existingRequests || existingRequests.length === 0) {
    return { canRequest: true, reason: null }
  }
  
  // Check for pending or processing requests
  const activeRequest = existingRequests.find(req => 
    req.status === 'pending' || req.status === 'processing' || req.status === 0 || req.status === 1
  )
  
  if (activeRequest) {
    return { 
      canRequest: false, 
      reason: 'You already have a pending or processing request for this document type',
      activeRequest
    }
  }
  
  return { canRequest: true, reason: null }
}

export default {
  formatRequestId,
  parseRequestId,
  formatRequestStatus,
  formatFeeDisplay,
  getAvailableStatusTransitions,
  isValidStatusTransition,
  getPurposeOptions,
  canRequestDocumentAgain
}
