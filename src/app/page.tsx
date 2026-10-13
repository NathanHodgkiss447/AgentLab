import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  CheckSquare2,
  History,
  FlaskConical,
  ArrowUpRight,
  Code2,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { VoiceVisualiser } from "@/components/conversation/visualiser";
const features = [
  { icon: AudioLines, title: "Real-time voice", text: "Conversations that feel real." },
  { icon: FlaskConical, title: "Structured scenarios", text: "Put your agent to the test." },
  { icon: CheckSquare2, title: "Human-led evaluation", text: "Turn observations into insight." },
  { icon: History, title: "History & export", text: "Keep what you learn." },
];
export default function LandingPage() {
  const github = process.env.NEXT_PUBLIC_GITHUB_URL;
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav aria-label="Landing navigation">
          <a href="#features">Features</a>
          <Link href="/dashboard?mode=demo">Demo</Link>
          <Link href="/docs">Docs</Link>
          {github && (
            <a href={github} target="_blank" rel="noreferrer">
              GitHub
              <ArrowUpRight size={12} />
            </a>
          )}
        </nav>
        <Button size="sm" asChild>
          <Link href="/dashboard?mode=demo">
            Get started
            <ArrowRight size={14} />
          </Link>
        </Button>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="hero-ambient" />
          <div className="hero-content">
            <a
              href="https://elevenlabs.io/docs/eleven-agents/overview"
              className="built-badge"
              target="_blank"
              rel="noreferrer"
            >
              <AudioLines size={14} />
              Built with ElevenLabs
              <span className="badge-separator" />
              <ArrowUpRight size={12} />
            </a>
            <h1>
              Test. Listen. <span>Improve.</span>
            </h1>
            <p>
              A developer-focused studio for testing and evaluating
              <br className="desktop-br" /> AI voice agents. Built for real conversations.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/dashboard?mode=demo">
                  Open Demo
                  <ArrowRight size={17} />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                {github ? (
                  <a href={github} target="_blank" rel="noreferrer">
                    <Code2 size={18} />
                    View on GitHub
                  </a>
                ) : (
                  <Link href="/docs">
                    <Code2 size={18} />
                    Explore the project
                  </Link>
                )}
              </Button>
            </div>
            <span className="hero-note">
              <span className="status-dot" />
              No account. No API key. Just explore.
            </span>
          </div>
          <div className="hero-wave" aria-hidden="true">
            {Array.from({ length: 26 }, (_, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
        </section>
        <section id="features" className="landing-features" aria-label="Features">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <span className="feature-icon">
                <Icon size={21} />
              </span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="landing-preview">
          <div className="preview-caption">
            <span className="eyebrow">THE CONVERSATION IS JUST THE BEGINNING</span>
            <h2>Listen closely. Learn something.</h2>
            <p>One focused workspace, from first exchange to actionable feedback.</p>
          </div>
          <Link
            href="/dashboard?mode=demo"
            className="preview-window"
            aria-label="Try the interactive testing dashboard"
          >
            <div className="preview-window-bar">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span>agentlab / workspace</span>
              <span className="badge badge-demo">Demo mode</span>
            </div>
            <div className="preview-body">
              <div>
                <span className="eyebrow">SCENARIO 01</span>
                <h3>Customer Support</h3>
                <VoiceVisualiser small />
                <span className="preview-status">
                  <span className="status-dot" />
                  Ready when you are
                </span>
              </div>
              <div className="preview-transcript">
                <span className="micro-label">A PREVIEW OF DEMO DATA</span>
                <div className="preview-message">
                  <span>You</span>
                  <p>I was charged twice for my subscription. Can you help?</p>
                </div>
                <div className="preview-message agent">
                  <span>
                    <AudioLines size={14} />
                    Agent
                  </span>
                  <p>
                    I’m sorry you’ve had to chase this up. Let’s understand what happened and find
                    the next step.
                  </p>
                </div>
                <span className="preview-link">
                  Try this scenario
                  <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        </section>
        <section className="about-section" id="about">
          <div>
            <span className="eyebrow">ABOUT AGENTLAB</span>
            <h2>
              Better conversations
              <br />
              build better products.
            </h2>
          </div>
          <div>
            <p>
              AgentLab is a developer-focused platform for testing and evaluating conversational AI
              voice agents.
            </p>
            <p>
              Built with Next.js, React, TypeScript, ElevenLabs, Tailwind CSS and shadcn/ui. A
              focused exploration of real-time state, asynchronous events, transcript management,
              API security, accessible interfaces, and local session persistence.
            </p>
            <div className="about-links">
              <Link href="/docs">
                Read the engineering notes
                <ArrowUpRight size={15} />
              </Link>
              {github && (
                <a href={github} target="_blank" rel="noreferrer">
                  Source on GitHub
                  <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Test. Listen. Improve.</span>
        <span>
          <ShieldCheck size={14} />
          Your demo data stays in your browser.
        </span>
        <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">
          <AudioLines size={14} />
          Built with ElevenLabs
        </a>
      </footer>
    </div>
  );
}
