/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['tsx', 'ts'],
  serverExternalPackages: ['better-sqlite3', '@node-rs/argon2'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/better-sqlite3/**/*'],
  },
}

export default nextConfig
