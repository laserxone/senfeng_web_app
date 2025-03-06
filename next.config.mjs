/** @type {import('next').NextConfig} */
const nextConfig = {
    // output : "export",
    // images: { unoptimized: true }
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com',
            port: '',
            pathname: '/v0/b/adcrm-a0bf3.appspot.com/o/**',
            search: '',
          },
          {
            protocol: 'https',
            hostname: 'marketplace.canva.com',
            port: '',
            pathname: '/EAECJXaRRew/3/0/1600w/**',
            search: '',
          },
        ],
      },
};

export default nextConfig;
