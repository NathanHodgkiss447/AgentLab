// A non-secret build-time availability value, set by next.config.ts after
// resolving the real package. Production authorization does not trust this flag.
export function hasVoiceSdk() {
  return process.env.AGENTLAB_SDK_INSTALLED === "true";
}
