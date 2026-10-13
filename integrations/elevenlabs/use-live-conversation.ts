"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationControls, useConversationInput, type HookOptions } from "@elevenlabs/react";
import { appendMessage, isActive, transitionPhase } from "@/lib/conversation";
import { emptyEvaluation } from "@/lib/evaluation";
import type { ConversationView, Message, Phase, ScenarioId, Session } from "@/types";

const CONNECTION_TIMEOUT_MS = 25_000;
const STOP_TIMEOUT_MS = 10_000;
const AUDIO_SAMPLE_INTERVAL_MS = 100;

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
export function useLiveConversation(scenarioId: ScenarioId): ConversationView {
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
      const duration = current.connected ? Math.floor((endedAt - current.startedAt) / 1000) : 0;
      setElapsed(duration);
      if (current.connected)
        setSession({
          id: current.id,
          mode: "live",
          scenarioId: scenarioId,
          startedAt: current.startedAt,
          endedAt,
          duration,
          messages: current.messages,
          evaluation: emptyEvaluation(),
          completion,
          conversationId: current.conversationId,
        });
      setLevel(null);
      change("disconnected");
    },
    [scenarioId, change],
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
      }, STOP_TIMEOUT_MS);
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
      // Covers both server authorisation and SDK connection, not the permission prompt.
      deadline.current = setTimeout(() => {
        if (!currentRun() || current.connected) return;
        finish(current, "connection-lost");
        endSession();
        setError("Connection timed out. Check the agent configuration and try again.");
        change("error");
      }, CONNECTION_TIMEOUT_MS);
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
            // An old callback must never terminate a newer session.
            if (run.current === current) endSession();
            return;
          }
          if (deadline.current) clearTimeout(deadline.current);
          current.connected = true;
          current.startedAt = Date.now();
          current.conversationId = conversationId;
          // SDK input controls require an active conversation reference.
          setMuted(false);
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
          finish(current, "connection-lost");
          endSession();
          change("error");
        },
      };
      current.sdkStarted = true;
      startSession(callbacks);
    } catch (cause) {
      if (!currentRun()) return;
      finish(current, "connection-lost");
      if (current.sdkStarted) endSession();
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
    }, AUDIO_SAMPLE_INTERVAL_MS);
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
    toggleMute: () => {
      const current = run.current;
      if (!current?.connected || current.ended || current.requestedStop) return;
      setMuted(!isMuted);
    },
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
  return controller;
}
