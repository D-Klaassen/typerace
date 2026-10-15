# Typerace

A multiplayer typing game where people who can already type compete against each other under different rule sets, either Online in a shared Room or on a Shared Keyboard passed between them.

## Language

### Players and rooms

**Online**:
Playing in a Room, where every Player uses their own device.
_Avoid_: Multiplayer, remote, networked

**Shared Keyboard**:
Playing on a single device, alone or passed between the Players, with no Room and no Host.
_Avoid_: Local, offline, couch play

**Player**:
A person taking part in a game, known only by a nickname of at most 16 characters that is unique within that game, ignoring case. Players have no account, and nothing about them persists after they leave except their nickname and best Time on the Leaderboard.
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
A set of game rules that decides how Players interact and who wins: Classic Race, Crazy Darts or Hot Seat.
_Avoid_: Theme (when talking about rules), game type

**Theme**:
The visual look of the game, separate from its rules. Each Mode has a single fixed look for now.
_Avoid_: Mode, skin

**Classic Race**:
A Mode where the fastest Player to finish the text wins. Online, everyone types the same text at once. On a Shared Keyboard, Players take Turns, and a single Player can race on their own.

**Crazy Darts**:
A Mode where every completed word throws a Dart at an opponent, and the last Player with HP left wins. It can only be played Online.

**Dart**:
The damage a word does in Crazy Darts, thrown the moment its last character is typed. It hits the opponent with the most HP, picked at random on a tie, and never the thrower.

**HP**:
A Player's remaining health in Crazy Darts. It drops when they are hit by a Dart or make a typo, and they are out at zero.
_Avoid_: Health, lives

**Hot Seat**:
A Mode where Players take Turns against the clock. After everyone has had one Turn, the slowest Player keeps taking Turns until they beat someone else's time, and that Player becomes the slowest. A Player whose Time Bank runs out is eliminated, and the last Player left wins. It needs at least two Players.
_Avoid_: Time Trial, elimination

**Turn**:
One attempt by a single Player to type a text from start to finish while the others wait or watch. Each Turn gets fresh text of the same length from the same Text Source.
_Avoid_: Go, attempt, try

**Time Bank**:
The total typing time a Player has across all their Turns in a Hot Seat Match, set by the Host (2 minutes by default). The clock only runs while the Player is typing.
_Avoid_: Timer, time limit

### Text

**Text Source**:
Where a Match's text comes from: Gibberish, Words or Sentences. Chosen by the Host, or per game on a Shared Keyboard.
_Avoid_: Text type, content

**Gibberish**:
Randomly generated nonsense words of 2–7 characters from the Key Set, separated by spaces.
_Avoid_: Random text, nonsense

**Words**:
Real words in a Language, picked at random, lowercase and separated by spaces.

**Sentences**:
Real sentences in a Language, with their capitals and punctuation, one after another.

**Language**:
The language of Words and Sentences: English or Dutch. Only the text changes, not the interface. Real text is written without accents, so every character is on the keyboard.

**Key Set**:
The keys a Match's Gibberish may contain: a preset (a Lesson, a row, some fingers, or Easy, Medium and Hard) or a custom choice of keys. Chosen by the Host, or per game on a Shared Keyboard.
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
The fastest Hot Seat Turns of everyone who ever finished a Hot Seat Match, Online or on a Shared Keyboard, and the Times of solo Classic Races on a Shared Keyboard whose text was a Turn's length, with one board per kind of text: per Key Set (its keys plus Capitals) for Gibberish, and per Text Source and Language for Words and Sentences. Only Times from Turns of today's length count, so older, longer Turns aren't on it. Each Player's best Time from a finished Hot Seat Match goes on the board under their nickname, and a board keeps its top 20.
_Avoid_: High scores, ranking (that's the results of one Match)

### Learning aids

**Finger Guide**:
An optional pair of hands that highlights the finger, including the pinky for Shift, that should press the next key.
_Avoid_: Hand helper

**On-screen Keyboard**:
An optional keyboard that highlights the next key, and the Shift key to hold with it.
_Avoid_: Keyboard hint, virtual keyboard

**Display**:
A Player's own choice of whether they see the On-screen Keyboard and the Finger Guide while typing. The Finger Guide is on by default. It doesn't change anyone else's screen, but the results show everyone which aids each Player had on.
_Avoid_: Settings (those are the Host's)
