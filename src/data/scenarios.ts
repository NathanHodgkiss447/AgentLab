import type { Scenario, ScenarioId } from "@/types";
export const scenarios = [
  { id: "customer-support", title: "Customer Support", category: "EMPATHY & RESOLUTION",
    description: "Test how an AI agent handles a frustrated customer with a billing problem.",
    criteria: ["Acknowledges the issue", "Demonstrates empathy", "Asks relevant questions", "Provides actionable next steps", "Maintains a professional tone"],
    opening: "I was charged twice for my subscription, and I haven't been able to get a response from support." },
  { id: "product-discovery", title: "Product Discovery", category: "DISCOVERY & RECOMMENDATIONS",
    description: "Test whether an agent understands customer requirements before recommending a product.",
    criteria: ["Asks clarifying questions", "Identifies customer requirements", "Provides relevant recommendations", "Explains its reasoning", "Avoids unsupported claims"],
    opening: "I'm looking for a voice AI solution for my startup. What would you recommend?" },
  { id: "knowledge-boundaries", title: "Knowledge Boundaries", category: "ACCURACY & TRUST",
    description: "Test how an agent handles questions it cannot confidently answer.",
    criteria: ["Recognises uncertainty", "Avoids hallucinations", "Communicates limitations", "Offers appropriate next steps"],
    opening: "Can you guarantee that your voice AI meets every healthcare compliance requirement in my country?" }
] as const satisfies readonly Scenario[];
export function getScenario(id?: string | null): Scenario { return scenarios.find(s => s.id === id) ?? scenarios[0]; }
export function isScenarioId(id: unknown): id is ScenarioId { return scenarios.some(s => s.id === id); }
