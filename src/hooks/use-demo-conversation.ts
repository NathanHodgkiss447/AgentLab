"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoScripts } from "@/data/demo";
import { emptyEvaluation } from "@/lib/evaluation";
import { transitionPhase } from "@/lib/conversation";
import { createDemoAudioPlayer, supportsDemoAudio, type DemoAudioPlayer } from "@/lib/demo/audio";
import { getDemoAudioClip, hasDemoAudio } from "@/lib/demo/clips";
import type { ConversationView, Message, Phase, ScenarioId, Session } from "@/types";

interface DemoRun {
  id: string; startedAt: number; messages: Message[]; ended: boolean; audioUnavailable: boolean;
}

export function useDemoConversation(scenarioId: ScenarioId, speed: number): ConversationView {
  const [phase, setPhase] = useState<Phase>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioSupported, setAudioSupported] = useState<boolean | null>(null);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const soundEnabled = useRef(true);
  const run = useRef<DemoRun | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const player = useRef<DemoAudioPlayer | null>(null);
  const cancelAudio = useRef<(() => void) | null>(null);
  const completeAudio = useRef<(() => void) | null>(null);
  const changePhase = useCallback((next: Phase) => setPhase(current => transitionPhase(current, next)), []);
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    completeAudio.current = null;
    cancelAudio.current?.(); cancelAudio.current = null;
    player.current?.dispose(); player.current = null;
  }, []);
  const finish = useCallback((current: DemoRun, completion: Session["completion"]) => {
    if (run.current !== current || current.ended) return;
    current.ended = true; clear();
    const endedAt = Date.now();
    const duration = Math.floor((endedAt - current.startedAt) / 1000);
    setElapsed(duration);
    setSession({ id: current.id, scenarioId, mode: "demo", startedAt: current.startedAt,
      endedAt, duration, messages: [...current.messages], evaluation: emptyEvaluation(), completion });
    changePhase("disconnected");
  }, [scenarioId, clear, changePhase]);
  const start = useCallback(() => {
    if (run.current && !run.current.ended) return;
    clear();
    const recordingsAvailable = hasDemoAudio(scenarioId);
    const audioAvailable = supportsDemoAudio() && recordingsAvailable;
    const current: DemoRun = { id: crypto.randomUUID(), startedAt: Date.now(), messages: [], ended: false, audioUnavailable: !audioAvailable };
    run.current = current;
    setMessages([]); setSession(null); setElapsed(0); setAudioSupported(audioAvailable);
    setAudioNotice(audioAvailable ? null : recordingsAvailable ? "This browser cannot play demo audio. Continuing with text." : "ElevenLabs demo recordings are not ready for this scenario yet. Continuing with text.");
    if (audioAvailable) player.current = createDemoAudioPlayer();
    changePhase("connecting");
    const script = demoScripts[scenarioId];
    const active = () => run.current === current && !current.ended;
    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.current = timers.current.filter(value => value !== timer);
        if (active()) callback();
      }, delay);
      timers.current.push(timer);
    };
    const playTurn = (index: number) => {
      if (!active()) return;
      const line = script[index];
      if (!line) { finish(current, "finished"); return; }
      let completed = false;
      const showPhase = () => { if (active()) changePhase(line.role === "agent" ? "speaking" : "listening"); };
      const complete = () => {
        if (!active() || completed) return;
        completed = true; completeAudio.current = null; cancelAudio.current = null;
        const message: Message = { id: `${current.id}-${index}`, role: line.role, text: line.text, timestamp: Date.now() };
        current.messages = [...current.messages, message]; setMessages(current.messages);
        schedule(() => playTurn(index + 1), 600 / speed);
      };
      showPhase();
      const clip = getDemoAudioClip(scenarioId, index);
      if (soundEnabled.current && !current.audioUnavailable && clip && player.current) {
        completeAudio.current = complete;
        cancelAudio.current = player.current.play(clip, speed, {
          onStart: showPhase, onComplete: complete,
          onError: () => {
            if (!active() || completed) return;
            completeAudio.current = null; cancelAudio.current = null; current.audioUnavailable = true;
            setAudioNotice("The demo recording could not play. Check your connection and browser audio permissions. Continuing with text.");
            schedule(complete, line.durationMs / speed);
          },
        });
      } else schedule(complete, line.durationMs / speed);
    };
    // Start media directly from the button gesture. Silent playback keeps a brief connection transition.
    if (soundEnabled.current && audioAvailable) playTurn(0);
    else schedule(() => playTurn(0), 450);
  }, [scenarioId, speed, clear, changePhase, finish]);
  useEffect(() => {
    const refresh = () => setAudioSupported(supportsDemoAudio() && hasDemoAudio(scenarioId));
    refresh();
    const interval = setInterval(() => {
      const current = run.current;
      if (current && !current.ended) setElapsed(Math.floor((Date.now() - current.startedAt) / 1000));
    }, 250);
    return () => { if (run.current) run.current.ended = true; clear(); clearInterval(interval); };
  }, [clear, scenarioId]);
  return {
    phase, messages, elapsed, session, muted: false, level: null, error: null, start,
    stop: () => { if (run.current) finish(run.current, "stopped"); },
    reset: () => {
      if (run.current && !run.current.ended) return;
      clear(); run.current = null;
      setMessages([]); setSession(null); setElapsed(0); setAudioNotice(null); changePhase("idle");
    },
    demoAudio: {
      enabled: audioEnabled, supported: audioSupported, notice: audioNotice,
      toggle: () => {
        const enabled = !soundEnabled.current;
        soundEnabled.current = enabled; setAudioEnabled(enabled);
        if (!enabled) { const complete = completeAudio.current; cancelAudio.current?.(); cancelAudio.current = null; complete?.(); }
      },
    },
  };
}
