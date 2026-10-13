import { describe, expect, it } from "vitest";
import { describeVoiceServiceError, InvalidVoiceResponseError } from "./errors";

describe("safe voice service diagnostics", () => {
  it.each([
    ["EAI_AGAIN", "VOICE_DNS_ERROR"],
    ["ENOTFOUND", "VOICE_DNS_ERROR"],
    ["UND_ERR_CONNECT_TIMEOUT", "VOICE_TIMEOUT"],
    ["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "VOICE_TLS_ERROR"],
    ["SELF_SIGNED_CERT_IN_CHAIN", "VOICE_TLS_ERROR"],
    ["ECONNREFUSED", "VOICE_NETWORK_ERROR"],
  ])("classifies %s without disclosing the raw error", (code, expected) => {
    const failure = new TypeError("secret signed URL", { cause: { code } });
    const diagnostic = describeVoiceServiceError(failure);
    expect(diagnostic.code).toBe(expected);
    expect(diagnostic.error).not.toContain("secret signed URL");
  });

  it("recognises invalid JSON and invalid URL responses", () => {
    expect(describeVoiceServiceError(new SyntaxError("private body")).code).toBe(
      "VOICE_INVALID_RESPONSE",
    );
    expect(describeVoiceServiceError(new InvalidVoiceResponseError()).code).toBe(
      "VOICE_INVALID_RESPONSE",
    );
  });

  it("recognises nested errors from multi-address connection attempts", () => {
    expect(
      describeVoiceServiceError(
        new TypeError("fetch failed", {
          cause: new AggregateError([{ code: "ETIMEDOUT" }]),
        }),
      ).code,
    ).toBe("VOICE_TIMEOUT");
  });
});
