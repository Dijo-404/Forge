import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-wallets",
      "framer-motion",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "future.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({ "node:fs": "commonjs node:fs" });
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
