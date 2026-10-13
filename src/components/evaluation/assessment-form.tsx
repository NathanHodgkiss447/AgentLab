"use client";

import { resultLabels } from "@/lib/utils";
import type { Assessment, Evaluation } from "@/types";

const ASSESSMENTS: Assessment[] = ["pass", "needs-improvement", "fail", "not-evaluated"];

interface AssessmentFormProps {
  evaluation: Evaluation;
  onChange: (evaluation: Evaluation) => void;
}

export function AssessmentForm({ evaluation, onChange }: AssessmentFormProps) {
  return (
    <section className="card">
      <fieldset className="assessment-group">
        <legend>Overall assessment</legend>
        <div className="assessment-options">
          {ASSESSMENTS.map((assessment) => (
            <label key={assessment}>
              <input
                type="radio"
                name="assessment"
                value={assessment}
                checked={evaluation.assessment === assessment}
                onChange={() => onChange({ ...evaluation, assessment })}
              />
              {resultLabels[assessment]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="notes-label" htmlFor="evaluation-notes">
        Notes <span>(optional)</span>
      </label>
      <textarea
        id="evaluation-notes"
        placeholder="What worked? What could the agent improve?"
        maxLength={10000}
        value={evaluation.notes}
        onChange={(e) => onChange({ ...evaluation, notes: e.target.value })}
      />
    </section>
  );
}
