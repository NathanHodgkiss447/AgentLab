import type { ScenarioId } from "@/types";
export interface DemoLine {
  role: "user" | "agent";
  text: string;
  durationMs: number;
}
export const demoScripts: Record<ScenarioId, readonly DemoLine[]> = {
  "customer-support": [
    {
      role: "user",
      text: "Hi, I was charged twice for my subscription, and I haven't been able to get a response from support.",
      durationMs: 3500,
    },
    {
      role: "agent",
      text: "I'm sorry you've had to chase this up. A duplicate charge is frustrating. Could you tell me when the two charges appeared, and whether they're both marked as completed?",
      durationMs: 6500,
    },
    {
      role: "user",
      text: "Yesterday. They're both completed, for €29 each. I really need that money back.",
      durationMs: 4000,
    },
    {
      role: "agent",
      text: "I understand. Please don't share your full card details here. Open Billing in your account and copy the two transaction references. With those, our billing team can investigate the duplicate and confirm whether a refund is due.",
      durationMs: 7000,
    },
    {
      role: "user",
      text: "Okay, I found the references. What happens if no one replies again?",
      durationMs: 3500,
    },
    {
      role: "agent",
      text: "Submit them through the billing support form and keep the ticket number. If you don't receive an acknowledgement, use that number to follow up. I can't issue a refund from this conversation, but I can help you write a clear request.",
      durationMs: 7000,
    },
  ],
  "product-discovery": [
    {
      role: "user",
      text: "I'm looking for a voice AI solution for my startup. What would you recommend?",
      durationMs: 3500,
    },
    {
      role: "agent",
      text: "I'd like to understand your use case first. Are you handling customer support, building an in-app assistant, or creating something else?",
      durationMs: 5500,
    },
    {
      role: "user",
      text: "An in-app assistant for language learning. We need natural conversations in English and Spanish, with a small development team.",
      durationMs: 4500,
    },
    {
      role: "agent",
      text: "So conversational quality, those two languages, and straightforward integration are your priorities. Do you also need transcripts to give learners feedback? What's your expected usage?",
      durationMs: 6000,
    },
    {
      role: "user",
      text: "Yes, transcripts are essential. We're starting with about 100 learners. We want to validate the experience before scaling.",
      durationMs: 4500,
    },
    {
      role: "agent",
      text: "I'd prototype with a conversational voice SDK and test both languages with actual learners. ElevenLabs is one option to evaluate because it offers agent integration and transcript events. Confirm current language coverage, privacy terms, and pricing before committing. A small pilot will help you compare latency and learning outcomes.",
      durationMs: 7500,
    },
  ],
  "knowledge-boundaries": [
    {
      role: "user",
      text: "Can you guarantee that your voice AI meets every healthcare compliance requirement in my country?",
      durationMs: 4500,
    },
    {
      role: "agent",
      text: "I can't guarantee that. Requirements depend on your country, how you use the system, and the data you process. Which country and workflow are you considering?",
      durationMs: 5500,
    },
    {
      role: "user",
      text: "Ireland. We'd like an assistant to discuss patients' prescriptions. Is that definitely allowed?",
      durationMs: 4000,
    },
    {
      role: "agent",
      text: "I don't have enough verified information to say it's allowed. Prescription discussions involve sensitive health data and could raise clinical safety concerns. My answer isn't legal or medical advice.",
      durationMs: 6000,
    },
    { role: "user", text: "What should we check before building it, then?", durationMs: 3000 },
    {
      role: "agent",
      text: "Start with your data protection officer and a qualified healthcare adviser. Review the provider's current data processing agreement, retention settings, and relevant healthcare requirements. For an early prototype, use synthetic examples and avoid real patient data until that review is complete.",
      durationMs: 7500,
    },
  ],
};
