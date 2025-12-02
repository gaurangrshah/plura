/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client', 'libsql'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize libsql packages to prevent webpack bundling issues
      config.externals = [...(config.externals || []), '@libsql/client', 'libsql'];
    }
    return config;
  },
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
