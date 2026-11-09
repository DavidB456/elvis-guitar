// Strum and picking patterns. Each slot is an eighth note (12/8 uses eighths too).
// D = down strum, U = up strum, B = bass note (root), A = alternate bass,
// 1/2/3 = pluck that string of the chord (1 = high e), "-" = rest/let ring.
window.STRUMS = {
  downs:      { name: "Steady down-strums", meter: "4/4", slots: ["D","-","D","-","D","-","D","-"], how: "One down-strum on every beat. Count 1, 2, 3, 4 out loud." },
  boomchick:  { name: "Boom-chick", meter: "4/4", slots: ["B","-","D","-","A","-","D","-"], how: "Pick the bass note, strum, pick the other bass note, strum. This is the Sun Records acoustic sound." },
  boomshuffle:{ name: "Boom-chick shuffle", meter: "4/4", swing: true, slots: ["B","-","D","U","A","-","D","U"], how: "Boom-chick with a quick up-strum after each strum. Swing it: long-short, long-short." },
  shuffle:    { name: "Rock and roll shuffle", meter: "4/4", swing: true, slots: ["D","-","D","U","D","U","D","U"], how: "Keep your hand moving down and up the whole time. Swing the eighths: long-short." },
  folk:       { name: "Down, down-up, up-down-up", meter: "4/4", slots: ["D","-","D","U","-","U","D","U"], how: "The most useful strum in pop music. Your hand keeps swinging even when it misses the strings." },
  slowboom:   { name: "Slow boom-chick", meter: "4/4", slots: ["B","-","D","U","A","-","D","U"], how: "Bass note, strum, bass note, strum, with gentle up-strums in between. Straight, not swung." },
  stop:       { name: "Stop-time hit", meter: "4/4", slots: ["D","-","-","-","-","-","-","-"], how: "One hit on beat 1, then let it ring (or mute it) while the singer fills the gap." },
  waltz:      { name: "Waltz: bass, strum, strum", meter: "3/4", slots: ["B","-","D","-","D","-"], how: "Count 1, 2, 3. Bass note on 1, strums on 2 and 3." },
  waltzdowns: { name: "Waltz down-strums", meter: "3/4", slots: ["D","-","D","-","D","-"], how: "Three down-strums per bar. Lean on the first one." },
  sway12:     { name: "12/8 sway", meter: "12/8", slots: ["D","-","-","D","-","U","D","-","-","D","-","U"], how: "Count 1-2-3 4-5-6 twice per bar. Down on 1 and 4, light up-strum on 6." },
  pick12:     { name: "12/8 fingerpicking", meter: "12/8", slots: ["B","3","2","1","2","3","A","3","2","1","2","3"], how: "Thumb on the bass, then fingers on the G, B and high E strings and back. Rolls like a lullaby." },
  pick44:     { name: "Folk fingerpicking", meter: "4/4", slots: ["B","3","2","3","A","3","2","1"], how: "Thumb alternates bass notes, fingers fill in. Slow and even." },
};

window.METERS = {
  "4/4":  { beats: 4, slotsPerBeat: 2 },
  "3/4":  { beats: 3, slotsPerBeat: 2 },
  "12/8": { beats: 4, slotsPerBeat: 3 },
};

// Songs, easiest first. Bars use "|" between bars; two chords in one bar split it evenly.
// "easy" overrides apply when the app's "Beginner version" switch is on.
// Lyrics are only included for songs whose words are in the public domain.
window.SONGS = [
  {
    id: "amazing-grace", ownKey: true,
    title: "Amazing Grace",
    year: 1971, era: "Gospel", recorded: "He Touched Me (1972)",
    level: 1,
    key: "G", capo: 0, meter: "3/4", tempo: { start: 60, target: 80 },
    strum: "waltzdowns", strumRecord: "waltz",
    blurb: "Three chords and a slow waltz. The best first song for the app — and the words are free to use, so they're all here.",
    note: "Played in G, an easy key. Elvis's recording may sit in a different key; match it with a capo if you want to sing along with him.",
    sections: [
      { name: "Verse", bars: "G | G7 | C | G | G | G | D | D7 | G | G7 | C | G | Em | D | G | G", easy: "G | G | C | G | G | G | D | D | G | G | C | G | G | D | G | G" },
    ],
    form: ["Verse", "Verse", "Verse", "Verse"],
    tips: [
      "Start each line with a single strum and let it ring while you sing the word.",
      "The beginner version drops G7 and Em, so it's just G, C and D.",
      "Count \"1, 2, 3\" — every bar has three beats.",
    ],
    lick: { title: "Bass walk from G to C", tab:
`e|-----------|-----------|
B|-----------|---1-------|
G|-----------|---0-------|
D|-----------|---2-------|
A|-------0-2-|---3-------|
E|---3-------|-----------|
     G   walk    C`, how: "Pick the low G, then walk up A open, A 2nd fret, and land on the C chord. Use it whenever G moves to C." },
    lyrics: `[Verse 1]
A-[G]mazing [G7]grace, how [C]sweet the [G]sound
That saved a wretch like [D]me! [D7]
I [G]once was [G7]lost, but [C]now am [G]found;
Was [Em]blind, but [D]now I [G]see.

[Verse 2]
'Twas [G]grace that [G7]taught my [C]heart to [G]fear,
And grace my fears re-[D]lieved; [D7]
How [G]precious [G7]did that [C]grace ap-[G]pear
The [Em]hour I [D]first be-[G]lieved.

[Verse 3]
Through [G]many [G7]dangers, [C]toils and [G]snares,
I have already [D]come; [D7]
'Tis [G]grace hath [G7]brought me [C]safe thus [G]far,
And [Em]grace will [D]lead me [G]home.

[Verse 4]
When [G]we've been [G7]there ten [C]thousand [G]years,
Bright shining as the [D]sun, [D7]
We've [G]no less [G7]days to [C]sing God's [G]praise
Than [Em]when we'd [D]first be-[G]gun.`,
    lyricsSource: "John Newton, 1779 (verse 4 is a later traditional verse). Public domain.",
    ytQuery: "Elvis Presley Amazing Grace",
  },
  {
    id: "thats-all-right",
    title: "That's All Right",
    year: 1954, era: "50s rockers", recorded: "Sun Records single (1954)",
    level: 1,
    key: "A", capo: 0, meter: "4/4", tempo: { start: 80, target: 160 },
    strum: "boomchick", strumRecord: "boomshuffle",
    blurb: "Elvis's first single. Just A, D and E with a boom-chick strum — the sound that started rock and roll.",
    note: "The record is in A, so no capo. Bar counts are approximate: follow the recording and change when Elvis does.",
    sections: [
      { name: "Verse", bars: "A | A | A | A | A | A | A7 | A7 | D | D | D | D | E | E | A | A", easy: "A | A | A | A | A | A | A | A | D | D | D | D | E | E | A | A" },
      { name: "Guitar solo", bars: "A | A | A | A | A | A | A7 | A7 | D | D | D | D | E | E | A | A", easy: "A | A | A | A | A | A | A | A | D | D | D | D | E | E | A | A" },
    ],
    form: ["Verse", "Verse", "Guitar solo", "Verse", "Verse"],
    tips: [
      "Boom-chick: thumb or pick hits the bass string, then a short strum of the top strings.",
      "For A, the bass notes are the A string then the low E string. For D: D string then A string. For E: low E then A.",
      "Get it clean at 80 bpm before speeding up. The record is fast.",
    ],
    lick: { title: "Boogie shuffle in A", tab:
`e|-------------------------|
B|-------------------------|
G|-------------------------|
D|--2--2--4--4--2--2--4--4-|
A|--0--0--0--0--0--0--0--0-|
E|-------------------------|`, how: "Two-string rhythm used all over 50s rock. First finger on fret 2, stretch the third finger to fret 4. Works on D (move it to the D and G strings) and E (low E and A strings) too." },
    ytQuery: "Elvis Presley That's All Right 1954",
  },
  {
    id: "heartbreak-hotel",
    title: "Heartbreak Hotel",
    year: 1956, era: "50s rockers", recorded: "RCA single (1956)",
    level: 1,
    key: "E", capo: 0, meter: "4/4", tempo: { start: 60, target: 80 },
    strum: "downs", strumRecord: "stop",
    blurb: "Elvis's first number one. A slow eight-bar blues in E, so there's lots of time between chord changes.",
    note: "Played in E, the key of the record. The beginner version swaps the stop-time hits for steady strums.",
    sections: [
      { name: "Verse", bars: "E | E | E | E7 | A7 | A7 | B7 | E", easy: "E | E | E | E | A7 | A7 | B7 | E" },
      { name: "Guitar solo", bars: "E | E | E | E7 | A7 | A7 | B7 | E", easy: "E | E | E | E | A7 | A7 | B7 | E" },
    ],
    form: ["Verse", "Verse", "Verse", "Guitar solo", "Verse", "Verse"],
    tips: [
      "B7 is the hard one. Practice E ↔ B7 changes in the Starter section first.",
      "On the record, the first half of each verse is stop-time: one hit, then silence while Elvis sings.",
      "Bluesy songs love the 7th chords — E7 just before A7 pulls you into the change.",
    ],
    lick: { title: "Slow blues turnaround in E", tab:
`e|-------------------0-|
B|-------------------0-|
G|-------------------1-|
D|---------------------|
A|-------------2-------|
E|---0-3-2-0-------0---|
                   B7 E`, how: "A walking bass line for the end of a verse. Pick each note slowly, then strum the E chord on the last beat." },
    ytQuery: "Elvis Presley Heartbreak Hotel 1956",
  },
  {
    id: "in-the-ghetto",
    title: "In the Ghetto",
    year: 1969, era: "Late 60s & 70s", recorded: "From Elvis in Memphis (1969)",
    level: 2,
    key: "B♭", capo: 3, meter: "4/4", tempo: { start: 60, target: 86 },
    strum: "folk", strumRecord: "pick44",
    blurb: "A storytelling ballad that loops the same four chords. With a capo on fret 3, it's all open shapes.",
    note: "The record is in B♭. Put a capo on fret 3 and play G-family shapes to sound in the same key. The beginner version uses Bm7 so you can skip the Bm barre.",
    sections: [
      { name: "Verse", bars: "G | G | Bm | Bm | C | D | G | G", easy: "G | G | Bm7 | Bm7 | C | D | G | G" },
      { name: "Bridge", bars: "C | D | C | G | C | D | G | G" },
    ],
    form: ["Verse", "Verse", "Bridge", "Verse", "Verse", "Bridge", "Verse"],
    tips: [
      "Capo goes on fret 3, just behind the fret wire. All chord shapes are relative to the capo.",
      "The record is fingerpicked. Strum first, try the fingerpicking pattern once the changes feel easy.",
      "C to D is the key move — keep your first finger close to the strings.",
    ],
    lick: { title: "Arpeggio pattern for G", tab:
`e|-------3-------3---|
B|-----0---0---0---0-|
G|---0-------0-------|
D|-------------------|
A|-------------------|
E|-3-------3---------|`, how: "Hold a G chord and pick one string at a time: bass, G, B, high E, B. Use the same order on every chord." },
    ytQuery: "Elvis Presley In the Ghetto",
  },
  {
    id: "santa-lucia", ownKey: true,
    title: "Santa Lucia",
    year: 1964, era: "Ballads", recorded: "Viva Las Vegas sessions (1963)",
    level: 2,
    key: "G", capo: 0, meter: "3/4", tempo: { start: 66, target: 96 },
    strum: "waltzdowns", strumRecord: "waltz",
    blurb: "The Neapolitan song Elvis sang in Viva Las Vegas. A gentle waltz with G, C and D7 — and the Italian words are free to use.",
    note: "A simple traditional harmonization in G. Elvis's recording may be in a different key.",
    sections: [
      { name: "Verse", bars: "G | G | D7 | D7 | D7 | D7 | G | G" },
      { name: "Refrain", bars: "C | C | G | G | D7 | D7 | G | G" },
    ],
    form: ["Verse", "Refrain", "Refrain", "Verse", "Refrain", "Refrain"],
    tips: [
      "Three beats per bar. Lean on beat 1 so it sways like a boat.",
      "G to D7 is a small move: keep your hand relaxed and lift all fingers together.",
    ],
    lick: { title: "Waltz bass pattern", tab:
`e|-----3---3-|-----2---2-|
B|-----0---0-|-----1---1-|
G|-----0---0-|-----2---2-|
D|-----------|-0---------|
A|-----------|-----------|
E|-3---------|-----------|
   G           D7`, how: "Bass note on 1, chord on 2 and 3. For D7 the bass is the open D string." },
    lyrics: `[Verse 1]
Sul [G]mare luccica
L'astro d'ar-[D7]gento.
Placida è l'onda,
Prospero è il [G]vento.

[Refrain]
Ve-[C]nite all'agile
Bar-[G]chetta mia!
Santa Lu-[D7]cia! Santa Lu-[G]cia!

[Verse 2]
Con [G]questo zeffiro
Così so-[D7]ave,
Oh, com'è bello
Star sulla [G]nave!

[Refrain]
Su [C]passeggeri,
Ve-[G]nite via!
Santa Lu-[D7]cia! Santa Lu-[G]cia!`,
    lyricsSource: "Traditional Neapolitan song, Teodoro Cottrau, 1849. Public domain.",
    ytQuery: "Elvis Presley Santa Lucia Viva Las Vegas",
  },
  {
    id: "blue-suede-shoes",
    title: "Blue Suede Shoes",
    year: 1956, era: "50s rockers", recorded: "Elvis Presley (1956)",
    level: 2,
    key: "A", capo: 0, meter: "4/4", tempo: { start: 80, target: 180 },
    strum: "boomchick", strumRecord: "shuffle",
    blurb: "A stop-time verse, then a 12-bar blues chorus. Learn this and you've learned half of 50s rock and roll.",
    note: "In A, the key of the record. The beginner version uses plain A, D and E instead of the 7th chords.",
    sections: [
      { name: "Stop-time verse", bars: "A | A | A | A | A | A | A7 | A7 | D7 | D7 | A | A | E7 | D7 | A | A", easy: "A | A | A | A | A | A | A | A | D | D | A | A | E | D | A | A", strum: "stop", easyStrum: "downs" },
      { name: "12-bar chorus", bars: "A | A | A | A | D7 | D7 | A | A | E7 | D7 | A | A", easy: "A | A | A | A | D | D | A | A | E | D | A | A" },
    ],
    form: ["Stop-time verse", "12-bar chorus", "Stop-time verse", "12-bar chorus", "12-bar chorus"],
    tips: [
      "Stop-time: hit the chord once, mute it with your palm, wait. The silence is part of the song.",
      "The 12-bar chorus is the classic blues pattern. Learn it once and you'll hear it everywhere.",
      "E7 → D7 → A at the end is the \"turnaround\" that pulls you back home.",
    ],
    lick: { title: "Boogie shuffle in A", tab:
`e|-------------------------|
B|-------------------------|
G|-------------------------|
D|--2--2--4--4--2--2--4--4-|
A|--0--0--0--0--0--0--0--0-|
E|-------------------------|`, how: "Play this over the A bars of the chorus instead of strumming. Swing it." },
    ytQuery: "Elvis Presley Blue Suede Shoes 1956",
  },
  {
    id: "hound-dog",
    title: "Hound Dog",
    year: 1956, era: "50s rockers", recorded: "RCA single (1956)",
    level: 2,
    key: "C", capo: 5, meter: "4/4", tempo: { start: 80, target: 170 },
    strum: "boomchick", strumRecord: "shuffle",
    blurb: "A fast 12-bar blues. With a capo on fret 5, you play easy G, C and D shapes and sound in the record's key.",
    note: "The record is in C (C7, F7 and G7). Capo 5 turns G, C and D shapes into C, F and G.",
    sections: [
      { name: "12-bar verse", bars: "G | G | G | G | C | C | G | G | D | C | G | G", easy: "G | G | G | G | C | C | G | G | D | C | G | G" },
    ],
    form: ["12-bar verse", "12-bar verse", "12-bar verse", "12-bar verse", "12-bar verse", "12-bar verse"],
    tips: [
      "Same 12-bar blues as Blue Suede Shoes, just in a different key.",
      "The record is very fast. A clean 100 bpm sounds better than a messy 170.",
      "Want the record's sound without a capo? Learn C7, F (barre) and G7 later.",
    ],
    lick: { title: "Shuffle in G (capo 5)", tab:
`e|-------------------------|
B|-------------------------|
G|-------------------------|
D|-------------------------|
A|--5--5--7--7--5--5--7--7-|
E|--3--3--3--3--3--3--3--3-|`, how: "The same boogie idea, moved to the low E and A strings for G (frets are counted from the capo). First finger on fret 3, third finger on fret 5, pinky stretches to fret 7. It's a big stretch, so build up to it." },
    ytQuery: "Elvis Presley Hound Dog 1956",
  },
  {
    id: "love-me-tender",
    title: "Love Me Tender",
    year: 1956, era: "Ballads", recorded: "Love Me Tender film single (1956)",
    level: 2,
    key: "D", capo: 0, meter: "4/4", tempo: { start: 60, target: 72 },
    strum: "slowboom", strumRecord: "slowboom",
    blurb: "The original is just Elvis and one acoustic guitar. Slow, gentle, and in D.",
    note: "In D, the key of the record. The beginner chorus skips F#7, Bm and Gm (barre chords) and keeps the same feel.",
    sections: [
      { name: "Verse", bars: "D | E7 | A7 | D | D | E7 | A7 | D" },
      { name: "Chorus", bars: "D F#7 | Bm D7 | G Gm | D | B7 | E7 | A7 | D", easy: "D | D7 | G | D | B7 | E7 | A7 | D" },
    ],
    form: ["Verse", "Chorus", "Verse", "Chorus", "Verse", "Chorus"],
    tips: [
      "Two chords in one bar means two beats each.",
      "The bass notes for D are the D string then the A string; for A7 it's A then low E.",
      "This song is about touch. Strum softly and let the chords ring.",
    ],
    lick: { title: "D to D7 move", tab:
`e|---2-----2---|
B|---3-----1---|
G|---2-----2---|
D|-0---0-------|
A|-------------|
E|-------------|
     D     D7`, how: "Use it to move from D to D7 at the start of the chorus. Only the B string changes: 3rd fret down to 1st." },
    ytQuery: "Elvis Presley Love Me Tender 1956",
  },
  {
    id: "burning-love",
    title: "Burning Love",
    year: 1972, era: "Late 60s & 70s", recorded: "RCA single (1972)",
    level: 2,
    key: "D", capo: 0, meter: "4/4", tempo: { start: 80, target: 140 },
    strum: "folk", strumRecord: "shuffle",
    blurb: "His last big rocker. D, G and A drive it; Bm shows up in the chorus.",
    note: "In D, the key of the record. The beginner version uses Bm7 instead of the Bm barre.",
    sections: [
      { name: "Verse", bars: "D | G A | D | D | D | G A | D | D | D | G A | D | D" },
      { name: "Chorus", bars: "Bm A | G | Bm A | G | Bm A | G | A | D", easy: "Bm7 A | G | Bm7 A | G | Bm7 A | G | A | D" },
      { name: "Tag", bars: "G | D | G | D" },
    ],
    form: ["Verse", "Verse", "Chorus", "Tag", "Verse", "Chorus", "Tag", "Tag"],
    tips: [
      "G to A in one bar is fast. Practice that change on its own.",
      "Drive the strum with your wrist, not your whole arm.",
      "The beginner Bm7 keeps your first finger free — three fingers on fret 2.",
    ],
    lick: { title: "D – Dsus4 flick", tab:
`e|---2---3---2---|
B|---3---3---3---|
G|---2---2---2---|
D|---0---0---0---|
A|---------------|
E|---------------|
     D  Dsus4 D`, how: "While holding D, add your pinky on the high E 3rd fret, then lift it. Instant 70s rock flavor." },
    ytQuery: "Elvis Presley Burning Love",
  },
  {
    id: "jailhouse-rock",
    title: "Jailhouse Rock",
    year: 1957, era: "50s rockers", recorded: "Jailhouse Rock film single (1957)",
    level: 3,
    key: "E", capo: 0, meter: "4/4", tempo: { start: 80, target: 168 },
    strum: "downs", strumRecord: "stop",
    blurb: "Famous for its stop-time hits. Verses sit on E; the chorus moves to A7 and B7.",
    note: "Learned here in E. The record is pitched around a half-step higher (E♭), so it'll sound slightly off if you play along. Tune down a half-step to match it exactly.",
    sections: [
      { name: "Stop-time verse", bars: "E | E | E | E | E | E | E | E", strum: "stop", easyStrum: "downs" },
      { name: "Chorus", bars: "A7 | A7 | E | E | B7 | B7 | E | E" },
    ],
    form: ["Stop-time verse", "Chorus", "Stop-time verse", "Chorus", "Stop-time verse", "Chorus", "Chorus"],
    tips: [
      "Stop-time: two sharp hits, then silence. Mute the strings with your strumming palm.",
      "The record's hit slides up into the chord from one fret below. Try the lick once the hits are steady.",
      "B7 again — if it's slow, practice the E ↔ B7 drill.",
    ],
    lick: { title: "Half-step slide hit", tab:
`e|---------------|
B|---------------|
G|---------------|
D|---8-9---8-9---|
A|---6-7---6-7---|
E|---------------|`, how: "A two-string power chord: hit it at frets 6/8, then slide or re-hit one fret higher at 7/9 (that's E). Same rhythm as the stop-time hits." },
    ytQuery: "Elvis Presley Jailhouse Rock 1957",
  },
  {
    id: "suspicious-minds",
    title: "Suspicious Minds",
    year: 1969, era: "Late 60s & 70s", recorded: "RCA single (1969)",
    level: 3,
    key: "G", capo: 0, meter: "4/4", tempo: { start: 80, target: 120 },
    strum: "folk", strumRecord: "folk",
    blurb: "Late-60s Elvis in Memphis. Verse and chorus are built from G, C, D, Bm and Em.",
    note: "In G, the key of the record. The slow 6/8 bridge near the end is left out here; learn the verse and chorus first.",
    sections: [
      { name: "Intro", bars: "G C | G C" },
      { name: "Verse", bars: "G | G | C | C | D | C | G | G" },
      { name: "Chorus", bars: "C | G | Bm | C D | Em | Bm | C | G D", easy: "C | G | Bm7 | C D | Em | Bm7 | C | G D" },
    ],
    form: ["Intro", "Verse", "Verse", "Chorus", "Verse", "Verse", "Chorus", "Verse"],
    tips: [
      "G and C share the same ring finger position on many voicings — keep it as an anchor.",
      "Chorus moves fast between C and D. Practice the change slowly with the metronome.",
      "The record fades out repeating the verse. Loop the verse at the end.",
    ],
    lick: { title: "G to C anchor change", tab:
`e|---3-------0---|
B|---3-------1---|
G|---0-------0---|
D|---0-------2---|
A|---2-------3---|
E|---3-----------|
     G       C`, how: "Play G with your ring finger on the B string, 3rd fret (320033). Moving to C, that finger slides to the A string 3rd fret." },
    ytQuery: "Elvis Presley Suspicious Minds",
  },
  {
    id: "cant-help-falling",
    title: "Can't Help Falling in Love",
    year: 1961, era: "Ballads", recorded: "Blue Hawaii (1961)",
    level: 3,
    key: "D", capo: 2, meter: "12/8", tempo: { start: 50, target: 64 },
    strum: "sway12", strumRecord: "pick12",
    blurb: "The ballad Elvis closed his shows with. Rolling 12/8 feel, played with C shapes and a capo on fret 2.",
    note: "The 1961 record is in D. Capo 2 with C-family shapes sounds in D. The beginner version uses Fmaj7 instead of the F barre.",
    sections: [
      { name: "Verse", bars: "C Em | Am | F C | G | F G | Am F | C G | C", easy: "C Em | Am | Fmaj7 C | G | Fmaj7 G | Am Fmaj7 | C G | C" },
      { name: "Bridge", bars: "Em B7 | Em B7 | Em B7 | Em A7 | Dm | G" },
    ],
    form: ["Verse", "Verse", "Bridge", "Verse", "Bridge", "Verse"],
    tips: [
      "12/8 means four big beats per bar, each split into three: 1-2-3 4-5-6 7-8-9 10-11-12.",
      "Let each chord ring. This song is about space.",
      "Bridge: Em ↔ B7 is the main move. Keep your second finger on the A string 2nd fret for both.",
    ],
    lick: { title: "12/8 fingerpicking in C", tab:
`e|-------0-------------0-------|
B|-----1---1---------1---1-----|
G|---0-------0-----0-------0---|
D|-----------------------------|
A|-3-------------3-------------|
E|-----------------------------|`, how: "Thumb on the bass, then G, B, high E, B, G. Two rolls per bar. Use the same pattern on every chord." },
    ytQuery: "Elvis Presley Can't Help Falling in Love Blue Hawaii",
  },
  {
    id: "lonesome-tonight", ownKey: true,
    title: "Are You Lonesome Tonight?",
    year: 1960, era: "Ballads", recorded: "RCA single (1960)",
    level: 3,
    key: "C", capo: 0, meter: "3/4", tempo: { start: 60, target: 94 },
    strum: "waltzdowns", strumRecord: "waltz",
    blurb: "A 1926 waltz Elvis made a number one in 1960, with a spoken section in the middle. Lots of chords, but all open.",
    note: "Shown in C, a common guitar key for this song. Check it against the record and use a capo if you want to match it.",
    sections: [
      { name: "Intro", bars: "Dm | G7 | C | G7" },
      { name: "Part A", bars: "C | Em | Am | Am | C | C7 | F | F | G | G | G7 | G7 | C | C | G7 | G7" },
      { name: "Part B", bars: "C | C7 | F | F | D7 | D7 | G7 | G7 | F | F | C | A7 | Dm | G7 | C | G7", easy: "C | C7 | Fmaj7 | Fmaj7 | D7 | D7 | G7 | G7 | Fmaj7 | Fmaj7 | C | A7 | Dm | G7 | C | G7" },
    ],
    form: ["Intro", "Part A", "Part B", "Part A", "Part B"],
    tips: [
      "The spoken section uses the same chords. Keep the waltz going quietly underneath.",
      "The beginner version uses Fmaj7 where the F barre would go. Part A has a full F; skip to Fmaj7 there too if you need to.",
      "Use this chart as a study version and trust your ear against the record.",
    ],
    lick: { title: "Waltz bass for C and G7", tab:
`e|-----0---0-|-----1---1-|
B|-----1---1-|-----0---0-|
G|-----0---0-|-----0---0-|
D|-----------|-----------|
A|-3---------|-----------|
E|-----------|-3---------|
   C           G7`, how: "Bass note on beat 1, top strings on 2 and 3." },
    ytQuery: "Elvis Presley Are You Lonesome Tonight",
  },
  {
    id: "danny-boy", ownKey: true,
    title: "Danny Boy",
    year: 1976, era: "Ballads", recorded: "From Elvis Presley Boulevard (1976)",
    level: 3,
    key: "C", capo: 0, meter: "4/4", tempo: { start: 56, target: 72 },
    strum: "slowboom", strumRecord: "pick44",
    blurb: "The old Irish air Elvis recorded at Graceland in 1976. Slow and wide-ranging, and the words are free to use.",
    note: "A simple harmonization in C. The beginner version uses Fmaj7 instead of the F barre. Elvis's recording is in a different key.",
    sections: [
      { name: "First half", bars: "C | C7 | F | F | C | Am | D7 | G7 | C | C7 | F | F | C | G7 | C | C", easy: "C | C7 | Fmaj7 | Fmaj7 | C | Am | D7 | G7 | C | C7 | Fmaj7 | Fmaj7 | C | G7 | C | C" },
      { name: "Second half", bars: "C | F | C | C | Am | Dm | G7 | G7 | C | C7 | F | F | C | G7 | C | C", easy: "C | Fmaj7 | C | C | Am | Dm | G7 | G7 | C | C7 | Fmaj7 | Fmaj7 | C | G7 | C | C" },
    ],
    form: ["First half", "Second half", "First half", "Second half"],
    tips: [
      "Take it slow. The melody climbs high in the second half; let the guitar stay soft.",
      "C → C7 is just adding your pinky. That pinky pulls you toward F.",
    ],
    lick: { title: "Walk-down from C to Am", tab:
`e|---------------0-|
B|---------------1-|
G|---------------2-|
D|---------------2-|
A|---3---2---0---0-|
E|-----------------|
     C   C/B Am`, how: "Pick the bass notes C, B, then A as you move from C to Am. Hold the top of the C chord while you walk." },
    lyrics: `[Verse 1]
Oh Danny [C]boy, the [C7]pipes, the pipes are [F]calling
From glen to [C]glen, and [Am]down the mountain [D7]side. [G7]
The summer's [C]gone, and [C7]all the roses [F]falling,
It's you, it's [C]you must [G7]go and I must [C]bide.

But [C]come ye back when [F]summer's in the [C]meadow,
Or [Am]when the valley's [Dm]hushed and white with [G7]snow,
'Tis [C]I'll be here in [C7]sunshine or in [F]shadow,
Oh Danny [C]boy, oh Danny [G7]boy, I love you [C]so!

[Verse 2]
But when ye [C]come, and [C7]all the flowers are [F]dying,
If I am [C]dead, as [Am]dead I well may [D7]be, [G7]
Ye'll come and [C]find the [C7]place where I am [F]lying,
And kneel and [C]say an [G7]Ave there for [C]me.

And [C]I shall hear, though [F]soft you tread a-[C]bove me,
And [Am]all my grave will [Dm]warmer, sweeter [G7]be,
For [C]you will bend and [C7]tell me that you [F]love me,
And I shall [C]sleep in peace un-[G7]til you come to [C]me!`,
    lyricsSource: "Frederic Weatherly, 1913, to the traditional \"Londonderry Air\". Public domain in the US.",
    ytQuery: "Elvis Presley Danny Boy 1976",
  },
];

// Starter lessons for a brand-new player, in order.
window.LESSONS = [
  {
    id: "tune",
    title: "Tune up",
    minutes: 5,
    body: `<p>Every practice session starts here. An out-of-tune guitar makes correct chords sound wrong, which is the fastest way to get discouraged.</p>
<p>Open the tuner, allow the microphone, and pluck one string at a time. Turn the tuning peg slowly: the needle tells you whether to tighten (pitch up) or loosen (pitch down). When it lights gold, move to the next string.</p>
<p>Standard tuning from the thickest string to the thinnest is <strong>E A D G B E</strong>. A memory trick: <em>Eddie Ate Dynamite, Good Bye Eddie.</em></p>`,
    action: { label: "Open the tuner", href: "#/tuner" },
  },
  {
    id: "hold",
    title: "Hold the guitar and the pick",
    minutes: 10,
    body: `<p>Sit up straight with the guitar's waist on your right leg (left leg if you play left-handed). The neck points slightly up.</p>
<p>Pinch the pick between the pad of your thumb and the side of your first finger, with only a little tip sticking out. Grip it loosely — tight hands make stiff strums.</p>
<p>For your fretting hand, press with your fingertips, just behind the fret wire (not on top of it). Your thumb rests behind the neck, roughly behind your middle finger.</p>
<p><strong>Try it:</strong> mute all strings with your fretting hand resting lightly on them, then strum down four times per click with the metronome at 60.</p>`,
    metronome: 60,
  },
  {
    id: "first-chords",
    title: "Your first four chords",
    minutes: 20,
    body: `<p>Em, E, A and D cover a surprising amount of Elvis. Learn them in this order. For each one: place your fingers, strum slowly, then pick each string one at a time to find any that buzz or are muffled.</p>
<p>A buzz usually means you're pressing too far from the fret or not hard enough. A dead string usually means another finger is touching it — arch your fingers more.</p>`,
    chords: ["Em", "E", "A", "D"],
  },
  {
    id: "changes",
    title: "One-minute chord changes",
    minutes: 10,
    body: `<p>Chord changes are what separate strumming a chord from playing a song. Pick a pair, start the timer, and switch back and forth as many times as you can in one minute, strumming once each time. Count your changes and save your score.</p>
<p>Do two or three pairs a day. When a pair passes 40 changes, it's ready for songs.</p>`,
    drill: true,
  },
  {
    id: "more-chords",
    title: "G, C and the 7th chords",
    minutes: 20,
    body: `<p>G and C open up the gospel songs and ballads. A7, B7, D7 and E7 give the 50s rockers their bluesy sound. B7 is the hardest one here — four fingers — so don't worry if it takes a week.</p>`,
    chords: ["G", "C", "A7", "D7", "E7", "B7"],
  },
  {
    id: "boom-chick",
    title: "Boom-chick: the Sun Records sound",
    minutes: 15,
    body: `<p>Early Elvis records lean on an acoustic guitar playing \"boom-chick\": a single bass note, then a short strum of the higher strings, over and over. It's what makes <em>That's All Right</em> sound like 1954.</p>
<p>Hold an A chord. Pick the A string (boom), strum the top four strings (chick), pick the low E string (boom), strum again (chick). Then try it on D (D string, then A string) and E (low E, then A string).</p>
<p>Listen to the pattern in the player below, then play along at 70.</p>`,
    strumDemo: { strum: "boomchick", chord: "A", tempo: 70 },
  },
  {
    id: "twelve-bar",
    title: "The 12-bar blues",
    minutes: 15,
    body: `<p>Blue Suede Shoes, Hound Dog and countless other 50s songs use the same 12-bar pattern. In the key of A it goes:</p>
<pre class="bars-pre">A  | A  | A  | A
D  | D  | A  | A
E  | D  | A  | A</pre>
<p>Play it with steady down-strums. Then try the boom-chick strum. Once it's comfortable, you already know the shape of a dozen Elvis songs.</p>`,
    practiceBars: { bars: "A | A | A | A | D | D | A | A | E | D | A | A", strum: "downs", tempo: 70, meter: "4/4" },
  },
  {
    id: "three-four",
    title: "Waltz time and the ballads",
    minutes: 10,
    body: `<p>Not everything is in four. Amazing Grace, Santa Lucia and Are You Lonesome Tonight count in three: <strong>1</strong>, 2, 3, <strong>1</strong>, 2, 3. Bass note on 1, strums on 2 and 3.</p>
<p>Can't Help Falling in Love uses 12/8: four slow beats, each split into three. It feels like a gentle rocking chair.</p>`,
    strumDemo: { strum: "waltz", chord: "G", tempo: 80 },
  },
  {
    id: "capo",
    title: "What a capo does",
    minutes: 5,
    body: `<p>A capo clamps across all six strings and acts like a new nut. Everything you play moves up in pitch, but your chord shapes stay the same.</p>
<p>That's how you can play Hound Dog with easy G, C and D shapes and still sound like the record: with a capo on fret 5, a G shape sounds as C.</p>
<p>Clamp it just behind the fret, not on top of it, and retune quickly after putting it on — the tuner works with a capo on.</p>`,
  },
];

window.DRILL_PAIRS = [
  ["Em", "E"], ["A", "D"], ["E", "A"], ["D", "G"], ["G", "C"], ["C", "Am"],
  ["E", "B7"], ["A7", "D7"], ["G", "D"], ["C", "G7"], ["D", "A7"], ["Em", "B7"],
];
