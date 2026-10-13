/** One-time local asset generation. Never imported by the browser or a route handler. */
import nextEnv from "@next/env";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { demoScripts } from "../src/data/demo.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const audioDirectory = join(root, "public", "audio", "demo");
const manifestPath = join(root, "src", "data", "demo-audio-manifest.json");
const flags = new Set(process.argv.slice(2));
const lines = Object.entries(demoScripts).flatMap(([scenarioId, script]) =>
  script.map((line, index) => ({ ...line, scenarioId, index, key: `${scenarioId}/${index}` })),
);
const mp3 = (bytes) =>
  bytes.length > 1024 &&
  (bytes.subarray(0, 3).toString("ascii") === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));

async function readManifest() {
  try {
    const value = JSON.parse(await readFile(manifestPath, "utf8"));
    if (
      value.version !== 1 ||
      value.provider !== "ElevenLabs" ||
      !value.clips ||
      typeof value.clips !== "object"
    )
      throw new Error("invalid");
    return value;
  } catch {
    throw new Error(
      "The demo audio manifest is missing or invalid. Restore src/data/demo-audio-manifest.json before generating.",
    );
  }
}

function filenameFor(line, voiceId, modelId) {
  const hash = createHash("sha256")
    .update(JSON.stringify({ text: line.text, role: line.role, voiceId, modelId, settings: "v1" }))
    .digest("hex")
    .slice(0, 12);
  return `${line.scenarioId}-${String(line.index + 1).padStart(2, "0")}-${hash}.mp3`;
}

async function validFile(filename) {
  try {
    return mp3(await readFile(join(audioDirectory, filename)));
  } catch {
    return false;
  }
}

async function check(manifest) {
  const missing = [];
  for (const line of lines) {
    const clip = manifest.clips[line.key];
    if (
      !clip ||
      clip.text !== line.text ||
      clip.role !== line.role ||
      !/^\/audio\/demo\/[a-z-]+-\d{2}-[a-f0-9]{12}\.mp3$/.test(clip.src) ||
      !(await validFile(clip.src.split("/").at(-1)))
    )
      missing.push(line.key);
  }
  if (missing.length)
    throw new Error(
      `${missing.length}/${lines.length} demo recordings are missing or stale. Run npm run demo:audio:generate from a terminal with network access.`,
    );
  console.log(`PASS: ${lines.length} script-matched MP3 recordings are ready for static playback.`);
}

async function main() {
  if ([...flags].some((flag) => !["--check", "--plan"].includes(flag)))
    throw new Error("Supported flags: --check, --plan.");
  const manifest = await readManifest();
  if (flags.has("--check")) {
    await check(manifest);
    return;
  }
  const characters = lines.reduce((sum, line) => sum + line.text.length, 0);
  console.log(
    `Demo catalogue: ${lines.length} clips, ${characters} input characters. Generation uses ElevenLabs credits; visitor playback uses none.`,
  );
  if (flags.has("--plan")) return;

  nextEnv.loadEnvConfig(root, true, { info() {}, error() {} });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey)
    throw new Error(
      "Add ELEVENLABS_API_KEY to .env.local or .env. The key is only read by this local script.",
    );
  const modelId = process.env.ELEVENLABS_DEMO_MODEL_ID || "eleven_multilingual_v2";
  const configured = {
    agent: process.env.ELEVENLABS_DEMO_AGENT_VOICE_ID,
    user: process.env.ELEVENLABS_DEMO_USER_VOICE_ID,
  };
  let defaultVoices = [];
  if (!configured.agent || !configured.user) {
    const response = await fetch(
      "https://api.elevenlabs.io/v2/voices?voice_type=default&language=en&page_size=100",
      {
        headers: { "xi-api-key": apiKey },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      throw new Error(
        `Voice discovery returned HTTP ${response.status}. Allow voice-read permission on your API key, or set both ELEVENLABS_DEMO_AGENT_VOICE_ID and ELEVENLABS_DEMO_USER_VOICE_ID.`,
      );
    const body = await response.json();
    if (!Array.isArray(body.voices)) throw new Error("ElevenLabs returned an invalid voice list.");
    defaultVoices = body.voices.filter(
      (voice) => typeof voice.voice_id === "string" && typeof voice.name === "string",
    );
  }
  const choose = (preferred, exclude) =>
    preferred
      .map((name) =>
        defaultVoices.find(
          (voice) =>
            voice.name.toLowerCase().startsWith(name.toLowerCase()) && voice.voice_id !== exclude,
        ),
      )
      .find(Boolean) ?? defaultVoices.find((voice) => voice.voice_id !== exclude);
  const agent = configured.agent || choose(["George", "Brian", "Adam"])?.voice_id;
  const user = configured.user || choose(["Sarah", "Alice", "Jessica"], agent)?.voice_id;
  if (!agent || !user)
    throw new Error(
      "Two voices could not be selected. Set ELEVENLABS_DEMO_AGENT_VOICE_ID and ELEVENLABS_DEMO_USER_VOICE_ID using voices available to your account.",
    );
  const voiceIds = { agent, user };
  console.log(
    `Agent voice: ${defaultVoices.find((voice) => voice.voice_id === agent)?.name ?? "configured voice"}; user voice: ${defaultVoices.find((voice) => voice.voice_id === user)?.name ?? "configured voice"}. Model: ${modelId}.`,
  );
  await mkdir(audioDirectory, { recursive: true });

  for (const line of lines) {
    const voiceId = voiceIds[line.role];
    const filename = filenameFor(line, voiceId, modelId);
    const src = `/audio/demo/${filename}`;
    let generatedAt =
      manifest.clips[line.key]?.src === src
        ? manifest.clips[line.key].generatedAt
        : new Date().toISOString();
    if (await validFile(filename)) console.log(`Reuse ${line.key}`);
    else {
      console.log(`Generate ${line.key} (${line.text.length} characters)`);
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text: line.text,
          model_id: modelId,
          seed: 1000 + line.index,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok)
        throw new Error(
          `Generation of ${line.key} returned HTTP ${response.status}. Check text-to-speech permissions, voice/model access, and available credits. Completed clips are preserved; rerun to resume.`,
        );
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!mp3(bytes))
        throw new Error(
          `Generation of ${line.key} did not return a valid MP3 file. Completed clips are preserved.`,
        );
      const temporary = join(audioDirectory, `${filename}.${randomUUID()}.part`);
      await writeFile(temporary, bytes, { flag: "wx" });
      await rename(temporary, join(audioDirectory, filename));
      generatedAt = new Date().toISOString();
    }
    manifest.clips[line.key] = {
      src,
      text: line.text,
      role: line.role,
      voiceId,
      modelId,
      generatedAt,
    };
    const temporaryManifest = `${manifestPath}.${randomUUID()}.part`;
    await writeFile(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    await rename(temporaryManifest, manifestPath);
  }
  await check(manifest);
  console.log("Demo clips are ready. Reload the dashboard and press Start demo with Sound on.");
}

try {
  await main();
} catch (error) {
  // Never log API response bodies, headers, environment values, or nested fetch causes.
  console.error(
    error instanceof Error && error.message !== "fetch failed"
      ? error.message
      : "Could not reach ElevenLabs. Run this command from a terminal with network access. Completed clips are preserved.",
  );
  process.exitCode = 1;
}
