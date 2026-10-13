import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@agentlab/live": fileURLToPath(
        new URL("./integrations/elevenlabs/live-workspace.tsx", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "integrations/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    clearMocks: true,
  },
});
