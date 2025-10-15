/** @type {import('next').NextConfig} */
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // Disable Strict Mode to prevent double-rendering in development
  reactStrictMode: false,
  
  // Production optimizations
  output: 'standalone', // For containerized deployments
  poweredByHeader: false, // Security: hide Next.js version
  // Removed experimental.appDir (app directory is stable in Next 15+ and key now warns)
  
  // Configure webpack to resolve shared constants
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias for shared constants
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, '../shared'),
    }

    return config
  },

  // Environment-specific configuration
  env: {
    CUSTOM_ENV: process.env.NODE_ENV,
  },

  // Security headers for production
  async headers() {
    return [
      {
        // Allow PDF files to be displayed in iframes (for PDF viewer)
        source: '/documents/(.*).pdf',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Type',
            value: 'application/pdf',
          },
          // Explicitly allow iframe embedding for PDFs
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        // Apply strict security headers to all other routes
        source: '/((?!documents/).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
