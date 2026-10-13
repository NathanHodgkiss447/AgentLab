import type { NextConfig } from "next";
import { createRequire } from "node:module";
import { join } from "node:path";
const requirePackage = createRequire(join(process.cwd(), "package.json"));
let sdkInstalled = false;
try {
  requirePackage.resolve("@elevenlabs/react");
  sdkInstalled = true;
} catch {
  /* Demo can build independently of the optional voice SDK. */
}
const liveModule = sdkInstalled
  ? "./integrations/elevenlabs/live-workspace.tsx"
  : "./src/components/dashboard/live-unavailable.tsx";
const config: NextConfig = {
  poweredByHeader: false,
  env: { AGENTLAB_SDK_INSTALLED: sdkInstalled ? "true" : "false" },
  experimental: {
    useTypeScriptCli: false,
    webpackBuildWorker: false,
    workerThreads: true,
    cpus: 1,
  },
  turbopack: { resolveAlias: { "@agentlab/live": liveModule } },
  webpack(config) {
    config.resolve.alias["@agentlab/live"] = join(process.cwd(), liveModule);
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
      {
        source: "/audio/demo/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};
export default config;
