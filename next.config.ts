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
  reactStrictMode: true,
};

export default nextConfig;
