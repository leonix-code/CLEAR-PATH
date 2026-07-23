import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output creates a minimal production build
  // suitable for Docker deployment.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/output
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Development optimizations
  ...(process.env.NODE_ENV !== "production" && {
    // Enable React strict mode for catching issues during development
    reactStrictMode: true,
    
    // Faster source maps for development
    productionBrowserSourceMaps: false,
    
    // Disable ESLint during dev for faster iteration (run lint separately)
    eslint: {
      ignoreDuringBuilds: true,
    },

    // Improved logging for debugging
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),

  // Compress responses (enabled by default, explicit here for clarity)
  compress: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features for faster dev
  experimental: {
    // Optimize CSS inlining for faster page loads
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
    
    // Enable server actions (if used)
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
