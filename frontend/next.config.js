/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Production optimizations
  output: 'standalone', // For containerized deployments
  poweredByHeader: false, // Security: hide Next.js version
  
  // Configure webpack to resolve shared constants
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias for shared constants
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, '../shared'),
    }

    return config
  },

  // Configure path mapping for better imports
  experimental: {
    // Enable external directory imports (for shared folder)
    externalDir: true,
  },

  // Environment-specific configuration
  env: {
    CUSTOM_ENV: process.env.NODE_ENV,
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
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
