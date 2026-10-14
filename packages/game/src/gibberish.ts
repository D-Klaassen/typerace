export type Difficulty = "easy" | "medium" | "hard";

export interface GibberishOptions {
  seed: number;
  difficulty: Difficulty;
  minLength: number;
}

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const HOME_ROW = "asdfghjkl;";

const DIGITS = "0123456789";
const PUNCTUATION = ".,;:!?'-";

// Share of words on Hard that get each extra (see docs/spec.md).
const HARD_NUMBER_CHANCE = 0.1;
const HARD_CAPITAL_CHANCE = 0.25;
const HARD_PUNCTUATION_CHANCE = 0.15;

const ALPHABETS: Record<Difficulty, string> = {
  easy: HOME_ROW,
  medium: LOWERCASE,
  hard: LOWERCASE,
};

export function generateGibberish({
  seed,
  difficulty,
  minLength,
}: GibberishOptions): string {
  const random = seededRandom(seed);
  const words: string[] = [];
  let length = 0;

  while (length < minLength) {
    const word =
      difficulty === "hard"
        ? randomHardWord(random)
        : randomWord(random, ALPHABETS[difficulty]);
    words.push(word);
    length += word.length + (words.length > 1 ? 1 : 0);
  }

  return words.join(" ");
}

function randomHardWord(random: () => number): string {
  if (random() < HARD_NUMBER_CHANCE) {
    return randomChars(random, DIGITS, randomInt(random, 2, 4));
  }

  const wordLength = randomInt(random, 2, 7);
  const hasPunctuation = random() < HARD_PUNCTUATION_CHANCE;
  let word = randomChars(
    random,
    LOWERCASE,
    hasPunctuation ? wordLength - 1 : wordLength,
  );

  if (random() < HARD_CAPITAL_CHANCE) {
    word = word.charAt(0).toUpperCase() + word.slice(1);
  }
  if (hasPunctuation) {
    word += randomChars(random, PUNCTUATION, 1);
  }

  return word;
}

function randomWord(random: () => number, alphabet: string): string {
  return randomChars(random, alphabet, randomInt(random, 2, 7));
}

function randomChars(
  random: () => number,
  alphabet: string,
  count: number,
): string {
  let chars = "";

  for (let i = 0; i < count; i++) {
    chars += alphabet[Math.floor(random() * alphabet.length)];
  }

  return chars;
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
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
