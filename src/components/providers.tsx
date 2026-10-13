"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  defaultPreferences,
  PREFERENCES_KEY,
  readPreferences,
  readSessions,
  STORAGE_KEY,
  writeSessions,
} from "@/lib/storage";
import type { Preferences, Session } from "@/types";
interface Store {
  sessions: Session[];
  preferences: Preferences;
  ready: boolean;
  storageError: string | null;
  saveSession: (session: Session) => boolean;
  deleteSession: (id: string) => boolean;
  updatePreferences: (next: Partial<Preferences>) => void;
}
const StoreContext = createContext<Store | null>(null);
export function Providers({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const preferencesRef = useRef(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    function load() {
      try {
        const result = readSessions(localStorage);
        setSessions(result.sessions);
        setStorageError(result.warning);
        const loadedPreferences = readPreferences(localStorage.getItem(PREFERENCES_KEY));
        preferencesRef.current = loadedPreferences;
        setPreferences(loadedPreferences);
      } catch {
        setStorageError(
          "Browser storage is unavailable. You can still review and export your session.",
        );
      }
      setReady(true);
    }
    load();
    const sync = (event: StorageEvent) => {
      if ([STORAGE_KEY, PREFERENCES_KEY, null].includes(event.key)) load();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const saveSession = useCallback((session: Session) => {
    try {
      // Read before writing so another tab's recent sessions are retained.
      const { sessions: existing } = readSessions(localStorage);
      const next = [session, ...existing.filter((s) => s.id !== session.id)].sort(
        (a, b) => b.startedAt - a.startedAt,
      );
      writeSessions(localStorage, next);
      setSessions(next);
      setStorageError(null);
      return true;
    } catch (error) {
      setStorageError(
        error instanceof Error && /invalid|full/.test(error.message)
          ? error.message
          : "Could not save to this browser. Export the session to keep a copy.",
      );
      return false;
    }
  }, []);
  const deleteSession = useCallback((id: string) => {
    try {
      const next = readSessions(localStorage).sessions.filter((s) => s.id !== id);
      writeSessions(localStorage, next);
      setSessions(next);
      setStorageError(null);
      return true;
    } catch {
      setStorageError("Could not delete the session from browser storage.");
      return false;
    }
  }, []);
  const updatePreferences = useCallback((next: Partial<Preferences>) => {
    // Keep consecutive updates composable without side effects in a React updater.
    const value = { ...preferencesRef.current, ...next };
    preferencesRef.current = value;
    setPreferences(value);
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
    } catch {
      setStorageError("Your preferences could not be saved to this browser.");
    }
  }, []);
  return (
    <StoreContext.Provider
      value={{
        sessions,
        preferences,
        ready,
        storageError,
        saveSession,
        deleteSession,
        updatePreferences,
      }}
    >
      <MotionConfig reducedMotion={preferences.reducedMotion ? "always" : "user"}>
        <div data-reduced-motion={preferences.reducedMotion || undefined}>{children}</div>
      </MotionConfig>
    </StoreContext.Provider>
  );
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store provider is missing");
  return store;
}
