/**
 * Key Sets: which keys the Gibberish may contain. A Player picks a preset
 * (a Lesson, a row, some fingers, or Easy/Medium/Hard) or a custom set, and
 * can add Capitals on top.
 */

/** Every key a Key Set may use, in keyboard order (US QWERTY, unshifted). */
export const TYPABLE_KEYS = "`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./";

const HOME = "asdfghjkl;";
const TOP = "qwertyuiop";
const BOTTOM = "zxcvbnm,./";
const DIGITS = "1234567890";
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** What the text generator needs: the keys, and whether letters may be capitals. */
export interface KeySet {
  keys: string;
  capitals: boolean;
}

/** The Host's choice: a preset by id, or their own keys. */
export type KeySetChoice = { preset: string } | { custom: string };

export type PresetGroup = "lesson" | "row" | "finger" | "classic";

export interface KeySetPreset {
  /** Stable id, used in settings and Votes. */
  id: string;
  group: PresetGroup;
  keys: string;
  /** Hard always includes Capitals. */
  capitals?: boolean;
}

export interface Lesson extends KeySetPreset {
  group: "lesson";
  /** 1-based, as shown to Players. */
  number: number;
  stage: number;
}

/**
 * The lesson ladder, after the one typelesonline.nl uses: per stage, pairs of
 * keys (one per hand), then the pairs combined, then everything so far.
 */
const LESSON_KEYS: readonly (readonly [stage: number, keys: string])[] = [
  // 1 · Home row
  [1, "fj"],
  [1, "dk"],
  [1, "sl"],
  [1, "a;"],
  [1, "dfjk"],
  [1, "asl;"],
  [1, "asdfjkl;"],
  [1, "gh"],
  [1, "fghj"],
  [1, HOME],
  // 2 · Top row
  [2, "ru"],
  [2, "ei"],
  [2, "wo"],
  [2, "qp"],
  [2, "erui"],
  [2, "qwop"],
  [2, "qweruiop"],
  [2, "ty"],
  [2, "rtyu"],
  [2, TOP],
  // 3 · Top and home row
  [3, "rufj"],
  [3, "tygh"],
  [3, "rtyufghj"],
  [3, "qweruiop"],
  [3, "asdfjkl;"],
  [3, "qweruiopasdfjkl;"],
  [3, "rtyufghj"],
  [3, TOP + HOME],
  // 4 · Bottom row
  [4, "vm"],
  [4, "c,"],
  [4, "x."],
  [4, "z/"],
  [4, "cvm,"],
  [4, "zx./"],
  [4, "zxcvm,./"],
  [4, "bn"],
  [4, "vbnm"],
  [4, BOTTOM],
  // 5 · Bottom and home row
  [5, "fjvm"],
  [5, "ghbn"],
  [5, "fghjvbnm"],
  [5, "asdfjkl;"],
  [5, "zxcvm,./"],
  [5, "asdfjkl;zxcvm,./"],
  [5, "fghjvbnm"],
  [5, HOME + BOTTOM],
  // 6 · Columns per finger
  [6, "rfvujm"],
  [6, "tgbyhn"],
  [6, "rfvtgbyhnujm"],
  [6, "edcik,"],
  [6, "edcrfvujmik,"],
  [6, "edcrfvtgbyhnujmik,"],
  [6, "wsxol."],
  [6, "qazp;/"],
  [6, "qazwsxol.p;/"],
  [6, "rfvtgbyhnujm"],
  [6, "qazwsxol.p;/"],
  [6, TOP + HOME + BOTTOM],
  // 7 · Digits
  [7, "67"],
  [7, "58"],
  [7, "5678"],
  [7, "349"],
  [7, "120"],
  [7, "123490"],
  [7, "5678"],
  [7, "123490"],
  [7, DIGITS],
  // 8 · Review
  [8, HOME],
  [8, TOP],
  [8, TOP + HOME],
  [8, BOTTOM],
  [8, HOME + BOTTOM],
  [8, TOP + HOME + BOTTOM],
  [8, DIGITS],
  [8, DIGITS + HOME],
  [8, DIGITS + TOP + HOME + BOTTOM],
];

export const LESSONS: readonly Lesson[] = LESSON_KEYS.map(
  ([stage, keys], index) => ({
    id: `lesson-${index + 1}`,
    group: "lesson",
    number: index + 1,
    stage,
    keys,
  }),
);

const OTHER_PRESETS: readonly KeySetPreset[] = [
  { id: "row-home", group: "row", keys: HOME },
  { id: "row-top", group: "row", keys: TOP },
  { id: "row-bottom", group: "row", keys: BOTTOM },
  { id: "row-numbers", group: "row", keys: DIGITS },
  { id: "row-home-top", group: "row", keys: TOP + HOME },
  { id: "row-home-bottom", group: "row", keys: HOME + BOTTOM },
  { id: "row-letters", group: "row", keys: TOP + HOME + BOTTOM },
  { id: "finger-index", group: "finger", keys: "rfvtgbyhnujm" },
  { id: "finger-middle", group: "finger", keys: "edcik," },
  { id: "finger-ring", group: "finger", keys: "wsxol." },
  { id: "finger-pinky", group: "finger", keys: "qazp;/" },
  { id: "finger-left", group: "finger", keys: "qwertasdfgzxcvb" },
  { id: "finger-right", group: "finger", keys: "yuiophjkl;nm,./" },
  { id: "classic-easy", group: "classic", keys: HOME },
  { id: "classic-medium", group: "classic", keys: LETTERS },
  {
    id: "classic-hard",
    group: "classic",
    keys: `${LETTERS}${DIGITS}.,;'-/`,
    capitals: true,
  },
];

export const KEY_SET_PRESETS: readonly KeySetPreset[] = [
  ...LESSONS,
  ...OTHER_PRESETS,
];

export const DEFAULT_KEY_SET_CHOICE: KeySetChoice = {
  preset: "classic-medium",
};

/** A custom set needs at least this many keys to make sensible text. */
export const MIN_CUSTOM_KEYS = 2;

export function findPreset(id: string): KeySetPreset | undefined {
  return KEY_SET_PRESETS.find((preset) => preset.id === id);
}

/** Known keys only, each once, in keyboard order. */
export function normalizeKeys(keys: string): string {
  return [...TYPABLE_KEYS].filter((key) => keys.includes(key)).join("");
}

/**
 * The keys and Capitals a choice stands for. An unknown preset or a custom
 * set that's too small falls back to all letters.
 */
export function resolveKeySet(choice: KeySetChoice, capitals: boolean): KeySet {
  const fallback = findPreset("classic-medium")!;

  if ("preset" in choice) {
    const preset = findPreset(choice.preset) ?? fallback;

    return {
      keys: preset.keys,
      capitals: capitals || preset.capitals === true,
    };
  }

  const keys = normalizeKeys(choice.custom);

  return keys.length >= MIN_CUSTOM_KEYS
    ? { keys, capitals }
    : { keys: fallback.keys, capitals };
}
