// Common frontend utilities
// Central place for small, pure helper functions.

export function sanitizeInput(input, maxLen = 100) {
  if (!input) return ''
  return input
    .toString()
    .trim()
    .replace(/[<>'"&]/g, '')
    .slice(0, maxLen)
}

// Generic toast helper. Pass a ref from ToastNotification component.
export function alertToast(toastRef, message, type = 'info') {
  if (!toastRef || !message) return
  toastRef.current?.show(message, type)
}

// Format document request ID for display (REQ-YEAR-ID)
export function formatDocumentRequestID(id, createdAt = null) {
  if (!id) return '-'
  
  // Get year from createdAt if provided, otherwise use current year
  let year = new Date().getFullYear()
  if (createdAt) {
    try {
      year = new Date(createdAt).getFullYear()
    } catch (error) {
      // If date parsing fails, use current year
      year = new Date().getFullYear()
    }
  }
  
  // Format ID with leading zeros (4 digits for document requests - supports up to 9,999 per year)
  const formattedId = parseInt(id).toString().padStart(4, '0')
  
  return `REQ-${year}-${formattedId}`
}

// Future: export additional helpers (e.g., normalizeUsername, formatDate, etc.)

export default { sanitizeInput, alertToast, formatDocumentRequestID }
