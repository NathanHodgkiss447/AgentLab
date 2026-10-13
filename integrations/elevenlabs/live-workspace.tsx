"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { ConversationWorkspace } from "@/components/dashboard/conversation-workspace";
import { getScenario } from "@/data/scenarios";
import type { LiveWorkspaceProps } from "@/types/live";
import { useLiveConversation } from "./use-live-conversation";

export function LiveWorkspace(props: LiveWorkspaceProps) {
  return (
    <ConversationProvider>
      <LiveController {...props} />
    </ConversationProvider>
  );
}

function LiveController(props: LiveWorkspaceProps) {
  const controller = useLiveConversation(props.scenarioId);
  return (
    <ConversationWorkspace
      {...props}
      scenario={getScenario(props.scenarioId)}
      controller={controller}
    />
  );
}
