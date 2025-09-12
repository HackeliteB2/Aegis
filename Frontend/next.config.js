/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable tracing to fix Windows permission issues
  // Move serverComponentsExternalPackages to root level
  serverExternalPackages: [],
  // Image optimization
  images: {
    domains: ['localhost'],
  },
  // Disable webpack cache persistence that might cause file locks
  webpack: (config) => {
    config.cache = false;
    return config;
  },
}

module.exports = nextConfig