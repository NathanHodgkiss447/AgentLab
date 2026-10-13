import type { Evaluation, Scenario, Session } from "@/types";
export const emptyEvaluation = (): Evaluation => ({
  checked: [],
  assessment: "not-evaluated",
  notes: "",
});
export function calculateScore(criteria: readonly string[], checked: readonly string[]): number {
  if (!criteria.length) return 0;
  return Math.round((criteria.filter((c) => checked.includes(c)).length / criteria.length) * 100);
}
export function sanitiseEvaluation(scenario: Scenario, evaluation: Evaluation): Evaluation {
  return {
    ...evaluation,
    checked: [...new Set(evaluation.checked)].filter((c) => scenario.criteria.includes(c)),
    notes: evaluation.notes.slice(0, 10000),
  };
}
export function sessionExport(session: Session, scenario: Scenario) {
  return {
    schemaVersion: 1,
    ...session,
    scenario: scenario.title,
    evaluation: {
      ...session.evaluation,
      score: calculateScore(scenario.criteria, session.evaluation.checked),
      scoringMethod: "human-assessed",
    },
    simulated: session.mode === "demo",
  };
}
