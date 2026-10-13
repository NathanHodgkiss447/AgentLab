# AgentLab

**Test. Listen. Improve.**

A developer-focused AI voice agent testing studio built with Next.js, TypeScript and ElevenLabs. Run a testing scenario, follow the transcript, make a human assessment, and keep an exportable record of what you learned.

## 1. Introduction

AgentLab is a focused portfolio MVP demonstrating a complete conversation-testing workflow. Public Demo Mode works without authentication, credentials, a database, or ElevenLabs usage. Live voice is an optional local development integration, never an unauthenticated production feature.

**Demo:** [Open AgentLab](https://agent-lab-beryl.vercel.app/dashboard?mode=demo) · **Source:** [NathanHodgkiss447/AgentLab](https://github.com/NathanHodgkiss447/AgentLab).

**Local live demo (Loom):**

[Watch the local live walkthrough](https://www.loom.com/share/4d6bf983d16e45319af3219211726660)

The walkthrough will show a genuine local ElevenLabs voice conversation, transcript, manual evaluation, and session export. The public Demo Mode uses scripted, pre-recorded audio; live access remains local-only.

The owner reports the Vercel deployment is live. This workspace cannot access the deployed site, so independent production workflow, mobile, and audio verification remain pending. See [deployment checks](docs/deployment.md).

## 2. Features

- Three typed scenarios: Customer Support, Product Discovery, Knowledge Boundaries.
- Scripted Demo playback with pre-generated ElevenLabs MP3 clips, a sound toggle, audio-synchronised transcript turns, stop/reset, timer, and 1×/2×/4× speed.
- Circular CSS visualiser, reduced-motion support, responsive desktop panels and mobile navigation.
- Manual scenario checklists, completion percentage, overall assessment, and notes.
- Session review, browser-local history, confirmed deletion, individual/transcript/bulk JSON export.
- Versioned, runtime-validated local storage and persistent application preferences.
- Server-only ElevenLabs signed URLs with unconditional production denial and same-origin loopback checks.
- Optional official React SDK adapter with microphone permissions, mute, completed transcript events, audio levels, timeout handling, and teardown.

**Demo conversations are scripted, with ElevenLabs audio generated once and bundled as static MP3s. Visitor playback makes no ElevenLabs requests or credit charges.** Missing, failed, or muted recordings fall back to timed text. Selecting a scenario changes testing guidance, not the live agent's instructions. See [recording setup](docs/demo-audio.md); actual audio availability is checked with `npm run demo:audio:check`.

## 3. Screenshots

The supplied [design reference](mockup/agent-lab-mockup.png) guides the implementation. It is a mockup, not a screenshot of the finished application.

Rendered screenshots are pending: this execution environment blocks the local server and Chrome processes. Run `npm run dev` and the [browser verification script](scripts/browser-qa.mjs) from a normal terminal to capture actual desktop and mobile screenshots into `docs/screenshots/`. Do not present the reference as a finished-app capture.

## 4. Technology stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, customised shadcn/ui primitives, Radix Dialog/Switch/Slot, Lucide, Motion, Zod, Vitest, React Testing Library, and Prettier. Geist is bundled locally so a build does not require Google Fonts access. A dependency lockfile is included.

The optional ElevenLabs adapter targets `@elevenlabs/react` 1.17.0. See [integration notes](docs/elevenlabs.md) for the API contract and validation status.

## 5. Architecture

```text
src/app/                  Next.js routes and server endpoint
src/components/           Shell, conversation, review, history, settings, UI
src/hooks/                Independent scripted Demo controller
src/data/                 Typed scenario definitions and demo scripts
src/lib/                  Scoring, transcript processing, storage, security
src/types/                Domain and controller contracts
integrations/elevenlabs/   Optional live React SDK adapter
```

Both controllers expose a `ConversationView` to the same dashboard. Scenario data and scoring are independent of UI. A small provider owns session history and preferences; connection state stays local to the conversation controller. Read the [architecture notes](docs/architecture.md).

Routes: `/`, `/dashboard`, `/scenarios`, `/sessions`, `/sessions/[id]`, `/settings`, plus `/docs` and `POST /api/voice/signed-url`.

## 6. Local setup

Use Node.js 22 or newer (Node 24 was used here).

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. No environment file is required for Demo Mode. The server binds to loopback intentionally.

```sh
npm run check
npm run build
npm start
```

## 7. ElevenLabs configuration

The official `@elevenlabs/react` SDK is installed, its actual exports and signatures were inspected, and `npm run typecheck:live` passes. **The project owner has successfully tested a genuine local live voice conversation.** Automated tests validate the adapter's lifecycle and SDK boundary; they do not substitute for real microphone/audio testing. Broader browser and live edge-case checks remain documented in the [verification record](docs/verification.md). The application also supports a Demo-only build when the SDK is absent.

Local Live Mode is implemented and covered by lifecycle tests. With the environment below configured, open `/dashboard?mode=live&scenario=customer-support` or use Settings → Open live workspace. Explicit Live links override the Demo preference locally. See [integration and recording instructions](docs/elevenlabs.md) for agent setup, browser verification, and a short customer-support script.

```sh
npm run setup:live
```

This installs the official SDK and runs its dedicated TypeScript check. Restart Next.js after installation. The build configuration automatically selects the actual adapter when the package is present, otherwise it selects a clearly labelled unavailable view. Production still rejects live connections regardless of SDK installation.

Create `.env.local` from `.env.example`:

```dotenv
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=your_private_key
ENABLE_LIVE_VOICE=true
```

Run `npm run dev`, open dashboard Options, choose Live Mode, allow microphone access, and use headphones. Agent settings are configured in ElevenLabs. For private agents the server requests a signed WebSocket URL; only that short-lived URL reaches the SDK. Do not share keys in the UI or commit environment files. Live conversations consume account credits.

## 8. Demo Mode

Choose Open Demo from the landing page, or select a scenario and press Start demo. Sound is enabled by default when all recordings for that scenario are available: static ElevenLabs clips play both sides of the dialogue, and each transcript turn completes with the audio's ended event. The speaker button mutes audio while scripted text continues; enabling it again applies to subsequent turns. Options controls playback speed. Stop cancels audio and preserves completed exchanges; Reset clears the current workspace. Finished sessions auto-save by default, without marking them as passed. Disable auto-save in Settings to save explicitly through Evaluation.

Audio starts only after pressing Start, never automatically on page load. A single media element is reused across turns, with playback rate and pitch preservation. Clips are served from the application's origin, with content-hashed filenames and a year-long immutable cache policy. A notice explains missing or blocked recordings; there is no browser speech-synthesis fallback. The animated waveform remains decorative, not a measured sound level.

To generate the clips once from a normal terminal:

```sh
npm run demo:audio:plan
npm run demo:audio:generate
npm run demo:audio:check
```

The generator reads the existing server-side key from `.env.local`/`.env`, synthesises 18 turns (2,745 input characters), and writes MP3 files plus a script-matched manifest. Generation consumes account credits; completed clips are reused on later runs. Commit the static clips and manifest, then deploy without a production API key. See [docs/demo-audio.md](docs/demo-audio.md) for voice choices and current verification status.

Review a saved session to check observed criteria, choose Pass / Needs improvement / Fail / Not evaluated, and enter notes. The score is checklist completion, explicitly human-assessed. Assessment is independent of the score.

History belongs to the current browser and origin. It does not sync across devices or URLs. Export anything you need to retain before clearing browser data.

## 9. Testing

Vitest covers scoring, scenarios, validation, history persistence, transcript corrections/deduplication, valid phase transitions, Demo cancellation/cleanup, the complete Demo→review→save→delete journey, and the actual production route handler's fail-closed response. React Testing Library checks labelled controls and manual checklist interaction.

Run `npm run check` for formatting, both TypeScript configurations, ESLint, tests, and static audio validation; run `npm run build` separately. Use `npm run format` to format source. UI-contract snapshots were captured before component extraction and are checked unchanged; interaction tests cover tab keyboard navigation, transition controls, and Strict Mode preference persistence. Review intentional UI changes before updating snapshots.

The latest local verification passed formatting, both TypeScript configurations, ESLint, **99 tests across 14 files**, validation of all 18 demo audio clips, and the production build. A genuine local live conversation was separately confirmed by the project owner. See the [verification record](docs/verification.md) for automated evidence and remaining browser, live edge-case, and deployment checks. SDK test doubles exercise our integration contract, not a real connection to the platform.

## 10. Deployment

The owner deployed [AgentLab on Vercel](https://agent-lab-beryl.vercel.app/dashboard?mode=demo) from [AgentLab on GitHub](https://github.com/NathanHodgkiss447/AgentLab). Standard Next.js hosting needs no secrets for Demo Mode. Keep `ENABLE_LIVE_VOICE=false`; install command `npm ci` (not `npm run ci`), build command `npm run build`. No database, writable server filesystem, or voice credentials are needed.

Follow [docs/deployment.md](docs/deployment.md) to verify the deployed workflow and production signed-URL denial. These external checks cannot run in this restricted workspace; the deployment URL is owner-provided, not independently verified here.

## 11. Security

- Never expose API keys through `NEXT_PUBLIC_*`, client settings, responses, or storage.
- Environment files are ignored; `.env.example` contains placeholders only.
- Outside local development, including all Vercel environments, the endpoint returns 403 before any outbound request.
- Local signed-URL requests require a same-origin loopback Origin; use the loopback-bound dev server.
- The application has no authentication, custom passwords, public live endpoint, or recording storage.
- JSON exports can contain conversation text. Review before sharing; avoid sensitive input.
- Real voice sends audio to ElevenLabs; provider-side retention is governed by the configured account and agent.

See [security notes](docs/security.md) for boundaries and future production requirements.

## 12. Technical decisions

**Local storage over a database:** sufficient for a one-day MVP, avoids account friction, and keeps evaluation local. Runtime validation protects UI from malformed data. Unknown storage versions are preserved until an explicit save changes history.

**Separate controllers:** Demo is available even if microphone permissions, credentials, networking, or the SDK are unavailable. Simulation is always labelled and never claims API usage.

**Manual scoring:** observable criteria and overall judgement are kept separate. A perfect checklist does not automatically produce a pass.

**Callback-driven SDK state:** current React SDK controls return void. The adapter uses lifecycle callbacks rather than treating `startSession` as an awaitable connection. Signed WebSocket URLs support private agents without exposing the API key.

**Build workers:** Webpack with worker threads and the TypeScript API avoids restricted child processes and sockets in this environment. These settings still produce a standard deployable Next.js build.

**Dark mode only:** the mockup's intended aesthetic, without a non-functional theme selector. Reduced motion and native system preference are both supported.

## 13. Future improvements

- Expand real-agent lifecycle testing to cover permission denial, network interruption, reconnect, and microphone release on navigation.
- Capture browser screenshots and complete desktop/mobile visual QA.
- Authenticated live access with persistent per-user/global rate limits, usage caps, monitoring, and kill switch.
- Scenario runners, annotations, interruption handling, and richer transcript correction UI.
- Optional cross-device persistence with explicit privacy controls.
- More keyboard/accessibility testing and a 60–90 second walkthrough using genuine live voice.

MIT licensed. Built with ElevenLabs; this is an independent portfolio project, not an ElevenLabs product.
