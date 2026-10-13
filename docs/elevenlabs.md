# ElevenLabs integration

Official sources consulted on 2026-10-13:

- [React SDK documentation](https://elevenlabs.io/docs/eleven-agents/libraries/react)
- [Official package exports](https://github.com/elevenlabs/packages/blob/main/packages/react/src/index.ts)
- [React controls source](https://github.com/elevenlabs/packages/blob/main/packages/react/src/conversation/ConversationControls.tsx)
- [Provider lifecycle implementation](https://github.com/elevenlabs/packages/blob/main/packages/react/src/conversation/ConversationProvider.tsx)
- [Message and callback types](https://github.com/elevenlabs/packages/blob/main/packages/client/src/types.ts)

Target release: `@elevenlabs/react@1.17.0`. The source contract includes `ConversationProvider`, `useConversationControls`, `useConversationInput`, and `HookOptions`. The controls return void for start/end; connection results arrive through callbacks. `signedUrl` with `connectionType: "websocket"` is used for private agents. The server endpoint requests `/v1/convai/conversation/get-signed-url?agent_id=...` with a server-only `xi-api-key` header.

The adapter consumes `onConnect({conversationId})`, `onDisconnect(details)`, `onError`, `onModeChange({mode})`, and completed `onMessage` payloads with `role`, `message`, `event_id`, and optional `response_id`. It does not persist interim streaming parts. Corrections with a stable ID replace the existing message. Repeated words on different turns remain separate.

`getInputVolume()` and `getOutputVolume()` feed the live visualiser. `useConversationInput()` provides `isMuted` and `setMuted`. The user installed SDK 1.17.0; actual installed exports and signatures were inspected, and `npm run typecheck:live` passes. **Real voice connectivity remains unverified.**

Run:

```sh
npm run setup:live
npm run typecheck:live
npm run lint
```

Then create `.env.local`, enable local live voice, restart `npm run dev`, and test start, permission denial, mute, stop while connecting, network interruption, route change, reconnect, and review/export. Confirm the browser releases its microphone indicator when the session ends. A local agent account is required, and actual conversations consume credits.

Public deployment never needs the SDK or credentials to run Demo Mode. Even when installed, live mode is rejected on production/Vercel servers. Signed URLs remain only in the transient SDK connection; they are never included in records or exports.
