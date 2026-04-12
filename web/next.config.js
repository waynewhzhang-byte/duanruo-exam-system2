/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // NOTE: /api/v1 is proxied in middleware.ts with headers forwarded (X-Tenant-ID, X-Tenant-Slug).
  // next.config.js rewrites do NOT forward custom headers, which caused tenant data leakage.
  async rewrites() {
    return []
  },
}


module.exports = nextConfig
