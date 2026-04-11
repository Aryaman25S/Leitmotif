import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Expose whether a real Stability AI key is configured so the client can
    // show accurate UI copy ("Calling Stable Audio 2.5…" vs "demo mode…").
    // This is intentionally the string "1" / "" not the key itself.
    NEXT_PUBLIC_HAS_STABILITY_KEY: process.env.STABILITY_API_KEY ? "1" : "",
  },
};

export default nextConfig;
