"use client";
import { useEffect, useRef, useState } from "react";
import { AudioLines, MessageSquare, UserRound, ArrowDown } from "lucide-react";
import type { Message } from "@/types";
import { Button } from "@/components/ui/button";
export function Transcript({ messages, demo = false, active = false }: { messages: Message[]; demo?: boolean; active?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null); const pinned = useRef(true); const [showScroll, setShowScroll] = useState(false);
  useEffect(() => { if (pinned.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  return <div className="transcript-container"><div className="transcript-scroll" ref={scrollRef} onScroll={() => {
    const node = scrollRef.current; if (!node) return;
    pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; setShowScroll(!pinned.current);
  }}>
    {!messages.length ? <div className="transcript-empty"><span className="empty-icon"><MessageSquare size={24} /></span><h3>Your conversation, captured.</h3><p>{active ? "Waiting for the first completed message…" : "Start a session to follow every exchange here."}</p>{demo && <span className="micro-label">SCRIPTED DEMO · NO API CALLS</span>}</div> : <ol className="messages" aria-label={demo ? "Simulated conversation transcript" : "Conversation transcript"}>{messages.map(message => <li key={message.id} className={`message message-${message.role}`}>
      <span className={`avatar ${message.role === "agent" ? "avatar-agent" : ""}`}>{message.role === "agent" ? <AudioLines size={15} /> : <UserRound size={15} />}</span>
      <div><div className="message-meta"><strong>{message.role === "agent" ? "Agent" : "You"}</strong><time dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p>{message.text}</p></div>
    </li>)}</ol>}
  </div>{showScroll && <Button className="scroll-latest" size="sm" variant="outline" onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; pinned.current = true; setShowScroll(false); }}><ArrowDown size={14} />Latest messages</Button>}
  <span className="sr-only" role="status">{messages.length ? `${messages.length} completed messages in transcript.` : "Transcript is empty."}</span></div>;
}
