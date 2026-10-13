import type { VoiceConfiguration } from "@/types";
import { hasVoiceSdk } from "./sdk-availability";
export function getVoiceConfiguration(): VoiceConfiguration {
  // No authentication is shipped in this MVP: production must always fail closed.
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL) return { available: false, agentId: null, reason: "Live voice is disabled outside local development. Public Demo Mode is always available." };
  if (process.env.ENABLE_LIVE_VOICE !== "true") return { available: false, agentId: null, reason: "Set ENABLE_LIVE_VOICE=true in .env.local to enable local voice testing." };
  if (!hasVoiceSdk()) return { available: false, agentId: null, reason: "Run npm run setup:live to install and check the official ElevenLabs SDK, then restart the development server." };
  if (!process.env.ELEVENLABS_AGENT_ID || !process.env.ELEVENLABS_API_KEY) return { available: false, agentId: null, reason: "Add ELEVENLABS_AGENT_ID and ELEVENLABS_API_KEY to .env.local, then restart the development server." };
  return { available: true, agentId: process.env.ELEVENLABS_AGENT_ID, reason: "Configured for local development. Live conversations consume ElevenLabs credits." };
}
