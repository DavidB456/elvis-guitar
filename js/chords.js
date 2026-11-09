// Chord shapes for standard tuning. frets: low E → high e, -1 = don't play.
// fingers: 0 = open/none, 1-4 = finger. barre: { fret, from, to } string indexes (0 = low E).
window.CHORDS = {
  // Open major
  "C":     { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "D":     { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  "E":     { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  "G":     { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  "A":     { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  // Open minor
  "Am":    { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  "Em":    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  "Dm":    { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  // Sevenths
  "A7":    { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  "B7":    { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  "C7":    { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  "D7":    { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  "E7":    { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  "G7":    { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  // Beginner-friendly substitutes
  "Bm7":   { frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  "Fmaj7": { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  // Barre chords (the "record version" shapes)
  "F":     { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  "Fm":    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  "Bm":    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 1, to: 5 } },
  "F#m":   { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, from: 0, to: 5 } },
  "F#7":   { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], barre: { fret: 2, from: 0, to: 5 } },
  "Gm":    { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, from: 0, to: 5 } },
  "C#7":   { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], barre: { fret: 4, from: 1, to: 5 } },
};

// Short coaching notes shown under a chord diagram in the starter lessons.
window.CHORD_TIPS = {
  "Em": "Two fingers, all six strings ring. The friendliest chord on the guitar.",
  "E": "Same as Em plus your first finger on the G string, 1st fret.",
  "A": "Three fingers squeezed side by side on the 2nd fret. Skip the low E string.",
  "D": "A little triangle on the top three strings. Strum only the top four.",
  "G": "Big stretch. Aim for the tips of your fingers so the open strings ring.",
  "C": "Fingers walk down like stairs: 3rd, 2nd, 1st fret. Skip the low E.",
  "Am": "Same shape as E, moved over one string. Skip the low E.",
  "B7": "Four fingers. It's the hardest open chord here, so give it extra time.",
  "E7": "An E chord with your third finger lifted off. Instant blues.",
  "A7": "An A chord with the G string left open.",
  "D7": "A flipped D triangle. Strum the top four strings.",
  "G7": "Like G, but the high string moves to the 1st fret with your first finger.",
  "C7": "A C chord with your pinky added on the G string, 3rd fret.",
  "Dm": "A sadder D. Your first finger lands on the 1st fret of the high E.",
  "Bm7": "An easy stand-in for Bm: three fingers, all on the 2nd fret.",
  "Fmaj7": "An easy stand-in for F: no barre, just the top four strings.",
};

// Open-string pitches, low E → high e (Hz, A4 = 440).
window.OPEN_STRINGS = [
  { name: "E", octave: 2, midi: 40 },
  { name: "A", octave: 2, midi: 45 },
  { name: "D", octave: 3, midi: 50 },
  { name: "G", octave: 3, midi: 55 },
  { name: "B", octave: 3, midi: 59 },
  { name: "E", octave: 4, midi: 64 },
];

// Render a chord diagram as an SVG string.
window.chordSVG = function chordSVG(name, opts = {}) {
  const c = window.CHORDS[name];
  if (!c) return `<div class="chord-missing">${name}</div>`;
  const w = 96, h = 118, left = 16, top = 28, gapX = 13, gapY = 18, frets = 5;
  const played = c.frets.filter(f => f > 0);
  const maxF = played.length ? Math.max(...played) : 0;
  const minF = played.length ? Math.min(...played) : 0;
  const base = maxF <= 5 ? 1 : minF; // first fret shown
  const strX = i => left + i * gapX;
  const fretY = f => top + (f - base + 0.5) * gapY;
  let s = `<svg class="chord-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${name} chord diagram">`;
  // nut / frets
  for (let f = 0; f <= frets; f++) {
    const y = top + f * gapY;
    const nut = f === 0 && base === 1;
    s += `<line x1="${strX(0)}" x2="${strX(5)}" y1="${y}" y2="${y}" class="${nut ? "nut" : "fret"}"/>`;
  }
  for (let i = 0; i < 6; i++) {
    s += `<line x1="${strX(i)}" x2="${strX(i)}" y1="${top}" y2="${top + frets * gapY}" class="string"/>`;
  }
  if (base > 1) s += `<text x="${strX(5) + 8}" y="${top + gapY * 0.7}" class="basefret">${base}fr</text>`;
  // open / muted markers
  c.frets.forEach((f, i) => {
    if (f === 0) s += `<circle cx="${strX(i)}" cy="${top - 9}" r="3.6" class="open"/>`;
    if (f === -1) s += `<text x="${strX(i)}" y="${top - 5}" class="mute">×</text>`;
  });
  if (c.barre) {
    const y = fretY(c.barre.fret);
    s += `<rect x="${strX(c.barre.from) - 5}" y="${y - 5.5}" width="${strX(c.barre.to) - strX(c.barre.from) + 10}" height="11" rx="5.5" class="dot"/>`;
  }
  c.frets.forEach((f, i) => {
    if (f > 0) {
      const onBarre = c.barre && f === c.barre.fret && i >= c.barre.from && i <= c.barre.to;
      if (!onBarre) s += `<circle cx="${strX(i)}" cy="${fretY(f)}" r="5.5" class="dot"/>`;
      if (!onBarre || i === c.barre.from) {
        const fg = c.fingers && c.fingers[i];
        if (fg) s += `<text x="${strX(i)}" y="${fretY(f) + 3.3}" class="finger">${fg}</text>`;
      }
    }
  });
  s += `</svg>`;
  return s;
};

window.isBarre = name => !!(window.CHORDS[name] && window.CHORDS[name].barre);
