"use client";
import { calculateScore } from "@/lib/evaluation";
import type { Evaluation, Scenario } from "@/types";
export function EvaluationChecklist({
  scenario,
  evaluation,
  onChange,
}: {
  scenario: Scenario;
  evaluation: Evaluation;
  onChange: (evaluation: Evaluation) => void;
}) {
  const score = calculateScore(scenario.criteria, evaluation.checked);
  return (
    <div className="checklist">
      <div className="card-title-row">
        <h2>Evaluation checklist</h2>
        <span className="score-count">
          {scenario.criteria.filter((c) => evaluation.checked.includes(c)).length}
          <span> / {scenario.criteria.length}</span>
        </span>
      </div>
      <div className="score-row">
        <progress max={100} value={score} aria-label="Human-assessed checklist completion" />
        <span>{score}%</span>
      </div>
      <span className="micro-label score-label">HUMAN-ASSESSED · MANUAL CHECKLIST</span>
      <div className="criteria">
        {scenario.criteria.map((criterion) => (
          <label key={criterion}>
            <input
              type="checkbox"
              checked={evaluation.checked.includes(criterion)}
              onChange={(e) =>
                onChange({
                  ...evaluation,
                  checked: e.target.checked
                    ? [...evaluation.checked, criterion]
                    : evaluation.checked.filter((c) => c !== criterion),
                })
              }
            />
            <span>{criterion}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
