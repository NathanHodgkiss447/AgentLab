"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Database, Download, History } from "lucide-react";
import { useStore } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { SessionTable, SessionCards } from "./session-list";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getScenario } from "@/data/scenarios";
import { sessionExport } from "@/lib/evaluation";
import { exportJson, formatDuration } from "@/lib/utils";
import type { Session } from "@/types";
export function SessionHistory() {
  const { sessions, ready, deleteSession } = useStore();
  const [deleting, setDeleting] = useState<Session | null>(null);
  const exportSession = (session: Session) =>
    exportJson(sessionExport(session, getScenario(session.scenarioId)), `agentlab-${session.id}`);
  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR TESTING NOTEBOOK</span>
          <h1>Session History</h1>
          <p>A record of your conversations, observations, and improvements.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!sessions.length}
          onClick={() =>
            exportJson(
              {
                schemaVersion: 1,
                exportedAt: new Date().toISOString(),
                sessions: sessions.map((s) => sessionExport(s, getScenario(s.scenarioId))),
              },
              "agentlab-all-sessions",
            )
          }
        >
          <Download size={14} />
          Export all
        </Button>
      </div>
      {!ready ? (
        <div className="page-loading" role="status">
          Loading local history…
        </div>
      ) : !sessions.length ? (
        <div className="card empty-state">
          <span className="empty-icon">
            <History size={24} />
          </span>
          <h2>Your next insight starts here.</h2>
          <p>
            Run a testing scenario, review the conversation, and save it. Your sessions will appear
            here.
          </p>
          <Button asChild>
            <Link href="/scenarios">
              Explore scenarios
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="history-summary">
            <span>
              <strong>{sessions.length}</strong>
              {sessions.length === 1 ? "session" : "sessions"} stored locally
            </span>
            <span>
              <strong>
                {sessions.filter((s) => s.evaluation.assessment !== "not-evaluated").length}
              </strong>
              evaluated
            </span>
            <span>
              <strong>{formatDuration(sessions.reduce((sum, s) => sum + s.duration, 0))}</strong>
              total testing time
            </span>
          </div>
          <SessionTable sessions={sessions} onExport={exportSession} onDelete={setDeleting} />
          <SessionCards sessions={sessions} onExport={exportSession} onDelete={setDeleting} />
        </>
      )}
      <div className="privacy-notice">
        <Database size={22} />
        <p>
          Sessions are stored locally in this browser.
          <span>
            No account or database. Clearing browser data removes your history. Export anything you
            want to keep.
          </span>
        </p>
      </div>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete this session?"
        description="This removes the session from this browser. Export a JSON copy first if you want to keep it. This action cannot be undone."
        onConfirm={() => {
          if (deleting && deleteSession(deleting.id)) setDeleting(null);
        }}
      />
    </div>
  );
}
