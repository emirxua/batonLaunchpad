/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      lokijs: false,
      'pino-pretty': false,
      encoding: false,
    };
    if (!isServer) {
      config.externals = [...(config.externals || []), 'pino-pretty', 'lokijs', 'encoding'];
    }
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
