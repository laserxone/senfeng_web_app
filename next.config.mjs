/** @type {import('next').NextConfig} */
const nextConfig = {
    // output : "export",
    // trailingSlash: true,
    // images: { unoptimized: true }
    
      images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
