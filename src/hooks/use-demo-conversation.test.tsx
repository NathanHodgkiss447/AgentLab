import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDemoConversation } from "./use-demo-conversation";
vi.mock("@/lib/demo/clips", () => ({ hasDemoAudio: () => false, getDemoAudioClip: () => null }));
describe("demo lifecycle", () => {
  beforeEach(() => { vi.useFakeTimers(); }); afterEach(() => { cleanup(); vi.useRealTimers(); });
  it("plays a complete scenario and produces an unevaluated simulated session", () => {
    const { result } = renderHook(() => useDemoConversation("product-discovery", 1));
    act(() => result.current.start()); expect(result.current.phase).toBe("connecting");
    act(() => vi.advanceTimersByTime(450)); expect(result.current.phase).toBe("listening");
    act(() => vi.advanceTimersByTime(40000)); expect(result.current.phase).toBe("disconnected"); expect(result.current.messages).toHaveLength(6);
    expect(result.current.session?.mode).toBe("demo"); expect(result.current.session?.evaluation.assessment).toBe("not-evaluated"); expect(result.current.session?.completion).toBe("finished");
  });
  it("prevents duplicate starts and cancels transcript updates on stop", () => {
    const { result } = renderHook(() => useDemoConversation("customer-support", 1)); act(() => { result.current.start(); result.current.start(); });
    act(() => vi.advanceTimersByTime(5000)); expect(result.current.messages).toHaveLength(1);
    act(() => result.current.stop()); const stopped = result.current.session; act(() => vi.advanceTimersByTime(60000));
    expect(result.current.messages).toHaveLength(1); expect(result.current.session).toBe(stopped); expect(stopped?.completion).toBe("stopped");
  });
  it("reset clears the transcript and unmount cancels scheduled events", () => {
    const { result, unmount } = renderHook(() => useDemoConversation("knowledge-boundaries", 4)); act(() => result.current.start()); act(() => vi.advanceTimersByTime(3000)); act(() => result.current.stop()); act(() => result.current.reset());
    expect(result.current.messages).toEqual([]); expect(result.current.phase).toBe("idle"); expect(result.current.session).toBeNull(); act(() => result.current.start()); unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it("never requests microphone access or calls fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch"); const { result } = renderHook(() => useDemoConversation("customer-support", 4)); act(() => result.current.start()); act(() => vi.advanceTimersByTime(15000)); expect(fetchSpy).not.toHaveBeenCalled();
  });
});
