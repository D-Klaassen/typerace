import { describe, expect, it } from "vitest";
import { validateNicknames } from "./nicknames";

describe("validateNicknames", () => {
  it("accepts distinct nicknames of 1-16 characters", () => {
    expect(validateNicknames(["Anna", "B", "sixteen chars ok"])).toBeNull();
  });

  it("requires every nickname, ignoring surrounding spaces", () => {
    expect(validateNicknames(["Anna", "   "])).toBe("nicknameRequired");
  });

  it("rejects nicknames longer than 16 characters", () => {
    expect(validateNicknames(["Anna", "seventeen chars!!"])).toBe(
      "nicknameTooLong",
    );
  });

  it("rejects nicknames that only differ in case or spacing", () => {
    expect(validateNicknames(["Bob", " bob "])).toBe("nicknameTaken");
  });
});
