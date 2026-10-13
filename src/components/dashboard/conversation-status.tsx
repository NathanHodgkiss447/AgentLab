import { VoiceVisualiser } from "@/components/conversation/visualiser";
import type { Mode, Phase } from "@/types";

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ready to start a conversation",
  "requesting-permission": "Waiting for microphone permission…",
  connecting: "Connecting…",
  connected: "Connected",
  listening: "Agent is listening…",
  speaking: "Agent is speaking…",
  disconnecting: "Ending conversation…",
  disconnected: "Conversation complete",
  error: "Connection interrupted",
};

interface ConversationStatusProps {
  phase: Phase;
  level: number | null;
  mode: Mode;
  hasDemoAudio: boolean;
  messageCount: number;
}

function describeStatus({ phase, mode, hasDemoAudio, messageCount }: ConversationStatusProps) {
  if (phase === "idle") {
    if (mode === "live") return "Microphone access is required. Use headphones for best results.";
    return hasDemoAudio
      ? "Hear a scripted conversation with pre-recorded ElevenLabs voices."
      : "Explore a scripted conversation, then make your own assessment.";
  }
  if (phase === "disconnected") {
    return `${messageCount} messages captured. Ready for your review.`;
  }
  if (mode === "live") return "Real-time voice · SDK audio levels";
  const source = hasDemoAudio ? "Pre-recorded ElevenLabs voices" : "Text demo";
  return `${source} · decorative waveform`;
}

export function ConversationStatus(props: ConversationStatusProps) {
  return (
    <>
      <VoiceVisualiser phase={props.phase} level={props.level} />
      <div className="voice-status" role="status" aria-live="polite">
        <h2>{PHASE_LABELS[props.phase]}</h2>
        <p>{describeStatus(props)}</p>
      </div>
    </>
  );
}
