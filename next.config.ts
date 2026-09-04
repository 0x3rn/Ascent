import type { NextConfig } from "next";
import { resolve } from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const projectRoot = resolve(__dirname);

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "canvas"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;

// This only augments local `next dev` with Cloudflare binding support.
// Vercel still uses the same Next.js config and `next build` command.
if (process.env.OPENNEXT_DEV === "1") {
  initOpenNextCloudflareForDev();
}
