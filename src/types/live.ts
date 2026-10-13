import type { Mode, ScenarioId } from "./index";
export interface LiveWorkspaceProps {
  scenarioId: ScenarioId;
  mode: Mode;
  speed: number;
  onSpeedChange: (speed: number) => void;
  configurationAvailable: boolean;
  onModeChange: (mode: Mode) => void;
}
