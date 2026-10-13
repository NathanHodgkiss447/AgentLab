import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "./providers";
import { ConversationWorkspace } from "./dashboard/conversation-workspace";
import { SessionReview } from "./evaluation/session-review";
import { SessionHistory } from "./history/session-history";
import { Settings } from "./settings/settings";
import { scenarios } from "@/data/scenarios";
import { emptyEvaluation } from "@/lib/evaluation";
import { writeSessions } from "@/lib/storage";
import type { ConversationView, Session } from "@/types";

const session: Session = {
  id: "ui-contract-session",
  scenarioId: "customer-support",
  mode: "demo",
  startedAt: Date.UTC(2026, 9, 13, 12),
  endedAt: Date.UTC(2026, 9, 13, 12, 1),
  duration: 60,
  completion: "finished",
  evaluation: emptyEvaluation(),
  messages: [
    {
      id: "ui-contract-message",
      role: "user",
      text: "Please help with a duplicate charge.",
      timestamp: Date.UTC(2026, 9, 13, 12),
    },
  ],
};

function controller(overrides: Partial<ConversationView> = {}): ConversationView {
  return {
    phase: "idle",
    messages: [],
    elapsed: 0,
    error: null,
    muted: false,
    level: null,
    session: null,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    toggleMute: vi.fn(),
    demoAudio: { enabled: true, supported: true, notice: null, toggle: vi.fn() },
    ...overrides,
  };
}

/** Reviewable snapshots of the UI's public contract, not its component internals. */
function uiContract() {
  const text = (element: Element) => element.textContent?.replace(/\s+/g, " ").trim();
  return {
    headings: screen
      .queryAllByRole("heading")
      .map((element) => ({ tag: element.tagName, text: text(element) })),
    links: screen.queryAllByRole("link").map((element) => ({
      label: element.getAttribute("aria-label") ?? text(element),
      href: element.getAttribute("href"),
      current: element.getAttribute("aria-current"),
    })),
    buttons: screen.queryAllByRole("button").map((element) => ({
      label: element.getAttribute("aria-label") ?? text(element),
      disabled: (element as HTMLButtonElement).disabled,
      pressed: element.getAttribute("aria-pressed"),
    })),
    tabs: screen.queryAllByRole("tab").map((element) => ({
      label: text(element),
      selected: element.getAttribute("aria-selected"),
      controls: element.getAttribute("aria-controls"),
      tabIndex: (element as HTMLElement).tabIndex,
    })),
    fields: [
      ...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      ),
    ].map((element) => ({
      id: element.id,
      type: element.type,
      value: element.value,
      disabled: element.disabled,
      checked: "checked" in element ? element.checked : undefined,
    })),
    statuses: screen.queryAllByRole("status").map(text),
    alerts: screen.queryAllByRole("alert").map(text),
    progress: screen.queryAllByRole("progressbar").map((element) => ({
      label: element.getAttribute("aria-label"),
      value: element.getAttribute("value"),
    })),
    switches: screen.queryAllByRole("switch").map((element) => ({
      id: element.id,
      checked: element.getAttribute("aria-checked"),
      disabled: (element as HTMLButtonElement).disabled,
    })),
  };
}

function renderDashboard(value: ConversationView, mode: "demo" | "live" = "demo") {
  render(
    <Providers>
      <ConversationWorkspace
        controller={value}
        scenario={scenarios[0]}
        mode={mode}
        speed={1}
        onSpeedChange={vi.fn()}
        configurationAvailable={mode === "live"}
        onModeChange={vi.fn()}
      />
    </Providers>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("13 Oct 2026, 12:00");
  vi.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("13 Oct 2026");
  vi.spyOn(Date.prototype, "toLocaleTimeString").mockReturnValue("12:00");
});
afterEach(cleanup);

describe("workspace interactions", () => {
  it("starts, resets, and toggles demo sound through the controller", () => {
    const value = controller({ phase: "disconnected", messages: session.messages });
    renderDashboard(value);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    expect(value.start).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Reset conversation" }));
    expect(value.reset).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Mute demo audio" }));
    expect(value.demoAudio?.toggle).toHaveBeenCalledOnce();
  });

  it("stops an active conversation instead of starting a duplicate", () => {
    const value = controller({ phase: "speaking" });
    renderDashboard(value);
    fireEvent.click(screen.getByRole("button", { name: "Stop demo" }));
    expect(value.stop).toHaveBeenCalledOnce();
    expect(value.start).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("button", { name: "Reset conversation" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("moves keyboard focus and tab selection between transcript and evaluation", () => {
    renderDashboard(controller());
    const transcript = screen.getByRole("tab", { name: /Transcript/ });
    const evaluation = screen.getByRole("tab", { name: "Evaluation" });
    transcript.focus();
    fireEvent.keyDown(transcript, { key: "ArrowRight" });
    expect(document.activeElement).toBe(evaluation);
    expect(evaluation.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("evaluation-tab");
    fireEvent.keyDown(evaluation, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(transcript);
    expect(transcript.getAttribute("aria-selected")).toBe("true");
  });

  it.each(["requesting-permission", "connecting", "disconnecting"] as const)(
    "locks configuration and microphone during %s",
    (phase) => {
      renderDashboard(controller({ phase }), "live");
      fireEvent.click(screen.getByRole("button", { name: "Session options" }));
      expect((screen.getByLabelText("Session mode") as HTMLSelectElement).disabled).toBe(true);
      expect(
        (screen.getByRole("button", { name: "Mute microphone" }) as HTMLButtonElement).disabled,
      ).toBe(true);
    },
  );
});

describe("UI contracts captured before the readability refactor", () => {
  it("preserves the idle Demo controls and transcript", () => {
    renderDashboard(controller());
    expect(uiContract()).toMatchSnapshot();
  });
  it("preserves playback controls and disabled states", () => {
    renderDashboard(controller({ phase: "speaking", messages: session.messages, elapsed: 10 }));
    expect(uiContract()).toMatchSnapshot();
  });
  it("preserves completed-session review navigation", () => {
    renderDashboard(controller({ phase: "disconnected", messages: session.messages, session }));
    expect(uiContract()).toMatchSnapshot();
  });
  it("preserves live microphone controls", () => {
    renderDashboard(controller({ phase: "listening", muted: true, demoAudio: undefined }), "live");
    expect(uiContract()).toMatchSnapshot();
  });
  it("preserves the review form", () => {
    writeSessions(localStorage, [session]);
    render(
      <Providers>
        <SessionReview id={session.id} />
      </Providers>,
    );
    expect(uiContract()).toMatchSnapshot();
  });
  it("preserves desktop/mobile history actions", () => {
    writeSessions(localStorage, [session]);
    render(
      <Providers>
        <SessionHistory />
      </Providers>,
    );
    expect(uiContract()).toMatchSnapshot();
  });
  it("preserves settings controls", () => {
    render(
      <Providers>
        <Settings
          configuration={{
            available: false,
            agentId: null,
            reason: "Live voice is disabled in production.",
          }}
        />
      </Providers>,
    );
    expect(uiContract()).toMatchSnapshot();
  });
});
