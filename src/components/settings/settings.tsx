"use client";
import Link from "next/link";
import { CheckCircle2, ExternalLink, LockKeyhole, Moon, Settings2, ShieldCheck } from "lucide-react";
import { useStore } from "@/components/providers";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Preferences, VoiceConfiguration } from "@/types";
export function Settings({ configuration }: { configuration: VoiceConfiguration }) {
  const { preferences, updatePreferences, ready } = useStore();
  const rows: { key: keyof Preferences; label: string; detail: string }[] = [
    { key: "demoMode", label: "Prefer Demo Mode", detail: "Open new testing sessions in Demo Mode." },
    { key: "autoSave", label: "Auto-save completed sessions", detail: "Save transcripts on completion, including sessions you stop." },
    { key: "reducedMotion", label: "Reduce motion", detail: "Minimise animation throughout the workspace." }
  ];
  return <div className="page-content"><div className="page-heading"><div><span className="eyebrow">MAKE IT YOUR WORKSPACE</span><h1>Settings</h1><p>Configure your AgentLab experience.</p></div><span className="badge"><Settings2 size={14} />Preferences</span></div>
    <div className="settings-grid"><section className="card settings-card"><h2>Voice agent configuration</h2><p>Connect your ElevenLabs agent for local development.</p><div className="configuration-status">{configuration.available ? <CheckCircle2 size={17} /> : <LockKeyhole size={17} />}<span>{configuration.available ? "Live voice available locally" : "Demo Mode available · live voice disabled"}</span></div><div className="settings-field"><label htmlFor="configured-agent">Configured agent ID</label><input id="configured-agent" readOnly value={configuration.agentId ?? "Not configured for live access"} /><p>{configuration.reason}</p></div>
      <h3 style={{ fontSize: 11, marginTop: 25 }}>Local setup</h3><p style={{ marginTop: 8 }}>Run <code>npm run setup:live</code>, then create <code>.env.local</code> in the project root:</p><div className="config-instructions"><pre><code>{"ELEVENLABS_AGENT_ID=your_agent_id\nELEVENLABS_API_KEY=your_private_key\nENABLE_LIVE_VOICE=true"}</code></pre></div><p>Restart <code>npm run dev</code>, then choose Live in the dashboard’s session options. Configure your agent’s behaviour in ElevenLabs before testing.</p><div style={{ marginTop: 22 }}><Button asChild variant="outline" size="sm"><Link href="/docs#live-voice">Integration instructions<ExternalLink size={13} /></Link></Button></div><div className="config-security"><ShieldCheck size={16} /><p>API keys stay on the server. Signed URLs are never stored. Live voice is rejected on production servers, even when configured.</p></div>
    </section><section className="card settings-card"><h2>Application preferences</h2><p>A few small choices for a better testing experience.</p><div className="preference-row"><div><span style={{ fontSize: 12 }}>Appearance</span><p style={{ marginTop: 5 }}>A focused dark workspace, inspired by developer tools.</p></div><span className="preference-theme"><Moon size={13} />Dark</span></div>{rows.map(row => <div className="preference-row" key={row.key}><div><label htmlFor={row.key}>{row.label}</label><p>{row.detail}</p></div><Switch id={row.key} checked={preferences[row.key]} disabled={!ready} onCheckedChange={checked => updatePreferences({ [row.key]: checked })} /></div>)}<div className="settings-footer"><CheckCircle2 size={14} />Preferences are saved in this browser.</div></section></div>
  </div>;
}
