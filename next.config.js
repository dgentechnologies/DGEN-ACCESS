/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable the instrumentation hook so src/instrumentation.js runs automatically
  // on every server start and migrates Firestore users → RTDB.
  experimental: {
    instrumentationHook: true,
  },
  async rewrites() {
    return [
      {
        source: '/verify',
        destination: '/api/verify',
      },
    ];
  },
}

module.exports = nextConfig
