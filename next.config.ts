import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sqpt2b6wjdtjj51t.public.blob.vercel-storage.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["@clerk/nextjs", "sonner", "lucide-react"],
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          charts: {
            test: /[\\/]node_modules[\\/](recharts|chart\.js)[\\/]/,
            name: "charts",
            chunks: "all",
            priority: 20,
          },
          clerk: {
            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
            name: "clerk",
            chunks: "all",
            priority: 30,
          },
        },
      };
    }

    return config;
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
