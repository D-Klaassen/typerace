export const MAX_NICKNAME_LENGTH = 16;

export type NicknameProblem =
  "nicknameRequired" | "nicknameTooLong" | "nicknameTaken";

/** Checks the nicknames of everyone in one game; null when they're all fine. */
export function validateNicknames(
  nicknames: readonly string[],
): NicknameProblem | null {
  const trimmed = nicknames.map((nickname) => nickname.trim());

  if (trimmed.some((nickname) => nickname.length === 0)) {
    return "nicknameRequired";
  }
  if (trimmed.some((nickname) => nickname.length > MAX_NICKNAME_LENGTH)) {
    return "nicknameTooLong";
  }

  const lowercased = trimmed.map((nickname) => nickname.toLowerCase());
  if (new Set(lowercased).size !== lowercased.length) {
    return "nicknameTaken";
  }

  return null;
}
