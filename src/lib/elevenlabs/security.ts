export function allowLocalVoice(request: Request, enabled: boolean): boolean {
  if (!enabled) return false;
  try {
    const url = new URL(request.url); const origin = request.headers.get("origin");
    if (!origin || origin !== url.origin) return false;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return false;
    if (request.headers.get("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin") return false;
    return true;
  } catch { return false; }
}
