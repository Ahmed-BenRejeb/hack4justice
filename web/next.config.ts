import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image to the server and the dependencies it actually uses.
  output: "standalone",
};

export default nextConfig;
