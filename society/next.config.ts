// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://574e-164-67-70-232.ngrok-free.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
