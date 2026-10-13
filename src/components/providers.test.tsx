import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers, useStore } from "./providers";
import { PREFERENCES_KEY } from "@/lib/storage";

function PreferencesProbe() {
  const { preferences, storageError, updatePreferences } = useStore();
  return (
    <>
      <output data-testid="preferences">{JSON.stringify(preferences)}</output>
      <output data-testid="storage-error">{storageError}</output>
      <button
        onClick={() => {
          updatePreferences({ autoSave: false });
          updatePreferences({ reducedMotion: true });
        }}
      >
        Update preferences
      </button>
    </>
  );
}

function renderPreferences() {
  return render(
    <StrictMode>
      <Providers>
        <PreferencesProbe />
      </Providers>
    </StrictMode>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("preference persistence", () => {
  it("merges batched updates and persists each once under Strict Mode", () => {
    renderPreferences();
    const write = vi.spyOn(Storage.prototype, "setItem");
    fireEvent.click(screen.getByRole("button", { name: "Update preferences" }));
    const expected = { demoMode: true, autoSave: false, reducedMotion: true };
    expect(JSON.parse(screen.getByTestId("preferences").textContent!)).toEqual(expected);
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toEqual(expected);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("keeps preferences usable and reports a failed storage write", () => {
    renderPreferences();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    fireEvent.click(screen.getByRole("button", { name: "Update preferences" }));
    expect(JSON.parse(screen.getByTestId("preferences").textContent!)).toEqual({
      demoMode: true,
      autoSave: false,
      reducedMotion: true,
    });
    expect(screen.getByTestId("storage-error").textContent).toBe(
      "Your preferences could not be saved to this browser.",
    );
  });

  it("merges updates with preferences synchronised from another tab", () => {
    renderPreferences();
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({
        demoMode: false,
        autoSave: true,
        reducedMotion: false,
      }),
    );
    fireEvent(window, new StorageEvent("storage", { key: PREFERENCES_KEY }));
    fireEvent.click(screen.getByRole("button", { name: "Update preferences" }));
    expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY)!)).toEqual({
      demoMode: false,
      autoSave: false,
      reducedMotion: true,
    });
  });
});
