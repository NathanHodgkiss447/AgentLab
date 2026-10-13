import { describe, expect, it, vi, beforeEach } from "vitest";
import { getScenario, scenarios, isScenarioId } from "@/data/scenarios";
import { demoScripts } from "@/data/demo";
import { calculateScore, emptyEvaluation, sanitiseEvaluation, sessionExport } from "./evaluation";
import { appendMessage, isActive, transitionPhase } from "./conversation";
import {
  parseSessions,
  readPreferences,
  readSessions,
  STORAGE_KEY,
  validateSession,
  writeSessions,
} from "./storage";
import { allowLocalVoice } from "./elevenlabs/security";
import { getVoiceConfiguration } from "./elevenlabs/configuration";
import type { Message, Session } from "@/types";
export const fixture = (): Session => ({
  id: "test-session",
  scenarioId: "customer-support",
  mode: "demo",
  startedAt: 1000,
  endedAt: 10000,
  duration: 9,
  messages: [{ id: "message", role: "user", text: "Hello", timestamp: 2000 }],
  evaluation: emptyEvaluation(),
  completion: "finished",
});
describe("manual evaluation", () => {
  it("counts only distinct scenario criteria", () =>
    expect(calculateScore(["A", "B", "C", "D", "E"], ["A", "A", "B", "foreign"])).toBe(40));
  it("handles zero and complete checklists", () => {
    expect(calculateScore([], ["A"])).toBe(0);
    expect(calculateScore(["A"], ["A"])).toBe(100);
  });
  it("does not infer an overall assessment", () => {
    const e = { ...emptyEvaluation(), checked: [...scenarios[0].criteria] };
    expect(sanitiseEvaluation(scenarios[0], e).assessment).toBe("not-evaluated");
  });
  it("marks exports as simulated and human-assessed", () => {
    const result = sessionExport(fixture(), scenarios[0]);
    expect(result.simulated).toBe(true);
    expect(result.evaluation.scoringMethod).toBe("human-assessed");
  });
});
describe("scenarios", () => {
  it("has three unique configurations with distinct scripts", () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(3);
    for (const s of scenarios) {
      expect(getScenario(s.id)).toBe(s);
      expect(demoScripts[s.id].length).toBeGreaterThan(2);
      expect(s.criteria.length).toBeGreaterThanOrEqual(4);
    }
  });
  it("falls back safely for invalid URL input", () => {
    expect(getScenario("unknown")).toBe(scenarios[0]);
    expect(isScenarioId("unknown")).toBe(false);
  });
});
describe("storage validation and persistence", () => {
  beforeEach(() => localStorage.clear());
  it("round-trips history in a versioned envelope", () => {
    writeSessions(localStorage, [fixture()]);
    expect(readSessions(localStorage).sessions).toEqual([fixture()]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1);
  });
  it("rejects malformed session fields and backwards dates", () => {
    expect(validateSession({ ...fixture(), mode: "fake" })).toBeNull();
    expect(validateSession({ ...fixture(), endedAt: 0 })).toBeNull();
    expect(validateSession({ ...fixture(), messages: [{ role: "robot" }] })).toBeNull();
  });
  it("strips unknown credential fields and foreign criteria", () => {
    const s = validateSession({
      ...fixture(),
      apiKey: "never-persist",
      evaluation: { ...emptyEvaluation(), checked: ["foreign"] },
    });
    expect(s).not.toHaveProperty("apiKey");
    expect(s?.evaluation.checked).toEqual([]);
  });
  it("rejects unknown versions without changing original storage", () => {
    localStorage.setItem(STORAGE_KEY, '{"version":99,"sessions":[]}');
    expect(readSessions(localStorage).warning).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toContain("99");
  });
  it("retains valid records when one is damaged", () => {
    const result = parseSessions(
      JSON.stringify({ version: 1, sessions: [fixture(), { corrupt: true }] }),
    );
    expect(result.sessions).toEqual([fixture()]);
    expect(result.warning).toBeTruthy();
  });
  it("handles invalid JSON and empty storage", () => {
    expect(parseSessions("{").warning).toBeTruthy();
    expect(parseSessions(null).sessions).toEqual([]);
  });
  it("refuses invalid writes", () => {
    expect(() => writeSessions(localStorage, [{ ...fixture(), duration: -1 }])).toThrow();
    expect(localStorage.length).toBe(0);
  });
  it("defaults malformed preferences to demo", () =>
    expect(readPreferences('{"demoMode":"no"}').demoMode).toBe(true));
});
describe("transcript processing", () => {
  const message: Message = { id: "a", eventId: 1, role: "agent", text: "Hello", timestamp: 1000 };
  it("ignores blank messages", () =>
    expect(appendMessage([], { ...message, text: " " })).toEqual([]));
  it("deduplicates stable IDs and applies corrections", () => {
    expect(appendMessage([message], message)).toHaveLength(1);
    expect(appendMessage([message], { ...message, id: "b", text: "Hello there" })[0].text).toBe(
      "Hello there",
    );
  });
  it("allows identical speech on different turns and shared IDs across roles", () => {
    expect(appendMessage([message], { ...message, eventId: 2, id: "b" })).toHaveLength(2);
    expect(appendMessage([message], { ...message, role: "user", id: "user-a" })).toHaveLength(2);
  });
});
describe("conversation transitions", () => {
  it("blocks out-of-order callbacks", () => {
    expect(transitionPhase("disconnecting", "speaking")).toBe("disconnecting");
    expect(transitionPhase("idle", "speaking")).toBe("idle");
  });
  it("allows the expected lifecycle", () => {
    let state = transitionPhase("idle", "connecting");
    state = transitionPhase(state, "listening");
    state = transitionPhase(state, "speaking");
    state = transitionPhase(state, "disconnecting");
    expect(transitionPhase(state, "disconnected")).toBe("disconnected");
    expect(isActive("connecting")).toBe(true);
    expect(isActive("disconnected")).toBe(false);
  });
});
describe("signed URL security", () => {
  it("requires an enabled, same-origin loopback request", () => {
    const good = new Request("http://localhost:3000/api/voice/signed-url", {
      headers: { origin: "http://localhost:3000" },
    });
    expect(allowLocalVoice(good, true)).toBe(true);
    expect(allowLocalVoice(good, false)).toBe(false);
    expect(allowLocalVoice(new Request(good.url), true)).toBe(false);
    expect(
      allowLocalVoice(new Request(good.url, { headers: { origin: "https://evil.example" } }), true),
    ).toBe(false);
  });
  it("rejects public hosts", () =>
    expect(
      allowLocalVoice(
        new Request("https://demo.example/api/voice/signed-url", {
          headers: { origin: "https://demo.example" },
        }),
        true,
      ),
    ).toBe(false));
  it("fails closed in production even with credentials and the enable flag", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_LIVE_VOICE", "true");
    vi.stubEnv("ELEVENLABS_API_KEY", "test-only");
    vi.stubEnv("ELEVENLABS_AGENT_ID", "test-agent");
    expect(getVoiceConfiguration().available).toBe(false);
    vi.unstubAllEnvs();
  });
  it("fails closed in hosted preview development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "1");
    expect(getVoiceConfiguration().available).toBe(false);
    vi.unstubAllEnvs();
  });
});
