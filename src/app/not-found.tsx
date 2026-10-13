import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="empty-state" id="main-content">
      <span className="eyebrow">404 · PAGE NOT FOUND</span>
      <h1>A little off-script.</h1>
      <p>This page doesn’t exist. Your workspace is one click away.</p>
      <Button asChild>
        <Link href="/dashboard">Open dashboard</Link>
      </Button>
    </main>
  );
}
