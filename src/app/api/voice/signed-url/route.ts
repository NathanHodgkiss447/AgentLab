import { NextResponse } from "next/server";
import { getVoiceConfiguration } from "@/lib/elevenlabs/configuration";
import { allowLocalVoice } from "@/lib/elevenlabs/security";
import { describeVoiceServiceError, InvalidVoiceResponseError } from "@/lib/elevenlabs/errors";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };
export async function POST(request: Request) {
  const configuration = getVoiceConfiguration();
  // This check precedes every outbound request and cannot be enabled in production.
  if (!configuration.available || !allowLocalVoice(request, configuration.available))
    return NextResponse.json(
      {
        error:
          "Live voice is available only from an explicitly configured local development server.",
      },
      { status: 403, headers },
    );
  try {
    const endpoint = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
    endpoint.searchParams.set("agent_id", process.env.ELEVENLABS_AGENT_ID!);
    endpoint.searchParams.set("include_conversation_id", "true");
    const response = await fetch(endpoint, {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return NextResponse.json(
        {
          error:
            "ElevenLabs could not authorise this agent. Check your server-side agent ID, key permissions, and account availability.",
        },
        { status: 502, headers },
      );
    const body: unknown = await response.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("signed_url" in body) ||
      typeof body.signed_url !== "string" ||
      !body.signed_url.startsWith("wss://")
    )
      throw new InvalidVoiceResponseError();
    return NextResponse.json({ signedUrl: body.signed_url }, { headers });
  } catch (cause) {
    const diagnostic = describeVoiceServiceError(cause);
    console.error(`[AgentLab voice] ${diagnostic.code}`);
    return NextResponse.json(diagnostic, { status: 502, headers });
  }
}
