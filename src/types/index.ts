export type Mode = "demo" | "live";
export type Phase =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "connected"
  | "listening"
  | "speaking"
  | "disconnecting"
  | "disconnected"
  | "error";
export type Assessment = "pass" | "needs-improvement" | "fail" | "not-evaluated";
export type ScenarioId = "customer-support" | "product-discovery" | "knowledge-boundaries";
export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  category: string;
  criteria: readonly string[];
  opening: string;
}
export interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
  eventId?: number;
}
export interface Evaluation {
  checked: string[];
  assessment: Assessment;
  notes: string;
}
export interface Session {
  id: string;
  scenarioId: ScenarioId;
  mode: Mode;
  startedAt: number;
  endedAt: number;
  duration: number;
  messages: Message[];
  evaluation: Evaluation;
  conversationId?: string;
  completion: "finished" | "stopped" | "connection-lost";
}
export interface Preferences {
  demoMode: boolean;
  autoSave: boolean;
  reducedMotion: boolean;
}
export interface VoiceConfiguration {
  available: boolean;
  agentId: string | null;
  reason: string;
}
export interface DemoAudio {
  enabled: boolean;
  supported: boolean | null;
  notice: string | null;
  toggle: () => void;
}
export interface ConversationView {
  phase: Phase;
  messages: Message[];
  elapsed: number;
  error: string | null;
  muted: boolean;
  level: number | null;
  session: Session | null;
  start: () => void | Promise<void>;
  stop: () => void | Promise<void>;
  reset: () => void;
  toggleMute?: () => void;
  demoAudio?: DemoAudio;
}
