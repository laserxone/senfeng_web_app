/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript : {
    ignoreBuildErrors : true
  },
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol : "https",
        hostname : "utojullngqvuxoiapqel.supabase.co"
      }
    ],
  },
}

export default nextConfig
