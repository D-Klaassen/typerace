import type { KeySet } from "./key-sets";

export interface GibberishOptions {
  seed: number;
  /** Which keys the text may contain, and whether letters may be capitals. */
  keySet: KeySet;
  minLength: number;
}

/** Share of words that start with a capital when Capitals is on (see docs/spec.md). */
const CAPITAL_CHANCE = 0.25;

/**
 * Random "words" of 2–7 characters from the Key Set, separated by spaces,
 * stopping at the first word boundary at or after `minLength`.
 */
export function generateGibberish({
  seed,
  keySet,
  minLength,
}: GibberishOptions): string {
  const random = seededRandom(seed);
  const words: string[] = [];
  let length = 0;

  while (length < minLength) {
    const word = randomWord(random, keySet);
    words.push(word);
    length += word.length + (words.length > 1 ? 1 : 0);
  }

  return words.join(" ");
}

function randomWord(random: () => number, { keys, capitals }: KeySet): string {
  const wordLength = 2 + Math.floor(random() * 6);
  let word = "";

  for (let i = 0; i < wordLength; i++) {
    word += keys[Math.floor(random() * keys.length)];
  }

  if (capitals && /^[a-z]/.test(word) && random() < CAPITAL_CHANCE) {
    word = word.charAt(0).toUpperCase() + word.slice(1);
  }

  return word;
}

// mulberry32: small, fast and good enough for game text.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
