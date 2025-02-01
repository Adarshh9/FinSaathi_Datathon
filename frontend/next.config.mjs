/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*'
      }
    ]
  },
    experimental: {
        turbo: false,
      },
};

export default nextConfig;
