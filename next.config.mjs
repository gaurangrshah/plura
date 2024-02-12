/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: [
    //   'uploadthing.com',
    //   'utfs.io',
    //   'img.clerk.com',
    //   'subdomain',
    //   'files.stripe.com',
    // ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'files.stripe.com',
        port: '',
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
