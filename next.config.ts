import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  async redirects() {
    return [
      // Brand pages: /brand/x → /brands/x
      {
        source: '/brand/:slug',
        destination: '/brands/:slug',
        permanent: true,
      },

      // Blog posts: /post/x → /blog
      {
        source: '/post/:slug',
        destination: '/blog',
        permanent: true,
      },

      // Blog categories: /blog/categories/x → /blog
      {
        source: '/blog/categories/:slug',
        destination: '/blog',
        permanent: true,
      },

      // Old category / page URLs
      { source: '/cleaning',       destination: '/search?q=cleaning',       permanent: true },
      { source: '/cutlery',        destination: '/search?q=cutlery',        permanent: true },
      { source: '/barware',        destination: '/search?q=barware',        permanent: true },
      { source: '/drinkware',      destination: '/search?q=drinkware',      permanent: true },
      { source: '/dinnerware',     destination: '/search?q=dinnerware',     permanent: true },
      { source: '/kitchenware',    destination: '/search?q=kitchenware',    permanent: true },
      { source: '/disposables',    destination: '/search?q=disposables',    permanent: true },
      { source: '/buffet-and-service', destination: '/search?q=buffet',    permanent: true },
      { source: '/industrial-kitchen', destination: '/search?q=industrial', permanent: true },
      { source: '/hotel',          destination: '/search?q=hotel',          permanent: true },
      { source: '/aquatic-robotics-smart-water-solutions', destination: '/brands/agistar', permanent: true },
      { source: '/categories',     destination: '/search',                  permanent: true },
      { source: '/shop',           destination: '/search',                  permanent: true },
      { source: '/shop-1',         destination: '/search',                  permanent: true },
      { source: '/products',       destination: '/search',                  permanent: true },
      { source: '/about-us',       destination: '/',                        permanent: true },
      { source: '/contact-us',     destination: '/',                        permanent: true },
      { source: '/what-do-we-need-to-place-your-brand', destination: '/',   permanent: true },
      { source: '/return-policy',  destination: '/',                        permanent: true },
      // /brands, /search, /shipping-rates, /privacy-policy, /terms-conditions, /blog already exist on new site
    ]
  },
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
