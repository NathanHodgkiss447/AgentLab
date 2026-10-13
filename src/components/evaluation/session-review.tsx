"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Info, Save } from "lucide-react";
import { useStore } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Transcript } from "@/components/conversation/transcript";
import { EvaluationChecklist } from "./checklist";
import { getScenario } from "@/data/scenarios";
import { SessionOverview } from "./session-overview";
import { AssessmentForm } from "./assessment-form";
import { exportJson } from "@/lib/utils";
import { sanitiseEvaluation, sessionExport } from "@/lib/evaluation";
import type { Session } from "@/types";
export function SessionReview({ id }: { id: string }) {
  const { sessions, ready } = useStore();
  if (!ready)
    return (
      <div className="page-loading" role="status">
        Loading your session…
      </div>
    );
  const session = sessions.find((s) => s.id === id);
  if (!session)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Info size={24} />
        </span>
        <h1>Session not found in this browser</h1>
        <p>
          Sessions are stored locally. This session may have been removed or saved on another
          device.
        </p>
        <Button asChild>
          <Link href="/sessions">Back to history</Link>
        </Button>
      </div>
    );
  return <ReviewEditor key={session.id} session={session} />;
}
function ReviewEditor({ session }: { session: Session }) {
  const { saveSession } = useStore();
  const scenario = getScenario(session.scenarioId);
  const [evaluation, setEvaluation] = useState(session.evaluation);
  const [feedback, setFeedback] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const record = () => ({ ...session, evaluation: sanitiseEvaluation(scenario, evaluation) });
  const save = () => {
    const ok = saveSession(record());
    setSaveFailed(!ok);
    setFeedback(
      ok ? "Session saved in this browser." : "Save failed. Export your session to keep a copy.",
    );
  };
  const update: typeof setEvaluation = (value) => {
    setEvaluation(value);
    setFeedback("");
  };
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FROM CONVERSATION TO INSIGHT</span>
          <h1>Session Evaluation</h1>
          <p>Review the conversation and make your own assessment.</p>
        </div>
        <Button onClick={save}>
          <Save size={15} />
          Save session
        </Button>
      </div>
      <div className="review-grid">
        <div className="review-column">
          <SessionOverview session={session} scenario={scenario} />
          <section className="card review-transcript">
            <div className="card-title-row">
              <h2>Transcript</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportJson(
                    {
                      mode: session.mode,
                      simulated: session.mode === "demo",
                      messages: session.messages,
                    },
                    `agentlab-transcript-${session.id}`,
                  )
                }
              >
                <Download size={13} />
                Export
              </Button>
            </div>
            <Transcript messages={session.messages} demo={session.mode === "demo"} />
          </section>
        </div>
        <div className="review-column">
          <section className="card">
            <EvaluationChecklist scenario={scenario} evaluation={evaluation} onChange={update} />
          </section>
          <AssessmentForm evaluation={evaluation} onChange={update} />
          <div className="review-notice">
            <Info size={15} />
            <span>
              {session.mode === "demo"
                ? "This is simulated demo data. "
                : "This is a real voice transcript. "}
              Checklist completion is human-assessed; it does not automatically determine a pass.
            </span>
          </div>
          <div className="review-actions">
            <Button onClick={save}>
              <Save size={14} />
              Save session
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportJson(sessionExport(record(), scenario), `agentlab-${session.id}`)
              }
            >
              <Download size={14} />
              Export JSON
            </Button>
          </div>
          <div role="status" className={`review-save-status ${saveFailed ? "is-error" : ""}`}>
            {feedback && (
              <>
                <CheckCircle2 size={13} style={{ display: "inline", marginRight: 6 }} />
                {feedback}
              </>
            )}
          </div>
        </div>
      </div>
      <Link href="/dashboard" className="text-link review-return">
        <ArrowLeft size={14} />
        Return to dashboard
      </Link>
    </div>
  );
}
