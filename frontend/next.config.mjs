/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'mdaas.shareinvestimentos.com.br',
        pathname: '/media/**',
      },
    ],
  },
  async headers() {
    const stripeCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://m.stripe.network",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "connect-src 'self' https://api.stripe.com https://m.stripe.com https://m.stripe.network",
      "img-src 'self' data: https://*.stripe.com",
      "font-src 'self' data: https://fonts.gstatic.com",
    ].join('; ')
    return [
      {
        source: '/pay/:slug*',
        headers: [{ key: 'Content-Security-Policy', value: stripeCSP }],
      },
    ]
  },
  async rewrites() {
    // INTERNAL_API_URL is used server-side inside Docker (container name resolution)
    // NEXT_PUBLIC_API_URL is the browser-facing URL — cannot be used for server-side proxy
    const apiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
