import { Settings } from "@/components/settings/settings";
import { getVoiceConfiguration } from "@/lib/elevenlabs/configuration";
export const dynamic = "force-dynamic";
export default function SettingsPage() { return <Settings configuration={getVoiceConfiguration()} />; }
