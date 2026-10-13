import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
afterEach(() => vi.unstubAllEnvs());
describe("production voice endpoint", () => {
  it("rejects production requests even with the flag and keys, with no upstream request", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("ENABLE_LIVE_VOICE", "true");
    vi.stubEnv("ELEVENLABS_AGENT_ID", "test-agent"); vi.stubEnv("ELEVENLABS_API_KEY", "test-secret-do-not-return");
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await POST(new Request("http://localhost:3000/api/voice/signed-url", { method: "POST", headers: { origin: "http://localhost:3000" } }));
    expect(response.status).toBe(403); expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.text()).not.toContain("test-secret-do-not-return"); expect(upstream).not.toHaveBeenCalled();
  });
});
