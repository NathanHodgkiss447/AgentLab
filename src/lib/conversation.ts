import type { Message, Phase } from "@/types";
export const activePhases: readonly Phase[] = [
  "requesting-permission",
  "connecting",
  "connected",
  "listening",
  "speaking",
  "disconnecting",
];
export const isActive = (phase: Phase) => activePhases.includes(phase);
const transitions: Record<Phase, readonly Phase[]> = {
  idle: ["connecting", "requesting-permission"],
  "requesting-permission": ["connecting", "error", "disconnecting", "disconnected"],
  connecting: ["connected", "listening", "speaking", "error", "disconnecting", "disconnected"],
  connected: ["listening", "speaking", "disconnecting", "disconnected", "error"],
  listening: ["speaking", "disconnecting", "disconnected", "error"],
  speaking: ["listening", "disconnecting", "disconnected", "error"],
  disconnecting: ["disconnected", "error"],
  disconnected: ["idle", "connecting", "requesting-permission", "error"],
  error: ["idle", "connecting", "requesting-permission", "disconnecting", "disconnected"],
};
export function transitionPhase(current: Phase, next: Phase): Phase {
  return current === next || transitions[current].includes(next) ? next : current;
}
export function appendMessage(messages: Message[], incoming: Message): Message[] {
  if (!incoming.text.trim()) return messages;
  const index = messages.findIndex(
    (m) =>
      m.id === incoming.id ||
      (incoming.eventId !== undefined &&
        m.eventId === incoming.eventId &&
        m.role === incoming.role),
  );
  if (index >= 0) return messages.map((m, i) => (i === index ? { ...m, text: incoming.text } : m));
  return [...messages, incoming];
}
