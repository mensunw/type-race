import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'optibot-assistant.optisigns.com',
        pathname: '/avatars/**',
      },
    ],
  },
};

export default nextConfig;
