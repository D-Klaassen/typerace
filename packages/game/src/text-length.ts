/** How long a Classic Race's text is, and so which Leaderboard board it's on. */
export type TextLength = "short" | "medium" | "long";

export const TEXT_LENGTHS: readonly TextLength[] = ["short", "medium", "long"];

/** Characters per Classic Race text (see docs/spec.md). */
export const TEXT_LENGTH_CHARACTERS: Record<TextLength, number> = {
  short: 50,
  medium: 100,
  long: 200,
};
