"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>Something interrupted this view.</h1>
      <p>Your saved sessions remain in this browser. Try loading the page again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
