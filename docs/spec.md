# Typerace v1 — Spec

A typing game where people who can already type compete against each other, either **Online** in a Room or on a **Shared Keyboard** passed between them. The domain terms used here (Player, Room, Host, Match, Mode, Turn, Time Bank, Dart, HP, Typo, Gibberish, Key Set, Lesson, Finger Guide, …) are defined in [`CONTEXT.md`](../CONTEXT.md). The transport choice is recorded in [ADR 0001](adr/0001-partyserver-durable-objects-for-rooms.md).

Items marked **(spec default)** were not discussed in the grilling session. They are sensible defaults; change them if they're wrong.

## Goals

- Friends and colleagues race each other in short, replayable Matches under three Modes.
- An On-screen Keyboard, a Finger Guide and Coloured Text teach correct finger placement while playing.
- The same game rules run both in the browser (Shared Keyboard) and on the server (Online).
- The interface is English in v1, and is built so more languages can be added without touching components.

## Out of scope for v1

- Accounts, profiles and history. Nothing persists after a Room or game ends, except the Leaderboard.
- Public matchmaking.
- Visual Themes beyond one fixed look per Mode and the [Racing Theme](#racing-theme).
- Keyboard layouts other than US QWERTY (ANSI).
- Phones and tablets. A physical keyboard is required; small or touch-only screens get a "keyboard required" message.
- Any interface language other than English.

## Players and setup

- A nickname is 1–16 characters, trimmed, and unique within the game (ignoring case).
- Each game holds 2–6 Players, except a Classic Race on a Shared Keyboard, which can be played alone.
- **Back to the menu:** every screen except the home page has a control in its top-left corner that goes back to the home page. Outside a game it is "Back to menu". During a game it quits, and quitting a game in progress asks for confirmation first ("Keep playing" cancels). The game ignores keystrokes while the confirmation is open, but a running clock keeps running.

### Shared Keyboard

1. **Setup screen:** enter 1–6 nicknames (one Player to start with, add more as needed), then switch the On-screen Keyboard, the Finger Guide, Coloured Text and the Racing Theme on or off for every Player at once (only the Finger Guide on by default), with a live preview shown from the start in a panel beside the form. Choose the Mode (Classic Race or Hot Seat) and its settings. Hot Seat needs at least two Players, so it's only offered once there are two.
2. **Handover screen** before every Turn: "<Nickname>'s turn — press Space when ready". The Turn's clock starts on the first keystroke.
3. **Results screen,** then "Play again" (same Players and settings) or "Back to setup".
4. **Quitting:** "Quit game" on the handover and Turn screens ends the game for everyone after a confirmation and goes to the home page. Nothing from the game is saved, so it never reaches the Leaderboard.

### Online

- **Creating a Room:** whoever opens "Create Room" becomes Host. The Room gets a 6-character code (uppercase letters with no ambiguous characters such as O and I) **(spec default)** and a link `/room/<CODE>`.
- **Joining:** open the link or enter the code, then choose a nickname.
- **The Room is full** at 6 Players. Anyone else sees a "Room is full" message.
- **Lobby:**
  - Everyone sees the Host's settings live as they change.
  - Non-Host Players can cast one Vote for a Mode and one for a Key Set preset (not a custom set). The Host sees the counts next to each option.
  - Votes are advisory only, and they reset after every Match.
- **Starting:** only the Host can start a Match, with at least 2 Players. A 3-2-1 countdown follows.
- **Joining mid-Match:** the newcomer is a Spectator. They watch, and become a Player when the next Match starts.
- **Leaving or losing the connection:**
  - Classic Race: the Player's progress freezes.
  - Crazy Darts: they count as out (HP 0).
  - Hot Seat: they're eliminated.
  - The Host leaving: the longest-present Player becomes Host.
  - The Room disappears when its last Player leaves.
- **Leave Room:** every screen inside a Room has a "Leave Room" control that closes the connection, which the Room treats as leaving (see above), and goes to the home page. A Player in a countdown or a running Match confirms first, with a message saying what leaving costs in that Mode. In the lobby, as a Spectator and on the results it leaves at once. Before joining (the nickname form, "Room not found") there is "Back to menu" instead.
- **Display:** in the lobby, each Player switches the On-screen Keyboard, the Finger Guide, Coloured Text and the Racing Theme on or off for themselves, with a live preview. There are no switches during a Match. Only the Finger Guide is on by default, and the browser remembers the choice. The Room records each Player's aids (the keyboard, the Finger Guide and Coloured Text, not the Racing Theme) when a Match starts, and the results show them to everyone.
- **After a Match:** Results, then a "Rematch" button for the Host. Everyone goes back to the lobby with the same settings.

## Text

- **Text Source:** Gibberish (the default), Words or Sentences.
  - **Gibberish:** "words" of 2–7 characters from the Key Set, separated by single spaces.
  - **Words:** common words in the chosen Language, lowercase, separated by single spaces, never the same word twice in a row.
  - **Sentences:** everyday sentences in the chosen Language, with capitals and punctuation, never the same sentence twice in a row.
  - **Language:** English (the default) or Dutch. Real text has no accents, so every character is on a US QWERTY keyboard. The interface stays English.
  - Words and Sentences ignore the Key Set and Capitals; the picker hides them and shows a sample instead.
- **Generation is seeded** for every Text Source, so the Room and every client produce identical text from the same seed.
- **Key Set:** the keys Gibberish may contain. Every key in the set is equally likely.
  - **Lessons:** 76 numbered Lessons in 8 stages (home row, top row, top + home, bottom row, bottom + home, columns per finger, numbers, review), modelled on typelesonline.nl: a pair of keys (one per hand), then pairs combined, then everything so far.
  - **Rows:** home, top, bottom, numbers, home + top, home + bottom, all letter rows.
  - **Fingers:** index, middle, ring, pinkies, left hand, right hand.
  - **Classic:** Easy (home row), Medium (`a`–`z`, the default), Hard (letters, digits and `. , ; ' - /`, always with Capitals).
  - **Custom:** keys clicked on the On-screen Keyboard, at least 2 (fewer falls back to all letters).
  - **Capitals:** on top of any Key Set, about 25 % of words start with a capital, to practise Shift.
  - The picker shows a sample of the text. Non-Host Players see the Key Set read-only on a keyboard.
- **Text per game:**
  - In an Online Classic Race, everyone types the same text at once.
  - Every Turn gets fresh text of the same length from the same Text Source.
  - Crazy Darts text is endless in practice: 5,000 characters (about 15 minutes at 70 WPM), generated from a seed by both the Room and the browser so the text never has to be sent along with every update.

## Typing engine (shared by every Mode)

- **The next expected character** is always the first untyped one.
- **A correct key** advances the text by one.
- **A wrong key is a Typo:**
  - It does not advance the text.
  - It shows a red error state until the correct key is pressed.
  - Every wrong keystroke counts as one Typo.
  - The engine also counts the Typos in a row since the last correct key, for the [Racing Theme](#racing-theme)'s crash.
- **Ignored keys:** Backspace, Escape, Tab and modifier keys on their own. They are not keystrokes.
- **Stats per Player per Match** (in Hot Seat, per Turn and summed over the Match):
  - **Time:** from the first keystroke until the last character is typed.
  - **WPM:** (correct characters ÷ 5) ÷ minutes.
  - **Accuracy:** correct keystrokes ÷ all keystrokes.
  - **Typos:** the count.
- **During a Match** the screen shows:
  - The text.
  - Each Player's progress: as bars, or as cars on a circuit in the [Racing Theme](#racing-theme).
  - In Crazy Darts, each Player's HP.
  - In Hot Seat, the active Player's remaining Time Bank and the table of times.
  - WPM is **not** shown while typing.

## Modes

### Classic Race

| Setting     | Options                                             | Default   |
| ----------- | --------------------------------------------------- | --------- |
| Key Set     | Lesson, row, fingers, classic or custom (Gibberish) | Medium    |
| Text Source | Gibberish, Words or Sentences (with a Language)     | Gibberish |
| Text length | Short ~50 / Medium ~100 / Long ~200 characters      | Medium    |

- **Online:**
  - Everyone types the same text at once.
  - Finishing order decides the ranking.
  - The Match ends when every Player has finished or dropped out, or 60 s after the first Player finishes **(spec default)**.
  - Anyone who hasn't finished is ranked by progress.
- **Shared Keyboard:**
  - Each Player takes one Turn.
  - The fastest Time wins. On a tie, the higher Accuracy wins, then whoever went first.
  - **Solo:** a single Player can race on their own. The handover skips "pass the keyboard", and the results say they finished instead of naming a winner. A solo race with Words or Sentences goes on the Leaderboard board of its Text Length.

### Crazy Darts (Online only)

| Setting                        | Default |
| ------------------------------ | ------- |
| Key Set                        | Medium  |
| Starting HP                    | 100     |
| Damage per character of a word | 1       |
| HP lost per Typo               | 2       |

- **Text:** the same endless text for everyone.
- **Throwing:** a Dart is thrown the moment a word's last character is typed. It does damage equal to the word's length × the damage setting.
- **The target** is the opponent with the most HP:
  - It's never the thrower.
  - On a tie, one of the tied opponents is picked at random.
  - The target is chosen when the Dart is thrown, not when it lands.
- **Losing HP:** every Typo costs the typist HP. A Player at 0 HP, whether from Darts or their own Typos, is out and stops typing.
- **Winning:** the last Player with HP left wins. The others are ranked in reverse order of going out.
- **Feedback:** Darts get clear visual feedback, showing who threw at whom and the HP change. Exact visuals are decided during implementation.

### Hot Seat (Online and Shared Keyboard)

| Setting              | Default         |
| -------------------- | --------------- |
| Key Set              | Medium          |
| Turn text length     | ~100 characters |
| Time Bank per Player | 2:00            |

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

- **Every Mode:** final ranking, plus per Player their WPM, Accuracy, Typos and Time, and which aids (On-screen Keyboard, Finger Guide, Coloured Text) they had on.
- **Hot Seat:** also each Player's best Time and number of Turns, and for Words and Sentences whether the best Times reached the Leaderboard, and a link to it.
- **Next step:** Online, the Host gets "Rematch". On a Shared Keyboard, "Play again" and "Back to setup".

## Racing Theme

A Theme for Classic Race and Hot Seat, Online and on a Shared Keyboard (not Crazy Darts). It changes no rules, and nothing about it is in the results.

- **Switching it on:** a Display switch, off by default: Online each Player's own, on a Shared Keyboard one for every Player, like the aids. Online it changes nobody else's screen.
  - **Spectators** see the normal look, unless their browser remembers the Racing Theme being on.
  - **Online Hot Seat:** the Player whose Turn it is and everyone watching each see it if they switched it on.
- **The circuit:** a looping race track seen from above, drawn in plain SVG with no 3D library.
  - One lap for every ~100 characters, rounded, at least one: a Medium text or a Hot Seat Turn is one lap.
  - Every car is exactly as far along as its Player's typing. It glides to each new letter in 90 ms and is never drawn ahead of it.
  - Up to six cars, one lane each, with a name tag. Your own car says "You". A Player's place in the Room or the setup gives their car its colour and lane, the same on every screen and every Turn. A Player who left is faded where they stopped.
- **Layout:**
  - The track view zooms in on your car (or the leader's, for a Spectator) and follows it round, always north up.
  - A small map of the whole circuit in its corner shows everyone as dots, with a box for what the track view shows. The lap count is in the other corner.
  - With more than one car, a race order beside the track shows each car's place and how many letters it is behind the leader (or that it finished, crashed or left). Those who finished come first, in the order the Room timed them, then everyone still typing, furthest first, then those who left. Without a car of its own to follow, the camera follows whoever leads the cars still racing.
  - The text, the On-screen Keyboard and the Finger Guide sit below, as without the Theme.
- **No speed is shown.** The cars' movement is the only sign of pace, so WPM stays hidden while typing.
- **A Typo** makes the car skid for 600 ms, even if the right key comes sooner: it wobbles (three swings of up to about 26°, fading out), drifts a little sideways and leaves tyre marks.
- **Three Typos in a row** crash it:
  - It spins one and a quarter turns over 0.9 s, ending sideways, and slides towards the nearer kerb and the grass beyond it.
  - It stays there until the right key is pressed, with "Crashed! Press the right key to drive on" on your own screen and "Crashed" in the race order.
  - Online, the Room sends every Player's Typos in a row (and when they finished), so others see their cars skid and crash too.
- **Reduced motion** (the computer's setting): no wobble, spin, slide or tyre marks. A crashed car just stops, with a still "⚠ Stop" tag, and the crash notice doesn't pulse.
- **Later:** Ghosts (see `CONTEXT.md`), first from earlier Turns in a Match, then from the Leaderboard.

## Leaderboard

- **What goes on it:** when a Hot Seat Match on Words or Sentences ends, each Player's best Time, under their nickname. Players who never finished a Turn have no Time. Online, only Players still in the Room are on it. A solo Classic Race on a Shared Keyboard with Words or Sentences counts too, on the board of its Text Length.
- **One board per Text Source, Language and Text Length,** as Times only compare on the same kind and length of text: Short, Medium and Long for each of English Words, Dutch Words, English Sentences and Dutch Sentences. A Hot Seat Turn is a Medium text, so Hot Seat Times go on the Medium board. Each board keeps its fastest 20; equal Times rank in the order they were set.
- **No Gibberish:** Gibberish is for practising keys, so it has no board. Its Matches aren't recorded, and their results don't mention the Leaderboard. Boards stored from before stay in storage but are never shown.
- **Stored by length in characters:** boards are stored under their text's length in characters (50, 100 or 200). The Medium boards keep the Times from before boards had a Text Length, which were all on 100 characters. Times from when Turns were 150 characters stay in storage but aren't on any board.
- **Online:** the Room records the Hot Seat Match itself, using the Times it measured on its own clock.
- **Shared Keyboard:** the browser sends the best Times, rounded to whole milliseconds, to the Rooms server with the Text Source, Language and Text Length. These can't be verified, so the server only checks they're plausible (at least 50 ms per character, so 2.5 s for Short, 5 s for Medium and 10 s for Long, at most 10 min, in whole milliseconds, valid nicknames, and a known Text Source, Language and Text Length). A submission without a Text Length is for the Medium board.
- **The page** `/leaderboard`, linked from the home page and from Hot Seat results, has a picker for Words or Sentences, a Language and a Text Length, and shows that board. Its URL names the board, so it can be shared, and the link from the results opens the board the Times went on. A link without a Text Length, from before boards had one, opens the Medium board.
- **Nickname fields** say the nickname is shown on the Leaderboard after a Hot Seat Match or a solo race with Words or Sentences.

## On-screen Keyboard, Finger Guide and Coloured Text

- **Three separate aids,** each switched on or off (per Player Online, for everyone at once on a Shared Keyboard):
  - an On-screen Keyboard (US QWERTY, ANSI), shown below the text,
  - a Finger Guide (a pair of hands), shown below the text,
  - Coloured Text: every character still to type is in its finger's colour. Typed characters stay dimmed, and a Typo still shows red.
- **Each switch** has a short line saying what the aid does.
- **Finger colours:** every finger has its own colour, and each key is tinted in its finger's colour.
- **The next key** is strongly highlighted, along with the finger that should press it.
- **For capitals and shifted symbols,** the Shift key on the **opposite** hand is highlighted too, with that hand's pinky.
- **F and J** show the home-row bump marker.
- **On a Typo,** the guide keeps pointing at the expected key.
- **Finger map:**

| Finger       | Keys                                                 |
| ------------ | ---------------------------------------------------- |
| Left pinky   | `` ` `` `1` `q` `a` `z`, left Shift                  |
| Left ring    | `2` `w` `s` `x`                                      |
| Left middle  | `3` `e` `d` `c`                                      |
| Left index   | `4` `5` `r` `t` `f` `g` `v` `b`                      |
| Right index  | `6` `7` `y` `u` `h` `j` `n` `m`                      |
| Right middle | `8` `i` `k` `,`                                      |
| Right ring   | `9` `o` `l` `.`                                      |
| Right pinky  | `0` `-` `=` `p` `[` `]` `\` `;` `'` `/`, right Shift |
| Thumbs       | Space                                                |

## Dark mode

- **Every page is dark.** There is no light mode to stay in, whatever the device's own setting.
- **The switch:** "Dark mode", in the top-right corner of every page. Switching it off turns the page light, and a car races along the top of the screen, bumps the switch back on, turns around and drives off with its headlights on.
- **The switch is locked** from the moment it's switched off until the car has gone.
- **With reduced motion,** there is no car: dark mode just comes back after a moment.

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
- **The Leaderboard lives in `apps/rooms` too:** a single `Leaderboard` Durable Object stores every board, behind `GET` and `POST /leaderboard` on the Rooms Worker.
- **`apps/rooms` owns Online state:**
  - Clients send every keystroke to the Room, which times it on its own clock when it arrives. Clients' clocks aren't in sync, and this way a client can't fake its times.
  - The Room applies the keystrokes through `packages/game` and decides progress, Typos, Darts, HP, eliminations and the winner.
  - It broadcasts the state to everyone in the Room.
  - The client applies keystrokes locally at once for a responsive feel, and reconciles when the Room's state arrives.
  - The Room is the authority for everything Online, including timing: a Player's Time runs from the Room's start signal to their last character. Typing only unlocks when the Room's "go" arrives, so nobody can start early.
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
- **Tests:** Vitest for `packages/game` (full rule coverage), the Room logic and the web app's pure modules (such as the Racing Theme's circuit and car maths); Playwright for a few end-to-end flows. The flows are: one Shared Keyboard Hot Seat, one Online Classic Race with two browser contexts, one Online Crazy Darts, the Racing Theme on a Shared Keyboard and Online, quitting a Shared Keyboard game, and leaving a Room.
- **Lint and format:** ESLint and Prettier
- **Root scripts:** `lint`, `typecheck`, `test`, `test:e2e`, `format:check`, and `check`, which runs them all.
- **Rule:** every commit and push requires a green `check`.

## Build order

Each step is a vertical slice that is playable or testable when it lands:

1. **Scaffold:** the monorepo, tooling, the `check` script, an empty Next.js app with next-intl, and an empty `packages/game` with Vitest.
2. **Text and typing engine** in `packages/game`: seeded Gibberish per Difficulty (later replaced by Key Sets), Typos and stats.
3. **Hot Seat on a Shared Keyboard:** the setup, handover and results screens, plus Hot Seat rules with the Time Bank and elimination.
4. **Finger Guide:** the keyboard, the hands, the finger colours and Shift handling, with per-Player switches (later split into On-screen Keyboard and Finger Guide, set before the Match with a preview).
5. **Classic Race on a Shared Keyboard.**
6. **Rooms:**
   - The PartyServer Room, create and join by code or link.
   - The Host, the 6-Player cap and the Host handover.
   - Live settings and Votes.
7. **Online Classic Race,** including Spectators (they only exist once a Match can run).
8. **Online Hot Seat** with live watching.
9. **Crazy Darts.**
10. **Deploy:** `scripts/deploy-wizard.sh` walks through logging in to Cloudflare, deploying the Rooms server and creating the Vercel project; then the first deploy.
