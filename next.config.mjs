/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ✅ Railway-compatible build
  output: "standalone",

  env: {
    NEXT_PUBLIC_ADOBE_EMBED_API_KEY: process.env.ADOBE_EMBED_API_KEY,
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000",
  },

  // ✅ Ensure "/" always serves the landing page, not /app
  async redirects() {
    return [
      {
        source: "/",
        destination: "/", // stays on home
        permanent: false,
      },
    ]
  },
}

export default nextConfig
