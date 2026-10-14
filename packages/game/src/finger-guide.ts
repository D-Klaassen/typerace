export type Hand = "left" | "right";

export type Finger =
  | `${Hand}-pinky`
  | `${Hand}-ring`
  | `${Hand}-middle`
  | `${Hand}-index`
  /** Space is pressed with either thumb. */
  | "thumbs";

export interface KeyGuide {
  /** The physical US QWERTY key, named by its unshifted character. */
  key: string;
  finger: Finger;
  /** The Shift key to hold, always on the other hand; null when none is needed. */
  shift: "left-shift" | "right-shift" | null;
}

/** Touch-typing finger zones on US QWERTY (ANSI), see docs/spec.md. */
const FINGER_KEYS: Record<Finger, string> = {
  "left-pinky": "`1qaz",
  "left-ring": "2wsx",
  "left-middle": "3edc",
  "left-index": "45rtfgvb",
  "right-index": "67yuhjnm",
  "right-middle": "8ik,",
  "right-ring": "9ol.",
  "right-pinky": "0-=p[]\\;'/",
  thumbs: " ",
};

const FINGER_BY_KEY = new Map<string, Finger>(
  Object.entries(FINGER_KEYS).flatMap(([finger, keys]) =>
    [...keys].map((key) => [key, finger as Finger] as const),
  ),
);

const UNSHIFTED_SYMBOLS = "`1234567890-=[]\\;',./";
const SHIFTED_SYMBOLS = '~!@#$%^&*()_+{}|:"<>?';

/** The unshifted key that produces a Shift character, e.g. "A" → "a", "!" → "1". */
const KEY_BY_SHIFTED_CHAR = new Map<string, string>([
  ...[..."abcdefghijklmnopqrstuvwxyz"].map(
    (key) => [key.toUpperCase(), key] as const,
  ),
  ...[...SHIFTED_SYMBOLS].map(
    (char, index) => [char, UNSHIFTED_SYMBOLS[index]!] as const,
  ),
]);

/** Which key, finger and Shift type `char`; null for characters off the keyboard. */
export function getKeyGuide(char: string): KeyGuide | null {
  const shiftedKey = KEY_BY_SHIFTED_CHAR.get(char);
  const key = shiftedKey ?? char;
  const finger = FINGER_BY_KEY.get(key);
  if (!finger) {
    return null;
  }

  return {
    key,
    finger,
    shift:
      shiftedKey === undefined
        ? null
        : finger.startsWith("left")
          ? "right-shift"
          : "left-shift",
  };
}
