# Architecture

The product loop is scenario selection → conversation → transcript → manual evaluation → history/export. Next.js routes model each major screen. The sidebar and mobile bottom navigation share route definitions. The root provider owns only persisted records and preferences.

## Domain boundaries

`Scenario` contains testing guidance and criteria. It does not override the remote agent prompt. `Session` stores mode, start/end times, duration, completed messages, completion reason, and manual evaluation. `ConversationView` is the interface used by the workspace; both controllers produce it.

`calculateScore` filters against the scenario's actual criteria, counts each criterion once, and rounds the percentage. `assessment` is independent of the percentage. Unchecked or simulated sessions start as `not-evaluated`.

## Demo scheduling

Scripts contain roles, text, and fallback playback durations. A one-time local generation script sends each turn to ElevenLabs text-to-speech, saving content-hashed MP3 files and a versioned manifest. The runtime validates each manifest entry and matches its text and role to the script; an incomplete scenario is never advertised as audio-ready. No runtime generation endpoint is added.

A running lock prevents duplicate starts. With sound enabled, a single HTMLAudioElement plays one local clip per turn and advances on ended. Playback starts from the Start gesture; that element is reused to retain browser playback permission. Rates follow the selected speed, with pitch preservation. Each run and turn rejects stale events and duplicate completions. Stop and unmount pause audio, unload its source, detach handlers, clear watchdogs/timeouts, and snapshot completed transcript turns. Muting cancels the current clip and continues scripted text; enabling sound applies to subsequent turns. Missing files, decoding failures, autoplay rejection, and stalled playback switch to timed text with a notice. Changing scenario remounts the controller so old audio/scripts cannot leak into a new scenario.

The visualisation is explicitly decorative in Demo Mode. Static audio files are served from the application origin; no microphone, ElevenLabs SDK connection, live voice request, or browser speech synthesis is involved. Session history does not store/export audio, and genuine session recordings are not captured.

Generation API references: [ElevenLabs Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) and [List voices](https://elevenlabs.io/docs/api-reference/voices/search). The API key is read only by the local Node script, never by browser playback. Generation is serial, uses a bounded timeout, avoids automatic paid retries, preserves completed clips, validates MP3 headers, and atomically updates files/metadata.

## Live SDK boundary

The optional adapter imports the official `ConversationProvider`, granular controls/input hooks, and `HookOptions`. Connection callbacks own transitions because the current React controls return void. Messages use role and stable event/response IDs. Repeated events replace text rather than appending duplicates. Tentative/streaming events are not subscribed to; only completed `onMessage` payloads enter persisted history.

Each connection attempt captures its own run object. Callbacks must match the current run and reject ended/cancelled sessions. A permission-check MediaStream is stopped immediately; the SDK owns the actual conversation audio. Fetch is abortable; connect deadlines, stop deadlines, timer sampling, and SDK teardown have cleanup paths. Installed SDK exports/types have been verified; real-session verification remains pending.

Next's build alias selects the adapter when the official package is installed; otherwise an unavailable component keeps the public Demo build independent. `tsconfig.live.json` checks the optional module against the actual dependency. `npm run setup:live` installs and runs that check.

## Storage

Zod validates a version-1 envelope and each record. Invalid records are omitted with a warning. Unknown schema versions and malformed JSON are not immediately overwritten. Unknown properties, including accidental credential fields, are stripped. History is limited to 500 records and individual transcripts to 2,000 messages. Writes report quota/storage failures and retain the in-memory session for export.

Saves read storage before writing, retain other sessions, and upsert by ID. Storage events sync changes across tabs. Concurrent writes are not transactional; cloud sync is out of scope. JSON exports include schema version, mode/simulation label, and human-assessed score.

## Accessibility and responsive structure

Semantic headings, labelled native fields, Radix focus-managed dialogs, keyboard-operated switches, visible focus outlines, skip navigation, accessible tab selection, polite state announcements, and system/application reduced-motion support. Transcript auto-scroll stops when the reader scrolls away from the bottom. Mobile uses a bottom navigation, stacked panels, and history cards. Browser-level accessibility/layout verification remains pending.
