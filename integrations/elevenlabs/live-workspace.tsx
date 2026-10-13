"use client";
// Optional adapter: checked against the installed SDK with `npm run typecheck:live`.
// See docs/elevenlabs.md for the documented, source-verified 1.17.0 API contract.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  type HookOptions,
} from "@elevenlabs/react";
import { ConversationWorkspace } from "@/components/dashboard/conversation-workspace";
import { getScenario } from "@/data/scenarios";
import { appendMessage, isActive, transitionPhase } from "@/lib/conversation";
import { emptyEvaluation } from "@/lib/evaluation";
import type { LiveWorkspaceProps } from "@/types/live";
import type { ConversationView, Message, Phase, Session } from "@/types";
interface Run {
  id: string;
  startedAt: number;
  messages: Message[];
  ended: boolean;
  connected: boolean;
  sdkStarted: boolean;
  conversationId?: string;
  abort: AbortController;
  requestedStop: boolean;
}
export function LiveWorkspace(props: LiveWorkspaceProps) {
  return (
    <ConversationProvider>
      <LiveController {...props} />
    </ConversationProvider>
  );
}
function LiveController(props: LiveWorkspaceProps) {
  const { startSession, endSession, getInputVolume, getOutputVolume } = useConversationControls();
  const { isMuted, setMuted } = useConversationInput();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const run = useRef<Run | null>(null);
  const mounted = useRef(false);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopping = useRef<ReturnType<typeof setTimeout> | null>(null);
  const change = useCallback((next: Phase) => {
    if (!mounted.current) return;
    phaseRef.current = transitionPhase(phaseRef.current, next);
    setPhase(phaseRef.current);
  }, []);
  const finish = useCallback(
    (current: Run, completion: Session["completion"]) => {
      if (current.ended || run.current !== current) return;
      current.ended = true;
      current.abort.abort();
      if (deadline.current) clearTimeout(deadline.current);
      if (stopping.current) clearTimeout(stopping.current);
      if (!mounted.current) return;
      const endedAt = Date.now();
      if (current.connected)
        setSession({
          id: current.id,
          mode: "live",
          scenarioId: props.scenarioId,
          startedAt: current.startedAt,
          endedAt,
          duration: Math.floor((endedAt - current.startedAt) / 1000),
          messages: current.messages,
          evaluation: emptyEvaluation(),
          completion,
          conversationId: current.conversationId,
        });
      setLevel(null);
      change("disconnected");
    },
    [props.scenarioId, change],
  );
  const stop = useCallback(() => {
    const current = run.current;
    if (!current || current.ended || current.requestedStop) return;
    current.requestedStop = true;
    current.abort.abort();
    change("disconnecting");
    endSession();
    // Pre-SDK permission/fetch operations can be cancelled immediately. Pending
    // SDK connects stay locked until the provider emits a disconnect callback.
    if (!current.sdkStarted) finish(current, "stopped");
    else
      stopping.current = setTimeout(() => {
        finish(current, "stopped");
      }, 10000);
  }, [change, endSession, finish]);
  const start = useCallback(async () => {
    if (isActive(phaseRef.current)) return;
    const current: Run = {
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      messages: [],
      ended: false,
      connected: false,
      sdkStarted: false,
      abort: new AbortController(),
      requestedStop: false,
    };
    run.current = current;
    setError(null);
    setSession(null);
    setMessages([]);
    setElapsed(0);
    setMuted(false);
    change("requesting-permission");
    const currentRun = () =>
      mounted.current && run.current === current && !current.ended && !current.requestedStop;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Microphone access requires a supported browser on localhost or HTTPS.");
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach((track) => track.stop());
      if (!currentRun()) return;
      change("connecting");
      const response = await fetch("/api/voice/signed-url", {
        method: "POST",
        signal: current.abort.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Could not authorise the voice session.",
        );
      if (
        !data ||
        typeof data !== "object" ||
        !("signedUrl" in data) ||
        typeof data.signedUrl !== "string"
      )
        throw new Error("The voice server returned an invalid response.");
      if (!currentRun()) return;
      // These methods return void in React SDK 1.17.0. Lifecycle callbacks,
      // rather than an invented startSession promise, drive connection state.
      const callbacks: HookOptions = {
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        onConnect: ({ conversationId }) => {
          if (!currentRun()) {
            endSession();
            return;
          }
          if (deadline.current) clearTimeout(deadline.current);
          current.connected = true;
          current.startedAt = Date.now();
          current.conversationId = conversationId;
          change("connected");
          change("listening");
        },
        onMessage: (payload) => {
          if (!currentRun()) return;
          const incoming: Message = {
            id: `${current.id}-${payload.role}-${payload.response_id ?? payload.event_id}`,
            eventId: payload.event_id,
            role: payload.role,
            text: payload.message,
            timestamp: Date.now(),
          };
          current.messages = appendMessage(current.messages, incoming);
          setMessages(current.messages);
        },
        onModeChange: ({ mode }) => {
          if (currentRun()) change(mode);
        },
        onDisconnect: (details) => {
          if (run.current !== current || current.ended || !mounted.current) return;
          if (details.reason === "error" && !current.requestedStop)
            setError(
              "The voice connection ended unexpectedly. Your completed messages are available for review.",
            );
          finish(
            current,
            current.requestedStop
              ? "stopped"
              : details.reason === "agent"
                ? "finished"
                : "connection-lost",
          );
        },
        onError: () => {
          if (!currentRun()) return;
          setError(
            "Could not maintain the voice session. Check microphone access, agent configuration, and your connection. Any completed messages have been preserved.",
          );
          endSession();
          finish(current, "connection-lost");
          change("error");
        },
      };
      deadline.current = setTimeout(() => {
        if (!currentRun() || current.connected) return;
        endSession();
        finish(current, "connection-lost");
        setError("Connection timed out. Check the agent configuration and try again.");
        change("error");
      }, 25000);
      current.sdkStarted = true;
      startSession(callbacks);
    } catch (cause) {
      if (!currentRun()) return;
      current.ended = true;
      current.abort.abort();
      const message =
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Microphone access was denied. Allow access in your browser's site settings, then try again."
          : cause instanceof DOMException && cause.name === "NotFoundError"
            ? "No microphone was found. Connect an input device and try again."
            : cause instanceof Error
              ? cause.message
              : "Could not start a voice session.";
      setError(message);
      change("error");
    }
  }, [change, endSession, finish, setMuted, startSession]);
  useEffect(() => {
    mounted.current = true;
    const interval = setInterval(() => {
      const current = run.current;
      if (!current || current.ended || !current.connected) return;
      setElapsed(Math.floor((Date.now() - current.startedAt) / 1000));
      if (phaseRef.current === "speaking" || phaseRef.current === "listening") {
        try {
          setLevel(phaseRef.current === "speaking" ? getOutputVolume() : getInputVolume());
        } catch {
          setLevel(null);
        }
      }
    }, 100);
    return () => {
      mounted.current = false;
      const current = run.current;
      if (current) {
        current.ended = true;
        current.abort.abort();
      }
      if (deadline.current) clearTimeout(deadline.current);
      if (stopping.current) clearTimeout(stopping.current);
      clearInterval(interval);
      endSession();
    };
  }, [endSession, getInputVolume, getOutputVolume]);
  const controller: ConversationView = {
    phase,
    messages,
    elapsed,
    error,
    session,
    muted: isMuted,
    level,
    start,
    stop,
    toggleMute: () => setMuted(!isMuted),
    reset: () => {
      if (isActive(phaseRef.current)) return;
      run.current = null;
      setMessages([]);
      setSession(null);
      setElapsed(0);
      setError(null);
      change("idle");
    },
  };
  return (
    <ConversationWorkspace
      {...props}
      scenario={getScenario(props.scenarioId)}
      controller={controller}
    />
  );
}
