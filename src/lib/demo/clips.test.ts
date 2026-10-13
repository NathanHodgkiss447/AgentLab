import { describe, expect, it, vi } from "vitest";
import { demoScripts } from "@/data/demo";
vi.mock("@/data/demo-audio-manifest.json", async () => {
  const { demoScripts: scripts } = await import("@/data/demo");
  const clip = {
    src: "/audio/demo/customer-support-01-aaaaaaaaaaaa.mp3",
    text: scripts["customer-support"][0].text,
    role: "user",
    voiceId: "fixture-voice",
    modelId: "eleven_multilingual_v2",
    generatedAt: "2026-10-13",
  };
  return {
    default: {
      version: 1,
      provider: "ElevenLabs",
      clips: {
        "customer-support/0": clip,
        "customer-support/1": { ...clip, text: "Stale recording text" },
        "customer-support/2": {
          ...clip,
          text: scripts["customer-support"][2].text,
          src: "https://external.example/audio.mp3",
        },
      },
    },
  };
});
import { getDemoAudioClip, hasDemoAudio } from "./clips";
describe("demo recording manifest", () => {
  it("accepts a script-matched static recording", () =>
    expect(getDemoAudioClip("customer-support", 0)).toBe(
      "/audio/demo/customer-support-01-aaaaaaaaaaaa.mp3",
    ));
  it("rejects stale speech, external URLs, and missing entries", () => {
    expect(getDemoAudioClip("customer-support", 1)).toBeNull();
    expect(getDemoAudioClip("customer-support", 2)).toBeNull();
    expect(getDemoAudioClip("product-discovery", 0)).toBeNull();
  });
  it("does not advertise a partly generated scenario as ready", () => {
    expect(hasDemoAudio("customer-support")).toBe(false);
    expect(demoScripts["customer-support"]).toHaveLength(6);
  });
});
