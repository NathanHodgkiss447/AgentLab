import { z } from "zod";
import manifest from "@/data/demo-audio-manifest.json";
import { demoScripts } from "@/data/demo";
import type { ScenarioId } from "@/types";

const clipSchema = z.object({
  src: z.string().regex(/^\/audio\/demo\/[a-z-]+-\d{2}-[a-f0-9]{12}\.mp3$/),
  text: z.string(),
  role: z.enum(["user", "agent"]),
  voiceId: z.string().min(1),
  modelId: z.string().min(1),
  generatedAt: z.string(),
});
const parsed = z
  .object({
    version: z.literal(1),
    provider: z.literal("ElevenLabs"),
    clips: z.record(z.string(), z.unknown()),
  })
  .safeParse(manifest);

export function getDemoAudioClip(scenarioId: ScenarioId, index: number): string | null {
  if (!parsed.success) return null;
  const clip = clipSchema.safeParse(parsed.data.clips[`${scenarioId}/${index}`]);
  const line = demoScripts[scenarioId][index];
  return clip.success && line && clip.data.text === line.text && clip.data.role === line.role
    ? clip.data.src
    : null;
}

export function hasDemoAudio(scenarioId: ScenarioId): boolean {
  return demoScripts[scenarioId].every((_, index) => getDemoAudioClip(scenarioId, index) !== null);
}
