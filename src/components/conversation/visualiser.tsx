"use client";
import type { CSSProperties } from "react";
import type { Phase } from "@/types";
export function VoiceVisualiser({ phase = "idle", level = null, small = false }: { phase?: Phase; level?: number | null; small?: boolean }) {
  const active = ["speaking", "listening", "connecting", "connected"].includes(phase);
  return <div className={`visualiser ${active ? "is-active" : ""} ${phase === "speaking" ? "is-speaking" : ""} ${small ? "is-small" : ""}`} aria-hidden="true">
    <div className="orb-halo" /><div className="orb-orbit orbit-one" /><div className="orb-orbit orbit-two" /><div className="orb-orbit orbit-three" />
    <div className="orb-core"><div className="orb-inner-glow" /><div className="wave-bars">{Array.from({ length: 57 }, (_, i) => {
      const envelope = Math.sin(i / 56 * Math.PI); const ripple = .35 + Math.abs(Math.sin(i * 1.7)) * .65;
      const amplitude = level === null ? 1 : .15 + Math.min(1, Math.max(0, level)) * 1.8;
      // Short decimal values survive browser CSS parsing unchanged during hydration.
      const height = ((4 + envelope * ripple * 82) * amplitude).toFixed(3);
      const delay = (i * -.083).toFixed(3);
      return <span key={i} style={{ height: `${height}%`, "--delay": `${delay}s` } as CSSProperties} />;
    })}</div></div>
    <div className="orb-point point-one" /><div className="orb-point point-two" />
  </div>;
}
