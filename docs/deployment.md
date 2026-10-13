# Publish AgentLab

No GitHub/Vercel CLI or connected account was available, and this sandbox denies network and local server operations. The workspace's `.git` directory is read-only. Publication and deployed verification require running the following from your normal terminal/account.

A local `agentlab-source.bundle` contains the committed application source without environment files or build/dependency output. If you prefer to retain that commit, clone the bundle into a new writable folder and publish from there:

```sh
git clone /home/nathan/Documents/Github/agent-lab/agentlab-source.bundle /tmp/agentlab-publish
cd /tmp/agentlab-publish
```

The remaining instructions apply to either that clone or the original workspace. Do not run `git init`/`git commit` again when using the existing bundle commit.

## GitHub

First complete the local verification below. Check that environment files are excluded:

```sh
git init
git check-ignore .env.local .env
git add .
git diff --cached --stat
git status --short
git commit -m "Build AgentLab voice agent testing studio"
git branch -M main
```

Use the GitHub website to create a **public** repository named `agentlab` with description:

> Developer-focused AI voice agent testing studio built with Next.js, TypeScript and ElevenLabs.

Do not initialise it with another README. Copy the actual remote URL GitHub displays, then run:

```sh
git remote add origin YOUR_ACTUAL_REPOSITORY_URL
git push -u origin main
```

If GitHub CLI is installed/authenticated, you can instead run:

```sh
gh repo create agentlab --public --source=. --remote=origin --push --description "Developer-focused AI voice agent testing studio built with Next.js, TypeScript and ElevenLabs."
```

Set `NEXT_PUBLIC_GITHUB_URL` to the actual repository URL locally and in Vercel. The UI shows project documentation until a repository URL is configured, avoiding fabricated or dead GitHub links.

## Vercel

1. Sign into Vercel and select Add New → Project.
2. Connect GitHub and import the actual `agentlab` repository.
3. Framework: Next.js. Root: repository root. Install: `npm ci`. Build: `npm run build`.
4. Use Node.js 24. Leave ElevenLabs secrets unset and keep `ENABLE_LIVE_VOICE=false`.
5. Add `NEXT_PUBLIC_GITHUB_URL` using your real published repository URL.
6. Deploy and copy the actual generated production URL.
7. Verify the site in a browser using the checklist below.
8. Update README Introduction/Deployment with the verified GitHub and Vercel URLs, then commit and push.

## Local verification

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

To test the optional SDK, additionally run `npm run setup:live`, configure `.env.local`, restart the server, and verify a genuine voice session. Do not publish SDK verification claims until this succeeds.

For repeatable real-browser Demo checks/screenshots, start an isolated Chrome process from another terminal:

```sh
google-chrome --headless --disable-gpu --remote-debugging-port=9225 --user-data-dir=/tmp/agentlab-qa-browser about:blank
node scripts/browser-qa.mjs
```

The script uses the Chrome debugging protocol directly, not a mocked browser. It checks route navigation, overflow, a real Demo→evaluation→history loop, production denial, console errors, and captures screenshots. Run it against production by setting `AGENTLAB_BASE_URL` to the actual deployed origin. Only use the isolated debugging profile; do not attach it to your normal signed-in browser.

## Deployed verification checklist

- Landing Open Demo and all navigation routes work.
- All three scripts complete, can stop/reset, and display accurate completed messages.
- Run `npm run demo:audio:generate` locally once, verify `npm run demo:audio:check`, and commit `public/audio/demo/*.mp3` and `src/data/demo-audio-manifest.json` before deployment.
- With sound enabled, pre-recorded ElevenLabs clips play both speakers and the transcript advances with audio completion. Mute cancels playback; unavailable/blocked clips show a text-playback notice.
- Session review saves manual criteria, assessment, and notes.
- History displays saved data, exports JSON, and confirms deletion.
- Settings preferences persist after reload; system and application reduced-motion work.
- At 375px/390px, no horizontal overflow and bottom navigation remains usable.
- Browser console has no application errors; keyboard focus and confirmation dialog work.
- No microphone prompt or ElevenLabs network request in Demo Mode.
- Production `POST /api/voice/signed-url` returns 403 even with the live enable flag.

```sh
curl -i -X POST ACTUAL_DEPLOYED_ORIGIN/api/voice/signed-url
```

Confirm a 403 response with no credentials or signed URL. HTTP health/build success alone is not visual or workflow verification.
