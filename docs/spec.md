# Typerace v1 — Spec

A typing game where people who can already type compete against each other, either **Online** in a Room or on a **Shared Keyboard** passed between them. The domain terms used here (Player, Room, Host, Match, Mode, Turn, Time Bank, Dart, HP, Typo, Gibberish, Difficulty, Finger Guide, …) are defined in [`CONTEXT.md`](../CONTEXT.md). The transport choice is recorded in [ADR 0001](adr/0001-partyserver-durable-objects-for-rooms.md).

Items marked **(spec default)** were not discussed in the grilling session. They are sensible defaults; change them if they're wrong.

## Goals

- Friends and colleagues race each other in short, replayable Matches under three Modes.
- A Finger Guide teaches correct finger placement while playing.
- The same game rules run both in the browser (Shared Keyboard) and on the server (Online).
- The interface is English in v1, and is built so more languages can be added without touching components.

## Out of scope for v1

- Accounts, profiles, history and leaderboards. Nothing persists after a Room or game ends.
- Public matchmaking.
- Real-word Text Sources (Gibberish only).
- Visual Themes beyond one fixed look per Mode.
- Keyboard layouts other than US QWERTY (ANSI).
- Phones and tablets. A physical keyboard is required; small or touch-only screens get a "keyboard required" message.
- Any interface language other than English.

## Players and setup

- A nickname is 1–16 characters, trimmed, and unique within the game (ignoring case).
- Each game holds 2–6 Players.

### Shared Keyboard

1. **Setup screen:** enter 2–6 nicknames, each with its own Finger Guide checkbox (off by default). Choose the Mode (Classic Race or Time Trial) and its settings.
2. **Handover screen** before every Turn: "<Nickname>'s turn — press Space when ready". The Turn's clock starts on the first keystroke.
3. **Results screen,** then "Play again" (same Players and settings) or "Back to setup".

### Online

- **Creating a Room:** whoever opens "Create Room" becomes Host. The Room gets a 6-character code (uppercase letters with no ambiguous characters such as O and I) **(spec default)** and a link `/room/<CODE>`.
- **Joining:** open the link or enter the code, then choose a nickname.
- **The Room is full** at 6 Players. Anyone else sees a "Room is full" message.
- **Lobby:**
  - Everyone sees the Host's settings live as they change.
  - Non-Host Players can cast one Vote for a Mode and one for a Difficulty. The Host sees the counts next to each option.
  - Votes are advisory only, and they reset after every Match.
- **Starting:** only the Host can start a Match, with at least 2 Players. A 3-2-1 countdown follows.
- **Joining mid-Match:** the newcomer is a Spectator. They watch, and become a Player when the next Match starts.
- **Leaving or losing the connection:**
  - Classic Race: the Player's progress freezes.
  - Crazy Darts: they count as out (HP 0).
  - Time Trial: they're eliminated.
  - The Host leaving: the longest-present Player becomes Host.
  - The Room disappears when its last Player leaves.
- **Finger Guide:** each Player switches it on or off for themselves, at any time, including mid-Match. It's off by default. Their browser remembers the choice for the session **(spec default)**.
- **After a Match:** Results, then a "Rematch" button for the Host. Everyone goes back to the lobby with the same settings.

## Text

- **Text Source:** Gibberish only.
- **Gibberish:** "words" of 2–7 characters, separated by single spaces.
- **Generation is seeded,** so the Room and every client produce identical text from the same seed.
- **Difficulty:**
  - **Easy:** `a s d f g h j k l ;`
  - **Medium:** `a`–`z`
  - **Hard:** Medium, plus:
    - Some words start with a capital **(spec default: ~25 % of words)**.
    - Some words are 2–4 digits **(spec default: ~10 % of words)**.
    - Some words end in punctuation from `. , ; : ! ? ' -` **(spec default: ~15 % of words)**.
- **Text per game:**
  - In an Online Classic Race, everyone types the same text at once.
  - Every Turn gets fresh Gibberish of the same length and Difficulty.
  - Crazy Darts text is endless: more is generated ahead of the Players as they type.

## Typing engine (shared by every Mode)

- **The next expected character** is always the first untyped one.
- **A correct key** advances the text by one.
- **A wrong key is a Typo:**
  - It does not advance the text.
  - It shows a red error state until the correct key is pressed.
  - Every wrong keystroke counts as one Typo.
- **Ignored keys:** Backspace, Escape, Tab and modifier keys on their own. They are not keystrokes.
- **Stats per Player per Match** (in Time Trial, per Turn and summed over the Match):
  - **Time:** from the first keystroke until the last character is typed.
  - **WPM:** (correct characters ÷ 5) ÷ minutes.
  - **Accuracy:** correct keystrokes ÷ all keystrokes.
  - **Typos:** the count.
- **During a Match** the screen shows:
  - The text.
  - Each Player's progress.
  - In Crazy Darts, each Player's HP.
  - In Time Trial, the active Player's remaining Time Bank and the table of times.
  - WPM is **not** shown while typing.

## Modes

### Classic Race

| Setting | Options | Default |
|---|---|---|
| Difficulty | Easy / Medium / Hard | Medium |
| Text length | Short ~100 / Medium ~250 / Long ~500 characters | Medium |

- **Online:**
  - Everyone types the same text at once.
  - Finishing order decides the ranking.
  - The Match ends when every Player has finished or dropped out, or 60 s after the first Player finishes **(spec default)**.
  - Anyone who hasn't finished is ranked by progress.
- **Shared Keyboard:**
  - Each Player takes one Turn.
  - The fastest Time wins.

### Crazy Darts (Online only)

| Setting | Default |
|---|---|
| Difficulty | Medium |
| Starting HP | 100 |
| Damage per character of a word | 1 |
| HP lost per Typo | 2 |

- **Text:** the same endless text for everyone.
- **Throwing:** a Dart is thrown the moment a word's last character is typed. It does damage equal to the word's length × the damage setting.
- **The target** is the opponent with the most HP:
  - It's never the thrower.
  - On a tie, one of the tied opponents is picked at random.
  - The target is chosen when the Dart is thrown, not when it lands.
- **Losing HP:** every Typo costs the typist HP. A Player at 0 HP, whether from Darts or their own Typos, is out and stops typing.
- **Winning:** the last Player with HP left wins. The others are ranked in reverse order of going out.
- **Feedback:** Darts get clear visual feedback, showing who threw at whom and the HP change. Exact visuals are decided during implementation.

### Time Trial (Online and Shared Keyboard)

| Setting | Default |
|---|---|
| Difficulty | Medium |
| Turn text length | ~150 characters **(spec default)** |
| Time Bank per Player | 2:00 |

1. **Opening round:** every Player takes one Turn, in join or setup order.
2. **Who goes next:** the slowest Player (highest best Time) takes the next Turn.
   - If their new Time beats another Player's best Time, it becomes their best Time and that other Player is now the slowest.
   - Otherwise they go again.
3. **The Time Bank:**
   - It drains only while its owner is typing (from the first keystroke to the end of the Turn).
   - A Player whose Time Bank hits 0, even mid-Turn, is eliminated immediately. The next slowest remaining Player continues.
   - Everyone keeps whatever is left in their Time Bank.
4. **Winning:** the last Player remaining wins. The others are ranked in reverse order of elimination.
5. **Ties for slowest:** the Player whose best Time was set most recently goes **(spec default)**.
6. **Online only:**
   - The active Player types on their own device, and everyone else watches the keystrokes live.
   - Losing the connection mid-Turn means elimination.

## Results screen

- **Every Mode:** final ranking, plus per Player their WPM, Accuracy, Typos and Time.
- **Time Trial:** also each Player's best Time and number of Turns.
- **Next step:** Online, the Host gets "Rematch". On a Shared Keyboard, "Play again" and "Back to setup".

## Finger Guide

- **Display:** an on-screen US QWERTY (ANSI) keyboard and a pair of hands, shown below the text.
- **Finger colours:** every finger has its own colour, and each key is tinted in its finger's colour.
- **The next key** is strongly highlighted, along with the finger that should press it.
- **For capitals and shifted symbols,** the Shift key on the **opposite** hand is highlighted too, with that hand's pinky.
- **F and J** show the home-row bump marker.
- **On a Typo,** the guide keeps pointing at the expected key.
- **Finger map:**

| Finger | Keys |
|---|---|
| Left pinky | `` ` `` `1` `q` `a` `z`, left Shift |
| Left ring | `2` `w` `s` `x` |
| Left middle | `3` `e` `d` `c` |
| Left index | `4` `5` `r` `t` `f` `g` `v` `b` |
| Right index | `6` `7` `y` `u` `h` `j` `n` `m` |
| Right middle | `8` `i` `k` `,` |
| Right ring | `9` `o` `l` `.` |
| Right pinky | `0` `-` `=` `p` `[` `]` `\` `;` `'` `/`, right Shift |
| Thumbs | Space |

## Architecture

```
apps/web      Next.js (App Router) on Vercel — all screens, Shared Keyboard play, Room client
apps/rooms    PartyServer on Cloudflare — one Durable Object per Room
packages/game Pure TypeScript game rules — no React, no network, no timers of its own
```

- **`packages/game`** is the heart of the system, built as deep modules with small interfaces:
  - The seeded Gibberish generator.
  - The typing engine.
  - A rules module for each Mode.
  - Time is passed in rather than read from the clock, so everything is deterministic and testable.
  - Both apps use it.
- **`apps/rooms` owns Online state:**
  - Clients send every keystroke (and the time it happened, as the client measured it) to the Room.
  - The Room applies the keystrokes through `packages/game` and decides progress, Typos, Darts, HP, eliminations and the winner.
  - It broadcasts the state to everyone in the Room.
  - The client applies keystrokes locally at once for a responsive feel, and reconciles when the Room's state arrives.
  - The Room is the authority for anything that crosses Players. Each Player's own typing timing comes from their keystroke timestamps.
- **Messages:**
  - From clients to the Room: join, update settings (Host only), Vote, start (Host only), keystroke, ready for Turn, rematch (Host only).
  - From the Room to clients: full state snapshots, plus events such as Dart thrown, Player eliminated and Match ended.
  - Message schemas are validated on both sides.
- **Shared Keyboard** runs fully in the browser on `packages/game`, with no network.
- **i18n:** next-intl from the first screen. No hard-coded user-facing strings in components; English messages only in v1.

## Stack and quality checks

- **Package manager:** pnpm workspaces
- **Language:** TypeScript (strict)
- **Web app:** Next.js (App Router), Tailwind CSS and shadcn/ui
- **Rooms:** PartyServer with Wrangler
- **Translations:** next-intl
- **Tests:** Vitest for `packages/game` (full rule coverage) and the Room logic; Playwright for a few end-to-end flows. The flows are: one Shared Keyboard Time Trial, one Online Classic Race with two browser contexts, and one Online Crazy Darts.
- **Lint and format:** ESLint and Prettier
- **Root scripts:** `lint`, `typecheck`, `test`, `test:e2e`, `format:check`, and `check`, which runs them all.
- **Rule:** every commit and push requires a green `check`.

## Build order

Each step is a vertical slice that is playable or testable when it lands:

1. **Scaffold:** the monorepo, tooling, the `check` script, an empty Next.js app with next-intl, and an empty `packages/game` with Vitest.
2. **Text and typing engine** in `packages/game`: seeded Gibberish per Difficulty, Typos and stats.
3. **Time Trial on a Shared Keyboard:** the setup, handover and results screens, plus Time Trial rules with the Time Bank and elimination.
4. **Finger Guide:** the keyboard, the hands, the finger colours and Shift handling, with the per-Player toggle.
5. **Classic Race on a Shared Keyboard.**
6. **Rooms:**
   - The PartyServer Room, create and join by code or link.
   - The Host, the 6-Player cap, Spectators and the Host handover.
   - Live settings and Votes.
7. **Online Classic Race.**
8. **Online Time Trial** with live watching.
9. **Crazy Darts.**
10. **Deploy:** a `/wizard` script to link Vercel and Cloudflare, then the first deploy.
