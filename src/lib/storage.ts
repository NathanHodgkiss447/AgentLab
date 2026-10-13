import { z } from "zod";
import { getScenario } from "@/data/scenarios";
import { sanitiseEvaluation } from "@/lib/evaluation";
import type { Preferences, Session } from "@/types";
export const STORAGE_KEY = "agentlab.sessions.v1";
export const PREFERENCES_KEY = "agentlab.preferences.v1";
const timestamp = z.number().finite().min(0).max(8640000000000000);
const messageSchema = z.object({
  id: z.string().min(1).max(200),
  role: z.enum(["user", "agent"]),
  text: z.string().max(50000),
  timestamp,
  eventId: z.number().optional(),
});
export const sessionSchema = z
  .object({
    id: z.string().min(1).max(200),
    scenarioId: z.enum(["customer-support", "product-discovery", "knowledge-boundaries"]),
    mode: z.enum(["demo", "live"]),
    startedAt: timestamp,
    endedAt: timestamp,
    duration: z.number().finite().min(0).max(86400),
    messages: z.array(messageSchema).max(2000),
    evaluation: z.object({
      checked: z.array(z.string()).max(50),
      assessment: z.enum(["pass", "needs-improvement", "fail", "not-evaluated"]),
      notes: z.string().max(10000),
    }),
    conversationId: z.string().max(200).optional(),
    completion: z.enum(["finished", "stopped", "connection-lost"]),
  })
  .refine((s) => s.endedAt >= s.startedAt, "Session must end after it starts");
const envelopeSchema = z.object({ version: z.literal(1), sessions: z.array(z.unknown()).max(500) });
export const defaultPreferences: Preferences = {
  demoMode: true,
  autoSave: true,
  reducedMotion: false,
};
const preferencesSchema = z.object({
  demoMode: z.boolean(),
  autoSave: z.boolean(),
  reducedMotion: z.boolean(),
});
export function validateSession(value: unknown): Session | null {
  const result = sessionSchema.safeParse(value);
  if (!result.success) return null;
  return {
    ...result.data,
    evaluation: sanitiseEvaluation(getScenario(result.data.scenarioId), result.data.evaluation),
  };
}
export function parseSessions(raw: string | null): { sessions: Session[]; warning: string | null } {
  if (!raw) return { sessions: [], warning: null };
  try {
    const envelope = envelopeSchema.safeParse(JSON.parse(raw));
    if (!envelope.success)
      return {
        sessions: [],
        warning:
          "Stored history uses an unsupported or damaged format. Your original data has been preserved.",
      };
    const sessions = envelope.data.sessions
      .map(validateSession)
      .filter((s): s is Session => s !== null);
    return {
      sessions: [...new Map(sessions.map((s) => [s.id, s])).values()],
      warning:
        sessions.length < envelope.data.sessions.length
          ? "Some damaged session records could not be loaded. Original storage is preserved until you save a change."
          : null,
    };
  } catch {
    return {
      sessions: [],
      warning: "Session history could not be read. Your original data has been preserved.",
    };
  }
}
export function readSessions(storage: Pick<Storage, "getItem">) {
  return parseSessions(storage.getItem(STORAGE_KEY));
}
export function writeSessions(storage: Pick<Storage, "setItem">, sessions: Session[]) {
  if (sessions.length > 500 || sessions.some((s) => !validateSession(s)))
    throw new Error(
      "Session data is invalid or history is full. Export and remove older sessions first.",
    );
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, sessions }));
}
export function readPreferences(raw: string | null): Preferences {
  try {
    return preferencesSchema.parse(JSON.parse(raw ?? "null"));
  } catch {
    return defaultPreferences;
  }
}
