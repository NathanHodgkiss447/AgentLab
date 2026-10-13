"use client";

import Link from "next/link";
import {
  ArrowRight,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Settings2,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isActive } from "@/lib/conversation";
import type { ConversationView, Mode } from "@/types";

interface ConversationControlsProps {
  controller: ConversationView;
  mode: Mode;
  speed: number;
  settingsOpen: boolean;
  configurationAvailable: boolean;
  onSpeedChange: (speed: number) => void;
  onModeChange: (mode: Mode) => void;
  onStartOrStop: () => void;
  onReset: () => void;
  onToggleOptions: () => void;
}

export function ConversationControls({
  controller,
  mode,
  speed,
  settingsOpen,
  configurationAvailable,
  onSpeedChange,
  onModeChange,
  onStartOrStop,
  onReset,
  onToggleOptions,
}: ConversationControlsProps) {
  const active = isActive(controller.phase);
  const transitioning = ["requesting-permission", "connecting", "disconnecting"].includes(
    controller.phase,
  );
  const startLabel = mode === "demo" ? "Start demo" : "Start conversation";
  const stopLabel = mode === "demo" ? "Stop demo" : "End conversation";
  const soundLabel = controller.demoAudio?.enabled ? "Sound on" : "Muted";

  return (
    <>
      <div className="voice-controls">
        {mode === "live" && (
          <div>
            <Button
              variant="outline"
              size="icon"
              className="round-control"
              aria-label={controller.muted ? "Unmute microphone" : "Mute microphone"}
              disabled={!active || transitioning}
              onClick={controller.toggleMute}
            >
              {controller.muted ? <MicOff size={19} /> : <Mic size={19} />}
            </Button>
            <span>{controller.muted ? "Unmute" : "Mute"}</span>
          </div>
        )}
        {mode === "demo" && controller.demoAudio && (
          <div>
            <Button
              variant="outline"
              size="icon"
              className="round-control"
              aria-label={controller.demoAudio.enabled ? "Mute demo audio" : "Enable demo audio"}
              aria-pressed={!controller.demoAudio.enabled}
              disabled={controller.demoAudio.supported !== true}
              onClick={controller.demoAudio.toggle}
            >
              {controller.demoAudio.enabled && controller.demoAudio.supported ? (
                <Volume2 size={19} />
              ) : (
                <VolumeX size={19} />
              )}
            </Button>
            <span>{controller.demoAudio.supported === false ? "Text only" : soundLabel}</span>
          </div>
        )}
        <div>
          <Button
            size="icon"
            className={`main-voice-control ${active ? "stop-control" : ""}`}
            aria-label={active ? stopLabel : startLabel}
            disabled={controller.phase === "disconnecting"}
            onClick={onStartOrStop}
          >
            {active ? (
              <Square size={23} fill="currentColor" />
            ) : (
              <Play size={25} fill="currentColor" />
            )}
          </Button>
          <span>{active ? "End session" : startLabel}</span>
        </div>
        <div>
          <Button
            variant="outline"
            size="icon"
            className="round-control"
            aria-label="Reset conversation"
            disabled={active || (!controller.messages.length && controller.phase === "idle")}
            onClick={onReset}
          >
            <RotateCcw size={18} />
          </Button>
          <span>Reset</span>
        </div>
        <div>
          <Button
            variant="outline"
            size="icon"
            className="round-control"
            aria-label="Session options"
            aria-expanded={settingsOpen}
            onClick={onToggleOptions}
          >
            <Settings2 size={19} />
          </Button>
          <span>Options</span>
        </div>
      </div>
      {settingsOpen && (
        <div className="session-options">
          <label htmlFor="session-mode">Session mode</label>
          <select
            id="session-mode"
            value={mode}
            disabled={active}
            onChange={(e) => onModeChange(e.target.value as Mode)}
          >
            <option value="demo">Demo · simulated</option>
            <option value="live" disabled={!configurationAvailable}>
              Live · {configurationAvailable ? "ElevenLabs" : "configure locally first"}
            </option>
          </select>
          {mode === "demo" && (
            <>
              <label htmlFor="playback-speed">Playback speed</label>
              <select
                id="playback-speed"
                value={speed}
                disabled={active}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
              >
                <option value={1}>1× · natural pace</option>
                <option value={2}>2× · quick walkthrough</option>
                <option value={4}>4× · rapid review</option>
              </select>
            </>
          )}
          <Link href="/settings" className="text-link">
            Configuration & preferences
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </>
  );
}
