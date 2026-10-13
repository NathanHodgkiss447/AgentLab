"use client";

import Link from "next/link";
import { Download, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getScenario } from "@/data/scenarios";
import { formatDuration, resultLabels } from "@/lib/utils";
import type { Session } from "@/types";

interface SessionListProps {
  sessions: Session[];
  onExport: (session: Session) => void;
  onDelete: (session: Session) => void;
}

function Result({ session }: { session: Session }) {
  return (
    <span className={`result-badge result-${session.evaluation.assessment}`}>
      <span aria-hidden="true">
        {session.evaluation.assessment === "pass"
          ? "✓"
          : session.evaluation.assessment === "fail"
            ? "×"
            : "•"}
      </span>
      {resultLabels[session.evaluation.assessment]}
    </span>
  );
}
export function SessionTable({ sessions, onExport, onDelete }: SessionListProps) {
  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <caption className="sr-only">Locally saved testing sessions</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Scenario</th>
            <th scope="col">Duration</th>
            <th scope="col">Result</th>
            <th scope="col">Mode</th>
            <th scope="col" style={{ textAlign: "right" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>
                <time dateTime={new Date(session.startedAt).toISOString()}>
                  {new Date(session.startedAt).toLocaleDateString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  <span>
                    {new Date(session.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </time>
              </td>
              <td>
                <Link href={`/sessions/${session.id}`}>
                  {getScenario(session.scenarioId).title}
                </Link>
              </td>
              <td>{formatDuration(session.duration)}</td>
              <td>
                <Result session={session} />
              </td>
              <td>
                <span className="badge">{session.mode === "demo" ? "Demo" : "Live"}</span>
              </td>
              <td>
                <div className="table-actions">
                  <Button asChild variant="ghost" size="icon">
                    <Link
                      href={`/sessions/${session.id}`}
                      aria-label={`Review ${getScenario(session.scenarioId).title} session`}
                    >
                      <Eye size={15} />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Export session JSON"
                    onClick={() => onExport(session)}
                  >
                    <Download size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete session"
                    onClick={() => onDelete(session)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SessionCards({ sessions, onExport, onDelete }: SessionListProps) {
  return (
    <div className="history-mobile">
      {sessions.map((session) => (
        <article className="history-mobile-card" key={session.id}>
          <div className="history-mobile-card-top">
            <time dateTime={new Date(session.startedAt).toISOString()}>
              {new Date(session.startedAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
            <Result session={session} />
          </div>
          <h2>
            <Link href={`/sessions/${session.id}`}>{getScenario(session.scenarioId).title}</Link>
          </h2>
          <div className="history-mobile-meta">
            <span>{formatDuration(session.duration)}</span>
            <span className="badge">
              {session.mode === "demo" ? "Demo · simulated" : "Live voice"}
            </span>
          </div>
          <div className="history-mobile-actions">
            <Button asChild variant="outline" size="sm">
              <Link href={`/sessions/${session.id}`}>
                <Eye size={14} />
                Review
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Export session JSON"
              onClick={() => onExport(session)}
            >
              <Download size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete session"
              onClick={() => onDelete(session)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
