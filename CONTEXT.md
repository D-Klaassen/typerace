# Typerace

A multiplayer typing game where people who can already type compete against each other under different rule sets, either Online in a shared Room or on a Shared Keyboard passed between them.

## Language

### Players and rooms

**Online**:
Playing in a Room, where every Player uses their own device.
_Avoid_: Multiplayer, remote, networked

**Shared Keyboard**:
Playing on a single device that the Players pass between them, with no Room and no Host.
_Avoid_: Local, hot-seat, offline, couch play

**Player**:
A person taking part in a game, known only by a nickname of at most 16 characters that is unique within that game, ignoring case. Players have no account, and nothing about them persists after they leave except their nickname and Times on the Leaderboard.
_Avoid_: User, account, participant

**Room**:
A private online space that Players join with a shared code or link, holding up to six Players across consecutive Matches.
_Avoid_: Lobby, server, channel

**Host**:
The Player who created the Room, or took over when that Player left, and who decides its settings and when each Match starts.
_Avoid_: Owner, admin

**Vote**:
A non-Host Player's preference for the next Match's Mode or Key Set preset. Votes are advisory to the Host and reset after every Match.
_Avoid_: Poll, suggestion

**Spectator**:
Someone who joined a Room while a Match was running. They watch, and play from the next Match.
_Avoid_: Viewer, observer

**Match**:
One complete game played under a single Mode, from start until a winner is decided.
_Avoid_: Game, round, race (for the whole thing)

### Rules and presentation

**Mode**:
A set of game rules that decides how Players interact and who wins: Classic Race, Crazy Darts or Time Trial.
_Avoid_: Theme (when talking about rules), game type

**Theme**:
The visual look of the game, separate from its rules. Each Mode has its own fixed look, and Classic Race and Time Trial can also be shown in the Racing Theme.
_Avoid_: Mode, skin

**Racing Theme**:
A Theme for Classic Race and Time Trial in which each Player's typing drives a car down a 3D road. The car is exactly as far along as their typing and its speed shows their current pace; a Typo makes it skid, and three Typos in a row make it crash until the right key is pressed. It changes no rules.
_Avoid_: Racing simulator, racing mode, car mode

**Ghost**:
A see-through car in the Racing Theme that replays how an earlier Turn progressed over time, so the Player can race against it.
_Avoid_: Replay, shadow, ghost rider

**Classic Race**:
A Mode where the fastest Player to finish the text wins. Online, everyone types the same text at once. On a Shared Keyboard, Players take Turns.

**Crazy Darts**:
A Mode where every completed word throws a Dart at an opponent, and the last Player with HP left wins. It can only be played Online.

**Dart**:
The damage a word does in Crazy Darts, thrown the moment its last character is typed. It hits the opponent with the most HP, picked at random on a tie, and never the thrower.

**HP**:
A Player's remaining health in Crazy Darts. It drops when they are hit by a Dart or make a typo, and they are out at zero.
_Avoid_: Health, lives

**Time Trial**:
A Mode where Players take Turns against the clock. After everyone has had one Turn, the slowest Player keeps taking Turns until they beat someone else's time, and that Player becomes the slowest. A Player whose Time Bank runs out is eliminated, and the last Player left wins.
_Avoid_: Elimination, hot-seat race

**Turn**:
One attempt by a single Player to type a text from start to finish while the others wait or watch. Each Turn gets fresh Gibberish of the same length and Key Set.
_Avoid_: Go, attempt, try

**Time Bank**:
The total typing time a Player has across all their Turns in a Time Trial, set by the Host (2 minutes by default). The clock only runs while the Player is typing.
_Avoid_: Timer, time limit

### Text

**Text Source**:
Where a Match's text comes from. Only Gibberish exists for now; real words come later.

**Gibberish**:
Randomly generated nonsense words of 2–7 characters from the Key Set, separated by spaces.
_Avoid_: Random text, nonsense

**Key Set**:
The keys a Match's text may contain: a preset (a Lesson, a row, some fingers, or Easy, Medium and Hard) or a custom choice of keys. Chosen by the Host, or per game on a Shared Keyboard.
_Avoid_: Difficulty, level, key preset

**Lesson**:
One step of the numbered ladder of Key Set presets (76 lessons in 8 stages), modelled on typelesonline.nl: pairs of keys, then the pairs combined.
_Avoid_: Exercise, level

**Capitals**:
An option on top of any Key Set that lets some words start with a capital letter, to practise Shift.
_Avoid_: Uppercase mode

**Typo**:
A wrong keystroke. It does not advance the text; the Player has to press the correct key to continue.
_Avoid_: Mistake, error

### Results

**WPM**:
Words per minute, counting every five correct characters as one word.

**Accuracy**:
The share of all keystrokes that were correct, so Typos lower it.

**Leaderboard**:
The fastest Times ever typed in Time Trial and Classic Race, Online or on a Shared Keyboard. There is one board per Mode and Key Set (its keys plus Capitals), and Classic Race has one per text length too; Crazy Darts has none. A Time Trial puts each Player's best Time on the board, a Classic Race each Player's Time if they finished the text, and a board keeps its top 20. Each entry also keeps how its typing progressed, so the board's fastest can be raced as a Ghost.
_Avoid_: High scores, ranking (that's the results of one Match)

### Learning aids

**Finger Guide**:
An optional pair of hands that highlights the finger, including the pinky for Shift, that should press the next key.
_Avoid_: Hand helper

**On-screen Keyboard**:
An optional keyboard that highlights the next key, and the Shift key to hold with it.
_Avoid_: Keyboard hint, virtual keyboard

**Display**:
A Player's own choice of whether they see the On-screen Keyboard, the Finger Guide, the Racing Theme and the Leaderboard's Ghost while typing. Only the Finger Guide is on by default. It doesn't change anyone else's screen, but the results show everyone which aids each Player had on.
_Avoid_: Settings (those are the Host's)
