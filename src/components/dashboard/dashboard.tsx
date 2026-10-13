"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getScenario } from "@/data/scenarios";
import { useDemoConversation } from "@/hooks/use-demo-conversation";
import { useStore } from "@/components/providers";
import { ConversationWorkspace } from "./conversation-workspace";
import { LiveWorkspace } from "@agentlab/live";
import type { Mode, VoiceConfiguration } from "@/types";
export function Dashboard({ configuration }: { configuration: VoiceConfiguration }) {
  const search = useSearchParams();
  const { preferences, ready } = useStore();
  const scenario = getScenario(search.get("scenario"));
  if (!ready)
    return (
      <div className="page-loading" role="status">
        Preparing your workspace…
      </div>
    );
  const initialMode: Mode =
    search.get("mode") === "demo" || !configuration.available || preferences.demoMode
      ? "demo"
      : "live";
  return (
    <DashboardSession
      key={scenario.id}
      scenarioId={scenario.id}
      initialMode={initialMode}
      configuration={configuration}
    />
  );
}
function DashboardSession({
  scenarioId,
  initialMode,
  configuration,
}: {
  scenarioId: string;
  initialMode: Mode;
  configuration: VoiceConfiguration;
}) {
  const [mode, setMode] = useState(initialMode);
  const [speed, setSpeed] = useState(1);
  const scenario = getScenario(scenarioId);
  const props = {
    scenarioId: scenario.id,
    mode,
    speed,
    onSpeedChange: setSpeed,
    configurationAvailable: configuration.available,
    onModeChange: setMode,
  };
  return mode === "live" && configuration.available ? (
    <LiveWorkspace key={`${scenario.id}-${mode}`} {...props} />
  ) : (
    <DemoWorkspace key={`${scenario.id}-${mode}`} {...props} mode="demo" />
  );
}
function DemoWorkspace({
  scenarioId,
  ...props
}: Omit<React.ComponentProps<typeof ConversationWorkspace>, "controller" | "scenario"> & {
  scenarioId: string;
}) {
  const scenario = getScenario(scenarioId);
  const controller = useDemoConversation(scenario.id, props.speed);
  return <ConversationWorkspace {...props} scenario={scenario} controller={controller} />;
}
