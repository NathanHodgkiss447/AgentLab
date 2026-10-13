"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transcript } from "@/components/conversation/transcript";
import { EvaluationChecklist } from "@/components/evaluation/checklist";
import type { ConversationView, Evaluation, Mode, Scenario } from "@/types";

export type ConversationTab = "transcript" | "evaluation";

interface ConversationDetailsProps {
  controller: ConversationView;
  scenario: Scenario;
  mode: Mode;
  active: boolean;
  tab: ConversationTab;
  setTab: (tab: ConversationTab) => void;
  evaluation: Evaluation;
  saved: boolean;
  demoTranscriptNote: string;
  onEvaluationChange: (evaluation: Evaluation) => void;
  onSave: () => void;
  onExport: () => void;
}

export function ConversationDetails({
  controller,
  scenario,
  mode,
  active,
  tab,
  setTab,
  evaluation,
  saved,
  demoTranscriptNote,
  onEvaluationChange,
  onSave,
  onExport,
}: ConversationDetailsProps) {
  return (
    <aside className="right-panel" id="evaluation-panel">
      <div className="panel-tabs" role="tablist" aria-label="Conversation details">
        <button
          role="tab"
          id="transcript-tab"
          aria-controls="transcript-panel"
          aria-selected={tab === "transcript"}
          tabIndex={tab === "transcript" ? 0 : -1}
          className={tab === "transcript" ? "active" : ""}
          onClick={() => setTab("transcript")}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              setTab("evaluation");
              document.getElementById("evaluation-tab")?.focus();
            }
          }}
        >
          <FileText size={15} />
          Transcript<span className="tab-count">{controller.messages.length}</span>
        </button>
        <button
          role="tab"
          id="evaluation-tab"
          aria-controls="evaluation-content"
          aria-selected={tab === "evaluation"}
          tabIndex={tab === "evaluation" ? 0 : -1}
          className={tab === "evaluation" ? "active" : ""}
          onClick={() => setTab("evaluation")}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              setTab("transcript");
              document.getElementById("transcript-tab")?.focus();
            }
          }}
        >
          Evaluation
        </button>
      </div>
      {tab === "transcript" ? (
        <div
          id="transcript-panel"
          role="tabpanel"
          aria-labelledby="transcript-tab"
          className="transcript-tab-panel"
        >
          <div className="transcript-panel-label">
            <span className="micro-label">
              {mode === "demo" ? "SIMULATED TRANSCRIPT" : "LIVE TRANSCRIPT"}
            </span>
            <span className="status-dot" />
          </div>
          <Transcript messages={controller.messages} demo={mode === "demo"} active={active} />
          <div className="transcript-bottom">
            <Info size={14} />
            <span>
              {mode === "demo" ? demoTranscriptNote : "Completed messages from your voice session."}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="evaluation-tab-panel"
          id="evaluation-content"
          role="tabpanel"
          aria-labelledby="evaluation-tab"
        >
          <EvaluationChecklist
            scenario={scenario}
            evaluation={evaluation}
            onChange={onEvaluationChange}
          />
          <p className="evaluation-tip">
            Listen for evidence, then check the criteria you observed. You decide the result.
          </p>
          <Button disabled={!controller.session} onClick={onSave}>
            {saved ? (
              <>
                <CheckCircle2 size={15} />
                Evaluation saved
              </>
            ) : (
              "Save checklist"
            )}
          </Button>
          <Button
            variant="outline"
            disabled={!controller.session}
            style={{ marginTop: 10 }}
            onClick={onExport}
          >
            Export JSON
          </Button>
          {saved && controller.session && (
            <Link className="text-link" href={`/sessions/${controller.session.id}`}>
              Add assessment & notes
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
