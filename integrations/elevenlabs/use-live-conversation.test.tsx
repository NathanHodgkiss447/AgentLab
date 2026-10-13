import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HookOptions } from "@elevenlabs/react";
import { useLiveConversation } from "./use-live-conversation";

// Test our adapter contract, not the SDK's audio/network implementation.
const sdk = vi.hoisted(() => ({
  startSession: vi.fn(),
  endSession: vi.fn(),
  getInputVolume: vi.fn(() => 0.25),
  getOutputVolume: vi.fn(() => 0.75),
  setMuted: vi.fn(),
}));
vi.mock("@elevenlabs/react", () => ({
  useConversationControls: () => sdk,
  useConversationInput: () => ({ isMuted: false, setMuted: sdk.setMuted }),
}));

const stopTrack = vi.fn();
const microphone = vi.fn();
const authorise = vi.fn();

function callbacks(index = 0): HookOptions {
  return sdk.startSession.mock.calls[index][0] as HookOptions;
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.values(sdk).forEach((mock) => mock.mockClear());
  sdk.setMuted.mockReset();
  stopTrack.mockClear();
  microphone.mockReset().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  authorise
    .mockReset()
    .mockImplementation(async () => Response.json({ signedUrl: "wss://api.elevenlabs.io/test" }));
  vi.stubGlobal("fetch", authorise);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: microphone } });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("local live conversation adapter", () => {
  it("does not call microphone controls until the SDK has an active conversation", async () => {
    let active = false;
    sdk.setMuted.mockImplementation(() => {
      if (!active) throw new Error("No active conversation. Call startSession() first.");
    });
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    act(() => result.current.toggleMute?.());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.phase).toBe("connecting");
    expect(sdk.setMuted).not.toHaveBeenCalled();
    act(() => {
      active = true;
      callbacks().onConnect?.({ conversationId: "active-conversation" });
    });
    expect(sdk.setMuted).toHaveBeenCalledWith(false);
    expect(result.current.phase).toBe("listening");
    act(() => {
      result.current.stop();
    });
    active = false;
    const calls = sdk.setMuted.mock.calls.length;
    act(() => result.current.toggleMute?.());
    expect(sdk.setMuted).toHaveBeenCalledTimes(calls);
  });

  it("connects with a signed URL, processes turns, samples audio, mutes, and completes", async () => {
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      await result.current.start();
    });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(authorise).toHaveBeenCalledWith(
      "/api/voice/signed-url",
      expect.objectContaining({ method: "POST" }),
    );
    expect(callbacks()).toMatchObject({
      connectionType: "websocket",
      signedUrl: "wss://api.elevenlabs.io/test",
    });
    act(() => callbacks().onConnect?.({ conversationId: "conversation-1" }));
    expect(result.current.phase).toBe("listening");
    act(() => {
      callbacks().onMessage?.({
        role: "user",
        source: "user",
        message: "I was charged twice.",
        event_id: 1,
      });
      callbacks().onMessage?.({
        role: "agent",
        source: "ai",
        message: "I can help.",
        event_id: 2,
        response_id: "reply-1",
      });
      callbacks().onMessage?.({
        role: "agent",
        source: "ai",
        message: "I can help with your bill.",
        event_id: 2,
        response_id: "reply-1",
      });
      callbacks().onModeChange?.({ mode: "speaking" });
      vi.advanceTimersByTime(1200);
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe("I can help with your bill.");
    expect(result.current.level).toBe(0.75);
    expect(result.current.elapsed).toBe(1);
    act(() => result.current.toggleMute?.());
    expect(sdk.setMuted).toHaveBeenLastCalledWith(true);
    act(() => {
      result.current.stop();
    });
    expect(result.current.phase).toBe("disconnecting");
    act(() => callbacks().onDisconnect?.({ reason: "user" }));
    expect(result.current.session).toMatchObject({
      mode: "live",
      scenarioId: "customer-support",
      duration: 1,
      completion: "stopped",
      conversationId: "conversation-1",
    });
    expect(result.current.session?.messages).toHaveLength(2);
    expect(JSON.stringify(result.current.session)).not.toContain("wss://");
    expect(result.current.phase).toBe("disconnected");
  });

  it("prevents duplicate starts while permission is pending and cancels safely", async () => {
    let grant!: (value: unknown) => void;
    microphone.mockReturnValue(
      new Promise((resolve) => {
        grant = resolve;
      }),
    );
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    let pending!: void | Promise<void>;
    act(() => {
      pending = result.current.start();
      result.current.start();
    });
    expect(microphone).toHaveBeenCalledOnce();
    act(() => {
      result.current.stop();
    });
    await act(async () => {
      grant({ getTracks: () => [{ stop: stopTrack }] });
      await pending;
    });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(authorise).not.toHaveBeenCalled();
    expect(sdk.startSession).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("disconnected");
    expect(result.current.session).toBeNull();
  });

  it("shows permission denial without making an API request", async () => {
    microphone.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.phase).toBe("error");
    expect(result.current.error).toContain("Microphone access was denied");
    expect(authorise).not.toHaveBeenCalled();
  });

  it("times out a hung authorisation request and aborts it", async () => {
    authorise.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      void result.current.start();
    });
    const signal = authorise.mock.calls[0][1].signal as AbortSignal;
    act(() => vi.advanceTimersByTime(25_000));
    expect(signal.aborted).toBe(true);
    expect(result.current.phase).toBe("error");
    expect(result.current.error).toContain("timed out");
    expect(sdk.startSession).not.toHaveBeenCalled();
  });

  it("preserves completed messages on a connection error and ignores later events", async () => {
    const { result } = renderHook(() => useLiveConversation("knowledge-boundaries"));
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      callbacks().onConnect?.({ conversationId: "conversation-2" });
      callbacks().onMessage?.({
        role: "user",
        source: "user",
        message: "What can you verify?",
        event_id: 1,
      });
      callbacks().onError?.("Network failed");
      callbacks().onMessage?.({
        role: "agent",
        source: "ai",
        message: "Late message",
        event_id: 2,
      });
      callbacks().onModeChange?.({ mode: "speaking" });
    });
    expect(result.current.phase).toBe("error");
    expect(result.current.session?.completion).toBe("connection-lost");
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.session?.messages).toHaveLength(1);
  });

  it("does not let stale connection callbacks stop a restarted conversation", async () => {
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      await result.current.start();
    });
    const previous = callbacks();
    act(() => {
      result.current.stop();
      vi.advanceTimersByTime(10_000);
    });
    await act(async () => {
      await result.current.start();
    });
    const endCalls = sdk.endSession.mock.calls.length;
    act(() => {
      previous.onConnect?.({ conversationId: "old-conversation" });
      previous.onDisconnect?.({ reason: "user" });
      callbacks(1).onConnect?.({ conversationId: "new-conversation" });
    });
    expect(sdk.endSession).toHaveBeenCalledTimes(endCalls);
    expect(result.current.phase).toBe("listening");
  });

  it("ends the SDK and cancels timers when navigating away", async () => {
    const { result, unmount } = renderHook(() => useLiveConversation("product-discovery"));
    await act(async () => {
      await result.current.start();
    });
    act(() => callbacks().onConnect?.({ conversationId: "conversation-3" }));
    unmount();
    expect(sdk.endSession).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("releases a late microphone permission grant after unmount", async () => {
    let grant!: (value: unknown) => void;
    microphone.mockReturnValue(
      new Promise((resolve) => {
        grant = resolve;
      }),
    );
    const { result, unmount } = renderHook(() => useLiveConversation("customer-support"));
    let pending!: void | Promise<void>;
    act(() => {
      pending = result.current.start();
    });
    unmount();
    await act(async () => {
      grant({ getTracks: () => [{ stop: stopTrack }] });
      await pending;
    });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(authorise).not.toHaveBeenCalled();
  });

  it("shows server authorisation failures and never starts the SDK", async () => {
    authorise.mockResolvedValue(
      Response.json({ error: "Live voice unavailable." }, { status: 403 }),
    );
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe("Live voice unavailable.");
    expect(result.current.phase).toBe("error");
    expect(sdk.startSession).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1); // Only the mounted audio/timer sampler remains.
  });

  it("times out an SDK connection that never completes", async () => {
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      await result.current.start();
    });
    act(() => vi.advanceTimersByTime(25_000));
    expect(sdk.endSession).toHaveBeenCalledOnce();
    expect(result.current.phase).toBe("error");
    expect(result.current.session).toBeNull();
  });

  it("records an agent-ended session as finished", async () => {
    const { result } = renderHook(() => useLiveConversation("customer-support"));
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      callbacks().onConnect?.({ conversationId: "agent-ended" });
      callbacks().onDisconnect?.({ reason: "agent" });
    });
    expect(result.current.session?.completion).toBe("finished");
    expect(result.current.phase).toBe("disconnected");
  });
});
