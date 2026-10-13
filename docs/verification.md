# Verification record

Executed in the restricted local workspace on 2026-10-13 with Node.js 24.15.0.

## Passed

- `npm run typecheck`: main application strict TypeScript compilation.
- `npm run typecheck:live`: passes against the installed official React SDK 1.17.0; installed exports and control signatures inspected.
- `npm run lint`: ESLint, including the optional integration source; no errors or warnings.
- `npm test`: 42 tests across 7 files, including a complete rendered Demo→review→evaluation→history→confirmed deletion journey, static audio lifecycle tests, and recording manifest validation.
- `npm run build`: standard Next.js production build using Webpack; all requested routes plus `/docs` and the API route compiled successfully.
- Production endpoint test: actual route handler returns 403, no upstream fetch, no key in response, no-store headers, even with production credentials and live flag set.
- `node --check scripts/browser-qa.mjs`: browser verification script syntax.

Tests include evaluation score/assessment separation, typed scenario selection/fallback, malformed data, version mismatch, credential-field stripping, local history round trips, transcript deduplication/corrections, connection transition guards, duplicate Demo starts, stop/reset/unmount cleanup, and no Demo voice API calls.

Media tests use a small event-controllable HTMLAudioElement double: same-origin clip/rate selection, transcript advancement after ended, reuse of one media element, mute/unmute, stop/unmount cancellation, stale callbacks after restart, autoplay rejection, decoding-error fallback, and watchdog recovery. Manifest tests reject stale text, external URLs, and missing recordings. These tests validate scheduling and cleanup; actual MP3 playback still requires a browser listening check.

## Blocked / not verified

- `npm run demo:audio:generate`: the generator is ready and server credentials are present, but this sandbox cannot reach ElevenLabs. User-side generation is required to produce the 18 MP3s.
- `npm run demo:audio:check`: currently fails because 18/18 recordings are not yet present. No ElevenLabs audio generation is claimed until the physical asset check passes.

- `npm run dev`: sandbox denies loopback listening (`EPERM 127.0.0.1:3000`).
- Chrome: sandbox rejects socket setup during startup. No browser screenshots, visual comparison, mobile overflow verification, browser console inspection, real downloads, or keyboard focus-trap check have been performed. `design-qa.md` deliberately remains blocked.
- GitHub/Vercel publication: no connected accounts/CLI and no terminal network access. No public URL was produced or claimed.
- Actual browser Demo voice output/quality and genuine live microphone, audio output, mute, reconnect, SDK cleanup, and live transcript behaviour need device/browser verification. Live testing additionally requires developer credentials.

The Demo controller, interactive evaluation, and persistence were verified in React Testing Library/JSDOM. That evidence does not prove rendered browser fidelity, live voice connectivity, or successful public deployment.
