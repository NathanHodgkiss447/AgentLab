"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Clock3,
  Info,
  ShieldCheck,
  CircleDot,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationDetails, type ConversationTab } from "./conversation-details";
import { ConversationControls } from "./conversation-controls";
import { ConversationStatus } from "./conversation-status";
import { ScenarioIcon } from "@/components/scenarios/scenario-icon";
import { useStore } from "@/components/providers";
import { emptyEvaluation, sessionExport } from "@/lib/evaluation";
import { exportJson, formatDuration } from "@/lib/utils";
import { isActive } from "@/lib/conversation";
import type { ConversationView, Evaluation, Mode, Scenario } from "@/types";

interface ConversationWorkspaceProps {
  controller: ConversationView;
  scenario: Scenario;
  mode: Mode;
  speed: number;
  onSpeedChange: (speed: number) => void;
  configurationAvailable: boolean;
  onModeChange: (mode: Mode) => void;
}

export function ConversationWorkspace({
  controller,
  scenario,
  mode,
  speed,
  onSpeedChange,
  configurationAvailable,
  onModeChange,
}: ConversationWorkspaceProps) {
  const { preferences, saveSession, sessions } = useStore();
  const [tab, setTab] = useState<ConversationTab>("transcript");
  const [evaluation, setEvaluation] = useState(emptyEvaluation);
  const [saved, setSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const savedId = useRef<string | null>(null);
  const active = isActive(controller.phase);
  useEffect(() => {
    if (controller.session && preferences.autoSave && savedId.current !== controller.session.id) {
      if (saveSession(controller.session)) savedId.current = controller.session.id;
    }
  }, [controller.session, preferences.autoSave, saveSession]);
  const sessionStored =
    !!controller.session && sessions.some((s) => s.id === controller.session?.id);
  const demoHasAudio =
    controller.demoAudio?.enabled && controller.demoAudio.supported && !controller.demoAudio.notice;
  const demoTranscriptNote = demoHasAudio
    ? "Scripted dialogue · ElevenLabs recordings · no live API calls."
    : "Scripted dialogue · text playback · no live API calls.";
  function handleStartOrStop() {
    if (active) {
      void controller.stop();
      return;
    }
    setEvaluation(emptyEvaluation());
    setSaved(false);
    void controller.start();
  }

  function handleReset() {
    controller.reset();
    setEvaluation(emptyEvaluation());
    setSaved(false);
  }

  function handleExport() {
    if (!controller.session) return;
    exportJson(
      sessionExport({ ...controller.session, evaluation }, scenario),
      `agentlab-${controller.session.id}`,
    );
  }

  function handleSaveEvaluation() {
    if (!controller.session) return;
    if (saveSession({ ...controller.session, evaluation })) setSaved(true);
  }

  function handleEvaluationChange(value: Evaluation) {
    setEvaluation(value);
    setSaved(false);
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-topline">
        <div className="dashboard-status">
          <span className={`badge ${mode === "demo" ? "badge-demo" : "badge-live"}`}>
            <CircleDot size={13} />
            {mode === "demo" ? "Demo Mode" : "Live Mode"}
          </span>
          <span className="dashboard-helper">
            {mode === "demo"
              ? "Scripted demo. No live API calls."
              : "Connected to your configured ElevenLabs agent."}
          </span>
        </div>
        <span className="timer">
          <Clock3 size={15} />
          {formatDuration(controller.elapsed)}
        </span>
      </div>
      <div className="dashboard-grid">
        <section className="conversation-panel">
          <div className="conversation-heading">
            <div>
              <span className="eyebrow">AGENT TESTING WORKSPACE</span>
              <h1>{scenario.title}</h1>
              <p>{scenario.description}</p>
            </div>
            <Link
              href="/scenarios"
              className={`text-link ${active ? "disabled-link" : ""}`}
              aria-disabled={active}
              tabIndex={active ? -1 : undefined}
              onClick={(e) => {
                if (active) e.preventDefault();
              }}
            >
              <span>Change scenario</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="conversation-centre">
            <span className={`connection-pill ${active ? "connected" : ""}`}>
              <span className="status-dot" />
              {active ? (mode === "demo" ? "Demo playback" : "Voice session") : "Workspace ready"}
            </span>
            <ConversationStatus
              phase={controller.phase}
              level={controller.level}
              mode={mode}
              hasDemoAudio={!!demoHasAudio}
              messageCount={controller.messages.length}
            />
            <ConversationControls
              controller={controller}
              mode={mode}
              speed={speed}
              settingsOpen={settingsOpen}
              configurationAvailable={configurationAvailable}
              onSpeedChange={onSpeedChange}
              onModeChange={onModeChange}
              onStartOrStop={handleStartOrStop}
              onReset={handleReset}
              onToggleOptions={() => setSettingsOpen((open) => !open)}
            />
          </div>
          {mode === "demo" && controller.demoAudio?.notice && (
            <div className="demo-audio-notice" role="status">
              <Info size={15} />
              <p>{controller.demoAudio.notice}</p>
            </div>
          )}
          {controller.error && (
            <div className="error-notice" role="alert">
              <AlertCircle size={18} />
              <p>{controller.error}</p>
            </div>
          )}
          {controller.session && (
            <div className="completion-banner">
              <CheckCircle2 size={20} />
              <div>
                <strong>
                  {controller.session.completion === "finished"
                    ? "Session complete"
                    : "Session ended"}
                </strong>
                <span>
                  {sessionStored
                    ? "Saved locally. Add your evaluation next."
                    : "Review your transcript and evaluate the session."}
                </span>
              </div>
              <Button asChild size="sm">
                <Link
                  href={sessionStored ? `/sessions/${controller.session.id}` : "#evaluation-panel"}
                  onClick={() => {
                    if (!sessionStored) setTab("evaluation");
                  }}
                >
                  Review session
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          )}
          <div className="conversation-footer">
            <span>
              <ShieldCheck size={14} />
              {mode === "demo"
                ? "No microphone or credentials required"
                : "Credentials stay on the server"}
            </span>
            <span>
              <AudioLines size={14} />
              ElevenLabs
            </span>
          </div>
        </section>
        <ConversationDetails
          controller={controller}
          scenario={scenario}
          mode={mode}
          active={active}
          tab={tab}
          setTab={setTab}
          evaluation={evaluation}
          saved={saved}
          demoTranscriptNote={demoTranscriptNote}
          onEvaluationChange={handleEvaluationChange}
          onSave={handleSaveEvaluation}
          onExport={handleExport}
        />
      </div>
      <div className="dashboard-note">
        <ScenarioIcon id={scenario.id} size={15} />
        <span>Testing focus: {scenario.category.toLowerCase()}</span>
        <Link href="/docs">
          How AgentLab works
          <ArrowUpRightIcon />
        </Link>
      </div>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={13} style={{ transform: "rotate(-45deg)" }} />;
}
