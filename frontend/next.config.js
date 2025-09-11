/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is enabled by default in Next.js 13+
  
  // Allow cross-origin requests from local network during development
  allowedDevOrigins: [
    '192.168.1.7',
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ]
}

module.exports = nextConfig
