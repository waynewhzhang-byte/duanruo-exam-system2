/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Skip type checking during build (handled separately by CI)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build (handled separately by CI)
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN || `http://127.0.0.1:${process.env.BACKEND_PORT || 8081}`
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ]
  },
}


module.exports = nextConfig
