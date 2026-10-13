import { formatDuration } from "@/lib/utils";
import type { Scenario, Session } from "@/types";

interface SessionOverviewProps {
  session: Session;
  scenario: Scenario;
}

const COMPLETION_LABELS: Record<Session["completion"], string> = {
  finished: "Finished playback",
  "connection-lost": "Connection ended",
  stopped: "Stopped by tester",
};

export function SessionOverview({ session, scenario }: SessionOverviewProps) {
  return (
    <section className="card session-overview">
      <div className="card-title-row">
        <h2>Session overview</h2>
        <span className={`badge ${session.mode === "demo" ? "badge-demo" : "badge-live"}`}>
          {session.mode === "demo" ? "Demo · simulated" : "Live voice"}
        </span>
      </div>
      <dl>
        <dt>Scenario</dt>
        <dd>{scenario.title}</dd>
        <dt>Date</dt>
        <dd>
          {new Date(session.startedAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </dd>
        <dt>Duration</dt>
        <dd>{formatDuration(session.duration)}</dd>
        <dt>Completion</dt>
        <dd>
          {session.mode === "live" && session.completion === "finished"
            ? "Ended by agent"
            : COMPLETION_LABELS[session.completion]}
        </dd>
        <dt>Session ID</dt>
        <dd>
          <code>{session.id}</code>
        </dd>
        {session.conversationId && (
          <>
            <dt>ElevenLabs ID</dt>
            <dd>
              <code>{session.conversationId}</code>
            </dd>
          </>
        )}
      </dl>
    </section>
  );
}
