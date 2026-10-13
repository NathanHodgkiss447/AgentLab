import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("ENABLE_LIVE_VOICE", "true");
  vi.stubEnv("AGENTLAB_SDK_INSTALLED", "true");
  vi.stubEnv("ELEVENLABS_AGENT_ID", "test-agent");
  vi.stubEnv("ELEVENLABS_API_KEY", "test-secret-do-not-return");
});
afterEach(() => vi.unstubAllEnvs());

function localRequest(origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/voice/signed-url", {
    method: "POST",
    headers: { origin },
  });
}

describe("local voice endpoint", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  it("issues a single-use signed URL without exposing the server key", async () => {
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ signed_url: "wss://api.elevenlabs.io/signed-test" }));
    const response = await POST(localRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedUrl: "wss://api.elevenlabs.io/signed-test" });
    const [url, options] = upstream.mock.calls[0];
    expect((url as URL).searchParams.get("agent_id")).toBe("test-agent");
    expect((url as URL).searchParams.get("include_conversation_id")).toBe("true");
    expect(options?.headers).toEqual({ "xi-api-key": "test-secret-do-not-return" });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("rejects cross-origin requests before calling ElevenLabs", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    expect((await POST(localRequest("https://other.example"))).status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("returns a safe error for rejected agent credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("sensitive upstream error", { status: 401 }),
    );
    const response = await POST(localRequest());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toMatch(/test-secret|sensitive upstream/);
  });

  it("rejects a malformed signed URL response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ signed_url: "https://not-a-voice-session" }),
    );
    const response = await POST(localRequest());
    expect(response.status).toBe(502);
    expect((await response.json()).code).toBe("VOICE_INVALID_RESPONSE");
  });

  it("reports a safe DNS diagnostic without leaking the underlying error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed secret=sensitive-key", {
        cause: Object.assign(new Error("private URL"), { code: "ENOTFOUND" }),
      }),
    );
    const response = await POST(localRequest());
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.code).toBe("VOICE_DNS_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/sensitive-key|private URL/);
    expect(console.error).toHaveBeenCalledWith("[AgentLab voice] VOICE_DNS_ERROR");
  });

  it("accepts a same-origin local request on port 3001", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ signed_url: "wss://api.elevenlabs.io/test" }),
    );
    const response = await POST(
      new Request("http://localhost:3001/api/voice/signed-url", {
        method: "POST",
        headers: { origin: "http://localhost:3001" },
      }),
    );
    expect(response.status).toBe(200);
  });

  it("rejects Vercel even if the enable flag is set", async () => {
    vi.stubEnv("VERCEL", "1");
    const upstream = vi.spyOn(globalThis, "fetch");
    expect((await POST(localRequest())).status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
});
describe("production voice endpoint", () => {
  it("rejects production requests even with the flag and keys, with no upstream request", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_LIVE_VOICE", "true");
    vi.stubEnv("ELEVENLABS_AGENT_ID", "test-agent");
    vi.stubEnv("ELEVENLABS_API_KEY", "test-secret-do-not-return");
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await POST(
      new Request("http://localhost:3000/api/voice/signed-url", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
      }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.text()).not.toContain("test-secret-do-not-return");
    expect(upstream).not.toHaveBeenCalled();
  });
});
