/**
 * Text Sources: where a Match's text comes from. Gibberish follows the Key
 * Set; Words and Sentences are real text in a Language, and ignore it.
 */
import { generateGibberish, seededRandom } from "./gibberish";
import { resolveKeySet, type KeySet, type KeySetChoice } from "./key-sets";
import { DUTCH_SENTENCES, DUTCH_WORDS } from "./texts/dutch";
import { ENGLISH_SENTENCES, ENGLISH_WORDS } from "./texts/english";

export type TextSourceKind = "gibberish" | "words" | "sentences";

export const TEXT_SOURCE_KINDS: readonly TextSourceKind[] = [
  "gibberish",
  "words",
  "sentences",
];

/** The Text Sources with real text in a Language. */
export type RealTextKind = Exclude<TextSourceKind, "gibberish">;

export const REAL_TEXT_KINDS: readonly RealTextKind[] = ["words", "sentences"];

export type Language = "en" | "nl";

export const LANGUAGES: readonly Language[] = ["en", "nl"];

/** Everything needed to generate a Match's text. */
export type TextSource =
  | { kind: "gibberish"; keySet: KeySet }
  | { kind: RealTextKind; language: Language };

/** The Host's or the setup screen's choices that decide the text. */
export interface TextChoice {
  textSource: TextSourceKind;
  language: Language;
  keySet: KeySetChoice;
  capitals: boolean;
}

export function resolveTextSource({
  textSource,
  language,
  keySet,
  capitals,
}: TextChoice): TextSource {
  return textSource === "gibberish"
    ? { kind: "gibberish", keySet: resolveKeySet(keySet, capitals) }
    : { kind: textSource, language };
}

const WORDS: Record<Language, readonly string[]> = {
  en: ENGLISH_WORDS,
  nl: DUTCH_WORDS,
};

const SENTENCES: Record<Language, readonly string[]> = {
  en: ENGLISH_SENTENCES,
  nl: DUTCH_SENTENCES,
};

/**
 * Seeded text from the source, stopping at the first word (or, for
 * Sentences, sentence) boundary at or after `minLength`.
 */
export function generateText(
  source: TextSource,
  { seed, minLength }: { seed: number; minLength: number },
): string {
  if (source.kind === "gibberish") {
    return generateGibberish({ seed, keySet: source.keySet, minLength });
  }

  const pool = (source.kind === "words" ? WORDS : SENTENCES)[source.language];
  const random = seededRandom(seed);
  const picked: string[] = [];
  let length = 0;

  while (length < minLength) {
    let next = pool[Math.floor(random() * pool.length)]!;
    // Never the same word or sentence twice in a row.
    if (next === picked.at(-1)) {
      next = pool[(pool.indexOf(next) + 1) % pool.length]!;
    }
    picked.push(next);
    length += next.length + (picked.length > 1 ? 1 : 0);
  }

  return picked.join(" ");
}
