import Link from "next/link";
import { AudioLines } from "lucide-react";
export function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="logo" aria-label="AgentLab home"><span className="logo-mark"><AudioLines size={21} strokeWidth={2.4} /></span>{!compact && <span>AgentLab</span>}</Link>;
}
