import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDemoConversation } from "./use-demo-conversation";

vi.mock("@/lib/demo/clips", () => ({
  hasDemoAudio: () => true,
  getDemoAudioClip: (scenario: string, index: number) => `/audio/demo/${scenario}-${index + 1}.mp3`,
}));

class ClipAudio {
  static instances: ClipAudio[] = [];
  src = "";
  preload = "";
  playbackRate = 1;
  defaultPlaybackRate = 1;
  preservesPitch = false;
  duration = 12;
  onplaying: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onloadedmetadata: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => { if (name === "src") this.src = ""; });
  constructor() { ClipAudio.instances.push(this); }
}

beforeEach(() => {
  ClipAudio.instances = [];
  vi.useFakeTimers();
  vi.stubGlobal("Audio", ClipAudio);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("pre-generated ElevenLabs Demo playback", () => {
  it("plays a same-origin clip from the click and waits for its ended event before advancing", () => {
    const { result } = renderHook(() => useDemoConversation("customer-support", 2));
    act(() => result.current.start());
    const audio = ClipAudio.instances[0];
    expect(audio.play).toHaveBeenCalledOnce();
    expect(audio.src).toBe("/audio/demo/customer-support-1.mp3");
    expect(audio.playbackRate).toBe(2);
    expect(audio.preservesPitch).toBe(true);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.messages).toHaveLength(0);
    act(() => audio.onended?.());
    expect(result.current.messages).toHaveLength(1);
    act(() => vi.advanceTimersByTime(300));
    expect(ClipAudio.instances).toHaveLength(1);
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe("/audio/demo/customer-support-2.mp3");
    expect(result.current.phase).toBe("speaking");
  });

  it("finishes all clips once and stores a simulated transcript", () => {
    const { result } = renderHook(() => useDemoConversation("product-discovery", 1));
    act(() => { result.current.start(); result.current.start(); });
    const audio = ClipAudio.instances[0];
    for (let i = 0; i < 6; i++) {
      act(() => audio.onended?.());
      act(() => vi.advanceTimersByTime(600));
    }
    expect(result.current.phase).toBe("disconnected");
    expect(result.current.session?.messages).toHaveLength(6);
    expect(result.current.session?.mode).toBe("demo");
    expect(audio.play).toHaveBeenCalledTimes(6);
  });

  it("stop cancels audio and old media callbacks cannot affect a restarted demo", () => {
    const { result } = renderHook(() => useDemoConversation("customer-support", 1));
    act(() => result.current.start());
    const audio = ClipAudio.instances[0];
    const staleEnd = audio.onended;
    act(() => result.current.stop());
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe("");
    expect(audio.onended).toBeNull();
    act(() => result.current.start());
    act(() => staleEnd?.());
    expect(result.current.messages).toHaveLength(0);
    expect(ClipAudio.instances).toHaveLength(2);
  });

  it("mute cancels the clip, continues text, and enabling sound plays subsequent turns", () => {
    const { result } = renderHook(() => useDemoConversation("customer-support", 1));
    act(() => result.current.start());
    const audio = ClipAudio.instances[0];
    act(() => result.current.demoAudio?.toggle());
    expect(result.current.demoAudio?.enabled).toBe(false);
    expect(audio.pause).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    expect(audio.play).toHaveBeenCalledOnce();
    act(() => result.current.demoAudio?.toggle());
    act(() => vi.advanceTimersByTime(6500 + 600));
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe("/audio/demo/customer-support-3.mp3");
  });

  it("a missing or undecodable clip shows a notice and finishes through text fallback", () => {
    const { result } = renderHook(() => useDemoConversation("knowledge-boundaries", 4));
    act(() => result.current.start());
    const audio = ClipAudio.instances[0];
    act(() => audio.onerror?.());
    expect(result.current.demoAudio?.notice).toMatch(/could not play/);
    act(() => vi.advanceTimersByTime(15000));
    expect(result.current.phase).toBe("disconnected");
    expect(result.current.messages).toHaveLength(6);
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it("handles an autoplay rejection without hanging or using browser synthesis", async () => {
    const { result } = renderHook(() => useDemoConversation("customer-support", 4));
    // Model a browser that rejects playback until it receives a valid gesture.
    class BlockedAudio extends ClipAudio { play = vi.fn(() => Promise.reject(new DOMException("Blocked", "NotAllowedError"))); }
    vi.stubGlobal("Audio", BlockedAudio);
    await act(async () => result.current.start());
    expect(result.current.demoAudio?.notice).toMatch(/could not play/);
    act(() => vi.advanceTimersByTime(15000));
    expect(result.current.phase).toBe("disconnected");
  });

  it("times out a stalled player instead of leaving the session stuck", () => {
    const { result } = renderHook(() => useDemoConversation("customer-support", 4));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.demoAudio?.notice).toMatch(/could not play/);
    expect(result.current.phase).toBe("disconnected");
    expect(result.current.messages).toHaveLength(6);
  });

  it("unmount cancels audio, clears timers, and detaches media handlers", () => {
    const { result, unmount } = renderHook(() => useDemoConversation("customer-support", 1));
    act(() => result.current.start());
    const audio = ClipAudio.instances[0];
    unmount();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.onerror).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("static playback never calls ElevenLabs, requests a microphone, or uses browser speech", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const getUserMedia = vi.fn();
    const speak = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("speechSynthesis", { speak });
    const { result } = renderHook(() => useDemoConversation("customer-support", 1));
    act(() => result.current.start());
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });
});
