import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getVoiceConfiguration } from "@/lib/elevenlabs/configuration";
export const dynamic = "force-dynamic";
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="page-loading">Loading dashboard…</div>}>
      <Dashboard configuration={getVoiceConfiguration()} />
    </Suspense>
  );
}
