import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { EvaluationChecklist } from "./checklist";
import { emptyEvaluation } from "@/lib/evaluation";
import { scenarios } from "@/data/scenarios";
afterEach(cleanup);
it("exposes labelled checkboxes and updates the manual completion score", () => {
  function Test() {
    const [evaluation, set] = useState(emptyEvaluation());
    return <EvaluationChecklist scenario={scenarios[0]} evaluation={evaluation} onChange={set} />;
  }
  render(<Test />);
  expect(screen.getByRole("progressbar").getAttribute("value")).toBe("0");
  fireEvent.click(screen.getByLabelText("Acknowledges the issue"));
  expect(screen.getByRole("progressbar").getAttribute("value")).toBe("20");
  expect(screen.getByText("20%")).toBeTruthy();
});
