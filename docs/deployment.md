# AgentLab deployment

The owner reports the application is deployed at [agent-lab-beryl.vercel.app](https://agent-lab-beryl.vercel.app/dashboard?mode=demo). The Git remote points to [NathanHodgkiss447/AgentLab](https://github.com/NathanHodgkiss447/AgentLab), currently on branch `master`.

This workspace cannot reach the deployment or run Chrome, so public repository visibility, Vercel-to-GitHub linkage, production navigation, audio, and mobile behaviour have not been independently verified. The local build and automated checks are recorded in [verification.md](verification.md).

## Publishing subsequent changes

Run from your normal terminal after reviewing the changes:

```sh
npm run check
npm run build
git check-ignore .env.local .env
git diff --stat
git add .
git diff --cached --stat
git commit -m "refactor: improve readability and regression coverage"
git push origin master
```

Review staged files for credentials before committing. The workspace agent cannot write the actual `.git` directory; it has not committed or pushed this refactor. If Vercel is connected to the repository, pushing its configured production branch should trigger deployment. Check the Vercel project settings and resulting deployment rather than assuming that connection exists.

## Vercel configuration

- Framework: Next.js; root: repository root; Node.js 24.
- Install command: `npm ci`, **not** `npm run ci` (there is no `ci` npm script).
- Build command: `npm run build`.
- No ElevenLabs credentials are needed for Demo Mode. Keep `ENABLE_LIVE_VOICE=false` and production secrets unset.
- Set `NEXT_PUBLIC_GITHUB_URL=https://github.com/NathanHodgkiss447/AgentLab` for the source link.
- All 18 generated MP3s and the matching manifest are already present. Keep them tracked; deploying never needs to regenerate paid audio.

## Local verification

```sh
npm ci
npm run check
npm run build
npm run dev
```

For local live testing, configure `.env.local` following [elevenlabs.md](elevenlabs.md), restart the server, and verify a genuine voice session. Public live access remains denied regardless of the enable flag.

## Browser verification

Start an isolated Chrome process from your normal terminal:

```sh
google-chrome --headless --disable-gpu --remote-debugging-port=9225 --user-data-dir=/tmp/agentlab-qa-browser about:blank
AGENTLAB_BASE_URL=https://agent-lab-beryl.vercel.app node scripts/browser-qa.mjs
```

The script uses the real Chrome debugging protocol. It checks navigation, overflow, a Demo→evaluation→history loop, production denial, console errors, and captures screenshots. Use only an isolated debugging profile, never your normal signed-in browser. Headless tests cannot establish audible quality; also listen in a regular browser.

## Deployed verification checklist

- Landing Open Demo and all main navigation routes work.
- All three scripts complete, stop/reset work, and transcript turns match playback.
- With Sound on, ElevenLabs recordings play both speakers. Mute cancels playback; blocked or unavailable audio falls back to labelled text playback.
- Review saves manual criteria, assessment, and notes; history survives reload.
- Individual, transcript, and bulk JSON downloads work; deletion requires confirmation.
- Preferences persist; system and application reduced-motion work.
- At 375px/390px there is no horizontal overflow and mobile navigation is usable.
- No application console errors; keyboard tabs, focus indicators, and confirmation dialog work.
- Demo never prompts for microphone access or calls ElevenLabs.
- Production signed-URL requests return 403 with no credentials or signed URL:

```sh
curl -i -X POST https://agent-lab-beryl.vercel.app/api/voice/signed-url
```

An HTTP health check or passing build alone does not verify the user workflow or visual fidelity.
