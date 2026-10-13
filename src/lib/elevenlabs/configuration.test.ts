import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getVoiceConfiguration } from "./configuration";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("ENABLE_LIVE_VOICE", "true");
  vi.stubEnv("AGENTLAB_SDK_INSTALLED", "true");
  vi.stubEnv("ELEVENLABS_AGENT_ID", "test-agent");
  vi.stubEnv("ELEVENLABS_API_KEY", "test-secret");
});
afterEach(() => vi.unstubAllEnvs());

describe("local voice configuration", () => {
  it("enables configured local development without returning secrets", () => {
    const configuration = getVoiceConfiguration();
    expect(configuration.available).toBe(true);
    expect(configuration.agentId).toBe("test-agent");
    expect(JSON.stringify(configuration)).not.toContain("test-secret");
  });

  it.each(["production", "test"])("fails closed in %s", (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    expect(getVoiceConfiguration()).toMatchObject({ available: false, agentId: null });
  });

  it.each([
    "ENABLE_LIVE_VOICE",
    "AGENTLAB_SDK_INSTALLED",
    "ELEVENLABS_AGENT_ID",
    "ELEVENLABS_API_KEY",
  ])("requires %s", (key) => {
    vi.stubEnv(key, "");
    expect(getVoiceConfiguration().available).toBe(false);
  });
});
