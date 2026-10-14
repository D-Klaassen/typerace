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
A person taking part in a game, known only by a nickname of at most 16 characters that is unique within that game, ignoring case. Players have no account and nothing about them persists after they leave.
_Avoid_: User, account, participant

**Room**:
A private online space that Players join with a shared code or link, holding up to six Players across consecutive Matches.
_Avoid_: Lobby, server, channel

**Host**:
The Player who created the Room, or took over when that Player left, and who decides its settings and when each Match starts.
_Avoid_: Owner, admin

**Vote**:
A non-Host Player's preference for the next Match's Mode or Difficulty. Votes are advisory to the Host and reset after every Match.
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
The visual look of the game, separate from its rules. Each Mode has a single fixed look for now.
_Avoid_: Mode, skin

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
One attempt by a single Player to type a text from start to finish while the others wait or watch. Each Turn gets fresh Gibberish of the same length and Difficulty.
_Avoid_: Go, attempt, try

**Time Bank**:
The total typing time a Player has across all their Turns in a Time Trial, set by the Host (2 minutes by default). The clock only runs while the Player is typing.
_Avoid_: Timer, time limit

### Text

**Text Source**:
Where a Match's text comes from. Only Gibberish exists for now; real words come later.

**Gibberish**:
Randomly generated nonsense words of 2–7 characters, separated by spaces.
_Avoid_: Random text, nonsense

**Difficulty**:
Which characters the text may contain: Easy (home row only), Medium (all lowercase letters) or Hard (adding capitals, digits and punctuation).
_Avoid_: Level

**Typo**:
A wrong keystroke. It does not advance the text; the Player has to press the correct key to continue.
_Avoid_: Mistake, error

### Results

**WPM**:
Words per minute, counting every five correct characters as one word.

**Accuracy**:
The share of all keystrokes that were correct, so Typos lower it.

### Learning aids

**Finger Guide**:
An optional on-screen keyboard and pair of hands that highlights the next key and the finger, including which Shift, that should press it.
_Avoid_: Hand helper, keyboard hint
