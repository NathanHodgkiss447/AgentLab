import Link from "next/link";
import { ArrowRight, Check, FlaskConical, Info } from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { ScenarioIcon } from "@/components/scenarios/scenario-icon";
import { Button } from "@/components/ui/button";
export default function ScenariosPage() {
  return <div className="page-content"><div className="page-heading"><div><span className="eyebrow">MAKE EVERY CONVERSATION COUNT</span><h1>Test Scenarios</h1><p>Choose a scenario to put your agent’s performance into perspective.</p></div><span className="badge"><FlaskConical size={14} />3 scenarios</span></div>
    <div className="scenario-grid">{scenarios.map((scenario, i) => <article key={scenario.id} className="scenario-card"><div className="scenario-card-top"><span className="scenario-icon"><ScenarioIcon id={scenario.id} /></span><span className="scenario-number">0{i + 1}</span></div><span className="micro-label">{scenario.category}</span><h2>{scenario.title}</h2><p>{scenario.description}</p><div className="card-rule" /><h3>WHAT TO LOOK FOR</h3><ul>{scenario.criteria.map(criterion => <li key={criterion}><Check size={14} />{criterion}</li>)}</ul><Button asChild><Link href={`/dashboard?scenario=${scenario.id}`}>Start testing<ArrowRight size={16} /></Link></Button></article>)}</div>
    <div className="info-strip"><Info size={18} /><p>Scenarios guide your testing and evaluation. In Live Mode, your configured agent keeps its existing instructions.</p></div>
    <div className="scenario-bottom"><span className="eyebrow">A GOOD TEST STARTS WITH A QUESTION</span><p>Explore how your agent responds under pressure, understands intent, and knows its limits.</p></div>
  </div>;
}
