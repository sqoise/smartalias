import config from './config'

/**
 * Get the current server URL including port
 */
export function getServerUrl() {
  return config.baseUrl
}

/**
 * Get the current port number
 */
export function getPort() {
  return config.port
}

/**
 * Create an API endpoint URL
 */
export function createApiUrl(endpoint) {
  const baseUrl = getServerUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}/api${cleanEndpoint}`
}

/**
 * Log server information
 */
export function logServerInfo() {
  console.log(`🚀 Server running on: ${getServerUrl()}`)
  console.log(`📡 Port: ${getPort()}`)
}
