export type VoiceServiceErrorCode =
  | "VOICE_TIMEOUT"
  | "VOICE_DNS_ERROR"
  | "VOICE_TLS_ERROR"
  | "VOICE_NETWORK_ERROR"
  | "VOICE_INVALID_RESPONSE";

const ERROR_MESSAGES: Record<VoiceServiceErrorCode, string> = {
  VOICE_TIMEOUT: "The server timed out contacting ElevenLabs. Try again or check your network/VPN.",
  VOICE_DNS_ERROR:
    "The server could not resolve api.elevenlabs.io. Check your DNS, network, or VPN.",
  VOICE_TLS_ERROR:
    "The server could not verify ElevenLabs' TLS certificate. Check your system certificates or HTTPS proxy; do not disable TLS verification.",
  VOICE_NETWORK_ERROR:
    "The server could not connect to ElevenLabs. Check your network, VPN, firewall, or proxy.",
  VOICE_INVALID_RESPONSE:
    "ElevenLabs returned an invalid signed-URL response. Try again; if it persists, check for an intercepting proxy or service issue.",
};

export class InvalidVoiceResponseError extends Error {}

// Inspect only known error names/codes. Never return raw messages, URLs, or bodies.
function collectErrorCodes(error: unknown, depth = 0): string[] {
  if (!error || typeof error !== "object" || depth > 3) return [];
  const codes: string[] = [];
  if ("name" in error && typeof error.name === "string") codes.push(error.name);
  if ("code" in error && typeof error.code === "string") codes.push(error.code);
  if ("cause" in error) codes.push(...collectErrorCodes(error.cause, depth + 1));
  if ("errors" in error && Array.isArray(error.errors)) {
    for (const nested of error.errors) codes.push(...collectErrorCodes(nested, depth + 1));
  }
  return codes;
}

export function describeVoiceServiceError(error: unknown) {
  const codes = collectErrorCodes(error);
  let code: VoiceServiceErrorCode = "VOICE_NETWORK_ERROR";
  if (error instanceof InvalidVoiceResponseError || error instanceof SyntaxError) {
    code = "VOICE_INVALID_RESPONSE";
  } else if (
    codes.some((value) =>
      [
        "TimeoutError",
        "AbortError",
        "ETIMEDOUT",
        "UND_ERR_CONNECT_TIMEOUT",
        "UND_ERR_HEADERS_TIMEOUT",
        "UND_ERR_BODY_TIMEOUT",
      ].includes(value),
    )
  ) {
    code = "VOICE_TIMEOUT";
  } else if (codes.some((value) => ["ENOTFOUND", "EAI_AGAIN"].includes(value))) {
    code = "VOICE_DNS_ERROR";
  } else if (
    codes.some((value) =>
      [
        "CERT_HAS_EXPIRED",
        "DEPTH_ZERO_SELF_SIGNED_CERT",
        "SELF_SIGNED_CERT_IN_CHAIN",
        "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
        "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
        "ERR_TLS_CERT_ALTNAME_INVALID",
      ].includes(value),
    )
  ) {
    code = "VOICE_TLS_ERROR";
  }
  return { code, error: `${ERROR_MESSAGES[code]} (${code})` };
}
