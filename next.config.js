/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/ffmpeg/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/", // ✅ Apply to homepage too
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  productionBrowserSourceMaps: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.devtool = "source-map";
    }
    return config;
  },
  reactStrictMode: false,
  output: "export",
  distDir: "dist",
  // assetPrefix: "/pixpro-remotion-integration/",
  // basePath: "/pixpro-remotion-integration",
  // experimental: {
  //   appDir: true,
  // },

  images: {
    unoptimized: true, // Disable Next.js image optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "pixpro.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pixpro-video-generation.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "bigviz-frontend.projectcampaign.online",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // ⛔ disables type checking
  },
  eslint: {
    ignoreDuringBuilds: true, // disables linting
  },
};

module.exports = nextConfig;
