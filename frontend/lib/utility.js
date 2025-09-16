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

// Future: export additional helpers (e.g., normalizeUsername, formatDate, etc.)

export default { sanitizeInput, alertToast }
