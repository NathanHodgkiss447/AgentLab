import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./dashboard";
import type { VoiceConfiguration } from "@/types";

const state = vi.hoisted(() => ({ query: "", demoMode: true }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock("@/components/providers", () => ({
  useStore: () => ({ preferences: { demoMode: state.demoMode }, ready: true }),
}));
vi.mock("@/hooks/use-demo-conversation", () => ({ useDemoConversation: () => ({}) }));
vi.mock("./conversation-workspace", () => ({
  ConversationWorkspace: () => <div>Demo workspace</div>,
}));
vi.mock("@agentlab/live", () => ({ LiveWorkspace: () => <div>Live workspace</div> }));

const configured: VoiceConfiguration = { available: true, agentId: "test-agent", reason: "Local" };
beforeEach(() => {
  state.query = "";
  state.demoMode = true;
});
afterEach(cleanup);

describe("dashboard mode selection", () => {
  it("defaults to the Demo preference", () => {
    render(<Dashboard configuration={configured} />);
    expect(screen.getByText("Demo workspace")).toBeTruthy();
  });
  it("honours an explicit local Live link despite the Demo preference", () => {
    state.query = "mode=live";
    render(<Dashboard configuration={configured} />);
    expect(screen.getByText("Live workspace")).toBeTruthy();
  });
  it("falls back to Demo when Live is unavailable", () => {
    state.query = "mode=live";
    render(<Dashboard configuration={{ ...configured, available: false }} />);
    expect(screen.getByText("Demo workspace")).toBeTruthy();
  });
  it("honours an explicit Demo link despite a Live preference", () => {
    state.query = "mode=demo";
    state.demoMode = false;
    render(<Dashboard configuration={configured} />);
    expect(screen.getByText("Demo workspace")).toBeTruthy();
  });
  it("switches modes when the URL changes without changing scenario", () => {
    const { rerender } = render(<Dashboard configuration={configured} />);
    state.query = "mode=live";
    rerender(<Dashboard configuration={configured} />);
    expect(screen.getByText("Live workspace")).toBeTruthy();
  });
});
