import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Providers } from "./providers";
import { ConversationWorkspace } from "./dashboard/conversation-workspace";
import { SessionReview } from "./evaluation/session-review";
import { SessionHistory } from "./history/session-history";
import { useDemoConversation } from "@/hooks/use-demo-conversation";
import { scenarios } from "@/data/scenarios";
import { readSessions } from "@/lib/storage";
vi.mock("@/lib/demo/clips", () => ({ hasDemoAudio: () => false, getDemoAudioClip: () => null }));
function Demo() {
  const controller = useDemoConversation("customer-support", 4);
  return <ConversationWorkspace controller={controller} scenario={scenarios[0]} mode="demo" speed={4} onSpeedChange={() => {}} configurationAvailable={false} onModeChange={() => {}} />;
}
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
it("completes the recruiter journey: demo → review → evaluation → saved history → confirmed deletion", () => {
  const demo = render(<Providers><Demo /></Providers>);
  fireEvent.click(screen.getByLabelText("Start demo")); act(() => vi.advanceTimersByTime(20000));
  const sessions = readSessions(localStorage).sessions;
  expect(sessions).toHaveLength(1); expect(sessions[0].messages).toHaveLength(6); expect(sessions[0].evaluation.assessment).toBe("not-evaluated");
  expect(screen.getByRole("link", { name: /Review session/ }).getAttribute("href")).toBe(`/sessions/${sessions[0].id}`);
  demo.unmount();
  const review = render(<Providers><SessionReview id={sessions[0].id} /></Providers>);
  fireEvent.click(screen.getByLabelText("Demonstrates empathy")); fireEvent.click(screen.getByLabelText("Acknowledges the issue"));
  expect(screen.getByText("40%")).toBeTruthy(); fireEvent.click(screen.getByLabelText("Pass"));
  fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: "Good empathy; confirm escalation timing." } });
  fireEvent.click(screen.getAllByRole("button", { name: /Save session/ })[0]);
  expect(readSessions(localStorage).sessions[0].evaluation.assessment).toBe("pass");
  expect(readSessions(localStorage).sessions[0].evaluation.notes).toContain("Good empathy"); review.unmount();
  render(<Providers><SessionHistory /></Providers>);
  expect(screen.getAllByText("Pass").length).toBeGreaterThan(0);
  fireEvent.click(screen.getAllByLabelText("Delete session")[0]); expect(screen.getByRole("dialog")).toBeTruthy();
  expect(readSessions(localStorage).sessions).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Delete session" })); expect(readSessions(localStorage).sessions).toHaveLength(0);
});
