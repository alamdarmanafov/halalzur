import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This repo also has a root-level package-lock.json (the Expo mobile
  // app) alongside website/package-lock.json, which makes Next.js guess
  // the wrong workspace root for file tracing. Pin it explicitly.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
