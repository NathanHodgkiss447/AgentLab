# ElevenLabs integration

Official sources consulted on 2026-10-13:

- [React SDK documentation](https://elevenlabs.io/docs/eleven-agents/libraries/react)
- [Official package exports](https://github.com/elevenlabs/packages/blob/main/packages/react/src/index.ts)
- [React controls source](https://github.com/elevenlabs/packages/blob/main/packages/react/src/conversation/ConversationControls.tsx)
- [Provider lifecycle implementation](https://github.com/elevenlabs/packages/blob/main/packages/react/src/conversation/ConversationProvider.tsx)
- [Message and callback types](https://github.com/elevenlabs/packages/blob/main/packages/client/src/types.ts)

Target release: `@elevenlabs/react@1.17.0`. The source contract includes `ConversationProvider`, `useConversationControls`, `useConversationInput`, and `HookOptions`. The controls return void for start/end; connection results arrive through callbacks. `signedUrl` with `connectionType: "websocket"` is used for private agents. The server endpoint requests `/v1/convai/conversation/get-signed-url?agent_id=...` with a server-only `xi-api-key` header.

The adapter consumes `onConnect({conversationId})`, `onDisconnect(details)`, `onError`, `onModeChange({mode})`, and completed `onMessage` payloads with `role`, `message`, `event_id`, and optional `response_id`. It does not persist interim streaming parts. Corrections with a stable ID replace the existing message. Repeated words on different turns remain separate.

The local server requests single-use signed URLs with `include_conversation_id=true`. It rejects non-local, cross-origin, production, and Vercel requests before contacting ElevenLabs. The `useLiveConversation` hook owns permission handling, a 25-second authorisation/connection deadline, start/stop guards, transcript capture, audio level sampling, and cleanup. SDK callbacks are bound to their originating run so late events cannot change a newer session. This adapter is tested with SDK controls/callback doubles, not a simulated claim of genuine live connectivity.

`getInputVolume()` and `getOutputVolume()` feed the live visualiser. `useConversationInput()` provides `isMuted` and `setMuted`. The user installed SDK 1.17.0; actual installed exports and signatures were inspected, and `npm run typecheck:live` passes. **Real voice connectivity remains unverified.**

Run:

```sh
npm run setup:live
npm run typecheck:live
npm run lint
```

Then create `.env.local`, enable local live voice, restart `npm run dev`, and test start, permission denial, mute, stop while connecting, network interruption, route change, reconnect, and review/export. Confirm the browser releases its microphone indicator when the session ends. A local agent account is required, and actual conversations consume credits.

## Start a local live conversation

```dotenv
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=your_private_key
ENABLE_LIVE_VOICE=true
```

The ID must identify an ElevenLabs **agent**, not a text-to-speech voice. The key must be permitted to access that agent. Configure the agent for voice conversations and signed-URL authentication in ElevenLabs. Use an English voice and enable the user transcript and agent response client events if you have customised them. The installed client dispatches `onMessage` for `user_transcript` and `agent_response`; tentative agent output goes to debug callbacks rather than saved history.

Run `npm run dev`, then open `http://127.0.0.1:3000/dashboard?mode=live&scenario=customer-support` (use the port printed by Next.js). Alternatively, Settings → Open live workspace. Explicit `mode=live` overrides the Demo preference locally; unavailable live configurations still fall back to Demo. Dashboard Options also lets you change modes before starting.

Click Start conversation, allow microphone access, and use headphones. You should hear the agent through the SDK, see completed transcript turns, and see listening/speaking states. Mute controls the microphone, not the agent's output. End session, review the transcript, evaluate it manually, and export JSON. Completed live sessions use the same local history as Demo sessions. Signed URLs, API keys, and audio are not stored or exported.

## Troubleshooting signed-URL requests

A 502 means the local server could not obtain a usable signed URL; it does not mean your browser microphone failed. The response now includes a safe diagnostic code, also logged as `[AgentLab voice] CODE` in the development terminal. Raw exception messages, provider response bodies, credentials, and signed URLs are never logged.

- `VOICE_DNS_ERROR`: the Node server cannot resolve the provider hostname. Check DNS/network/VPN.
- `VOICE_TLS_ERROR`: certificate verification failed. Check trusted system/proxy certificates; never set `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- `VOICE_TIMEOUT`: the provider request exceeded the timeout. Check connectivity or retry later.
- `VOICE_NETWORK_ERROR`: another connection failure; check firewall/proxy/VPN settings.
- `VOICE_INVALID_RESPONSE`: malformed JSON or no valid WebSocket URL, potentially a service issue or intercepting proxy.

Credential/agent rejections retain a separate authorisation message. Test public host connectivity from the same terminal running Next.js with `curl -I --max-time 10 https://api.elevenlabs.io`. Any HTTP response demonstrates connectivity, even a 404; this command sends no key and cannot verify agent permissions. Localhost port 3001 is supported as long as the request Origin matches the server address.

## Customer-support recording setup

Configure this prompt in the ElevenLabs agent dashboard if your existing agent is not already a support agent. Selecting Customer Support in AgentLab does **not** change the remote agent prompt.

Suggested agent instructions:

> You are a concise, empathetic customer-support assistant for a fictional software subscription. Help a customer who sees a duplicate charge. Acknowledge frustration, ask relevant questions one at a time, explain pending versus completed charges, and offer clear next steps. You cannot access accounts, verify charges, issue refunds, or send email; never claim you have done so. Use hypothetical guidance, do not promise a refund or timeline, and never request payment details, passwords, or other sensitive data. Keep each reply to one or two sentences.

Suggested first message: “Hi, thanks for contacting support. What can I help you with today?”

Read only the customer turns below, waiting for the agent between turns. Adapt an answer if it asks a different question; do not pretend its replies are scripted.

1. “Hi, I think I've been charged twice for my subscription this month, and I'm pretty frustrated.”
2. “The charges are both twenty-nine euros. One says completed and the other says pending.”
3. “So what should I do next, and what if the pending charge becomes a completed charge?”
4. “Thanks. Could you briefly summarise the next steps for me?”

For a 60–90 second walkthrough: introduce AgentLab in one sentence, record the real conversation, end it, show the transcript, check only criteria you actually observed, save, and export. Label the recording “Local live ElevenLabs conversation.” Capture microphone **and** system/browser audio, use fictional billing details, and keep environment files, signed URLs, and developer network panels off-screen. A JSON export contains text/evaluation, not recorded audio.

Public deployment never needs the SDK or credentials to run Demo Mode. Even when installed, live mode is rejected on production/Vercel servers. Signed URLs remain only in the transient SDK connection; they are never included in records or exports.
