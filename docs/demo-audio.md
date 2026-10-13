# Pre-generated ElevenLabs demo audio

Demo playback now uses static MP3 recordings rather than browser speech synthesis. Each scenario has six turns with separate user/agent voices. Audio is generated once with ElevenLabs, committed to the repository, and served by Next.js/Vercel. Visitor playback requires no API key and makes no ElevenLabs API call.

## Generate once

The existing `ELEVENLABS_API_KEY` in `.env.local` or `.env` is read only by a local Node script. The key needs voice-read and text-to-speech permissions. Live voice enablement and agent configuration are not needed for clip generation.

```sh
npm run demo:audio:plan
npm run demo:audio:generate
npm run demo:audio:check
```

There are 18 clips and 2,745 input characters. Generation consumes your account's credits. The script discovers two default English voices available to your account, preferring George/Brian/Adam for the agent and Sarah/Alice/Jessica for the sample user, and uses `eleven_multilingual_v2` with `mp3_44100_128` output. It does not automatically select a private cloned voice.

Optional overrides in `.env.local`:

```dotenv
ELEVENLABS_DEMO_AGENT_VOICE_ID=your_chosen_voice_id
ELEVENLABS_DEMO_USER_VOICE_ID=another_voice_id
ELEVENLABS_DEMO_MODEL_ID=eleven_multilingual_v2
```

When both voice IDs are provided, the script does not need the voice-list endpoint. Use voices/content your account permits you to redistribute. Keep the default model for the supplied voice settings.

Requests use the official [Create speech endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert). Voice discovery uses [List voices](https://elevenlabs.io/docs/api-reference/voices/search). The script never logs keys, response bodies, or authentication headers.

## Generated files

- `public/audio/demo/<scenario>-<turn>-<content-hash>.mp3`
- `src/data/demo-audio-manifest.json`

The manifest identifies the matching text/role, voice, model, and generation time. Content hashes change when dialogue or voice/model choices change. Valid existing files are reused; successful clips and manifest entries are saved after every turn. Failed generation stops without automatically retrying paid requests. Rerunning resumes missing clips. No existing clips are deleted.

Commit the MP3s and manifest. Production needs neither the key nor a generation endpoint. Files use an immutable cache policy. Changing the text requires regenerating matching audio; stale or partial scenarios safely fall back to text.

## Playback

Reload the dashboard after generation. Press Start demo with Sound on. The same media element plays each turn at the chosen rate; transcript completion follows its ended event. Stop/reset/navigation cancel playback and detach events. Mute switches to text; enabling sound applies to subsequent turns. Autoplay denial, missing files, decoding failure, or stalls show a notice and retain a usable text demo. Browser speech is never used as a fallback.

## Verification status

The generation command is implemented, and its offline plan and asset checker can run without credentials. The sandbox cannot reach ElevenLabs; the actual 18 MP3s still need generation from the user's terminal. `npm run demo:audio:check` must pass before claiming the recordings are bundled. Automated playback tests use media doubles; audible quality and actual media playback still need a browser listening check.
