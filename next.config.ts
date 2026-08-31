import type { NextConfig } from "next";
import { resolve } from "node:path";

const projectRoot = resolve(__dirname);

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "canvas"],
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
