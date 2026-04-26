/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
