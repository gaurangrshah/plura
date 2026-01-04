import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps to Sentry
  widenClientFileUpload: true,

  // Disable Sentry telemetry
  disableLogger: true,

  // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: true,
});
