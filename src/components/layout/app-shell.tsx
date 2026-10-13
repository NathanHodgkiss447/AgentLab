"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, BookOpen, FlaskConical, History, LayoutDashboard, Settings, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
import { useStore } from "@/components/providers";
const nav = [
  { href: "/dashboard", label: "Dashboard", mobile: "Dashboard", icon: LayoutDashboard },
  { href: "/scenarios", label: "Test Scenarios", mobile: "Scenarios", icon: FlaskConical },
  { href: "/sessions", label: "Session History", mobile: "History", icon: History },
  { href: "/settings", label: "Settings", mobile: "Settings", icon: Settings }
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const { storageError } = useStore();
  return <div className="app-shell">
    <aside className="sidebar"><Logo /><div className="sidebar-section-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined} className={`nav-item ${path.startsWith(href) ? "active" : ""}`}><Icon size={18} />{label}{path.startsWith(href) && <span className="nav-active-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/docs" className="nav-item"><BookOpen size={18} />Documentation<ArrowUpRight size={14} /></Link>
        <div className="mode-card"><span className="status-dot" /><div><strong>Demo ready</strong><small>No API key needed</small></div><AudioLines size={17} /></div>
        <span className="sidebar-footnote"><ShieldCheck size={13} />Local-first. Private by design.</span>
      </div>
    </aside>
    <div className="workspace"><header className="workspace-header"><div><span className="desktop-breadcrumb">Workspace <span>/</span> </span><span>{nav.find(n => path.startsWith(n.href))?.label ?? "Documentation"}</span></div><span className="workspace-label"><span className="status-dot" /> All systems local</span></header>
      <div className="mobile-top"><Logo /><span className="badge badge-demo">Testing studio</span></div>
      {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
      <main id="main-content" className="workspace-main">{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(({ href, mobile, icon: Icon }) => <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined} className={path.startsWith(href) ? "active" : ""}><Icon size={19} /><span>{mobile}</span></Link>)}</nav>
  </div>;
}
