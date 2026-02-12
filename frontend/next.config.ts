import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dreaming-mech-images-1770313120.s3.ap-northeast-2.amazonaws.com',
        pathname: '/mechanics/**',
      },
    ],
  },
};

export default nextConfig;
