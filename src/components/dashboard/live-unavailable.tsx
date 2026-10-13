"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LiveWorkspaceProps } from "@/types/live";
export function LiveWorkspace({ onModeChange }: LiveWorkspaceProps) {
  return <div className="empty-state"><h1>Live voice needs the official SDK</h1><p>Install @elevenlabs/react, restart the development server, and configure the server environment. Demo Mode is ready to explore.</p><Button onClick={() => onModeChange("demo")}>Switch to Demo Mode</Button><Link href="/docs#live-voice" className="text-link" style={{ marginTop: 20 }}>Local integration instructions</Link></div>;
}
