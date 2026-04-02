import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'atmar.bg',
      },
      {
        protocol: 'http',
        hostname: 'atmar.bg',
      },
    ],
  },
}

export default nextConfig
