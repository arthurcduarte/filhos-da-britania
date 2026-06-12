import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow base64 data URLs from the Imagen API
    dangerouslyAllowSVG: false,
    remotePatterns: [],
  },
};

export default nextConfig;
