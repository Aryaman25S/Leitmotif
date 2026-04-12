import type { NextConfig } from "next";

/**
 * Hostnames allowed to load Next.js dev assets (HMR, etc.) when not using localhost.
 * Override with NEXT_DEV_ALLOWED_ORIGINS in .env.local (comma-separated), e.g. `10.0.0.5`.
 */
const fromEnv = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedDevOrigins =
  fromEnv.length > 0 ? fromEnv : ["192.168.1.237"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  env: {
    // Expose whether a real Stability AI key is configured so the client can
    // show accurate UI copy ("Calling Stable Audio 2.5…" vs "demo mode…").
    // This is intentionally the string "1" / "" not the key itself.
    NEXT_PUBLIC_HAS_STABILITY_KEY: process.env.STABILITY_API_KEY ? "1" : "",
  },
};

export default nextConfig;
