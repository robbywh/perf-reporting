import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "sqpt2b6wjdtjj51t.public.blob.vercel-storage.com",
      "fancy-lioness-45.clerk.accounts.dev",
    ],
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
