# Security boundaries

Production voice is unconditionally denied. `getVoiceConfiguration` requires `NODE_ENV=development`, no Vercel environment, explicit enablement, the official SDK, and server credentials. The route checks availability before touching upstream APIs. There is no client switch capable of enabling production voice.

Local requests must use a loopback hostname and matching Origin. The development server binds to `127.0.0.1`. This is a development boundary, not production authentication. Do not expose that server through a tunnel or change its binding for shared use with live credentials enabled.

The signed-URL route returns generic upstream errors, never the API key or upstream response body. Its responses use `Cache-Control: no-store, private`. Requests have a ten-second timeout. API secrets are never referenced by browser modules. Session schemas omit keys, tokens, signed URLs, or recordings.

Demo Mode performs no voice API calls. Public use therefore cannot request signed URLs or spend ElevenLabs credits through this application. It does not prevent someone from directly using a publicly configured ElevenLabs agent; configure your agent's own access settings appropriately.

Demo audio generation is a separate, manually run local Node script that reads the server-side key and consumes credits once. It is not reachable from a public route or included in the client bundle. Generated clips contain only the synthetic scripted dialogue and are intended as public static assets. The manifest contains voice/model IDs and script text, never credentials. Visitor playback fetches only application-hosted MP3s.

Session text may be sensitive. Browser storage is local to an origin; any same-origin script can access it. Avoid secrets in transcripts, review exports before sharing, and clear sessions when using a shared browser. Live audio goes to ElevenLabs and follows that provider's configured processing/retention policies.

Before supporting production live access: established authentication and authorization, persistent rate limiting, per-user/global usage limits, maximum session durations enforced server-side, usage monitoring, and a server-side kill switch. A hidden UI control is not protection.

The project includes clickjacking denial, content-type protection, referrer policy, and microphone/camera/geolocation permissions headers. A stricter Content Security Policy is deferred until browser/SDK origin requirements are verified.
