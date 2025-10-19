/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
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
    config.resolve.alias["canvas"] = false;
    return config;
  },
  reactStrictMode: false,
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "pub-0b6394cfeda24bf196c98e1746afe09b.r2.dev",
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
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
