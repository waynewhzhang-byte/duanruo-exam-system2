/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
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
