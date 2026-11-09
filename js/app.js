(function () {
  "use strict";
  const { CHORDS, SONGS, LESSONS, STRUMS, METERS, DRILL_PAIRS, AudioKit } = window;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NOTE_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

  // ---------- Saved progress (this device only) ----------
  const KEY = "elvis-guitar-v1";
  const store = (() => {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    s.songs = s.songs || {};
    s.lessons = s.lessons || {};
    s.drills = s.drills || {};
    s.log = s.log || {};
    s.settings = Object.assign({ a4: 440, click: true, guitar: true }, s.settings || {});
    return s;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  function songState(id) {
    if (!store.songs[id]) store.songs[id] = { status: "new", seconds: 0, easy: true, lyrics: "", notes: "" };
    return store.songs[id];
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  function logPractice(songId, seconds) {
    if (seconds < 10) return;
    const s = Math.round(seconds);
    store.log[today()] = (store.log[today()] || 0) + s;
    if (songId) {
      const st = songState(songId);
      st.seconds = (st.seconds || 0) + s;
      if (st.status === "new") st.status = "learning";
    }
    save();
  }
  function streak() {
    let n = 0;
    const d = new Date();
    if (!store.log[today()]) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!store.log[k]) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function weekMinutes() {
    let total = 0;
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      total += store.log[k] || 0;
      d.setDate(d.getDate() - 1);
    }
    return Math.round(total / 60);
  }

  // ---------- Shared helpers ----------
  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && "wakeLock" in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request("screen");
      if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }
  const ICON = {
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`,
    stop: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>`,
    speaker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>`,
  };
  const levelDots = n => `<span class="level" aria-label="Level ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  const STATUS = { new: "Not started", learning: "Learning", getting: "Getting it", nailed: "Nailed it" };
  const statusPill = st => st && st !== "new" ? `<span class="status-pill status-${st}">${STATUS[st]}</span>` : "";

  function parseBars(str) {
    const out = [];
    str.split("|").map(b => b.trim()).filter(Boolean).forEach(b => {
      if (b === "%") out.push(out[out.length - 1] || []);
      else out.push(b.split(/\s+/));
    });
    return out;
  }
  const isChordName = s => /^[A-G][#b♭]?(m|maj7|m7|7|sus4|sus2|dim|aug|6|9|add9)*(\/[A-G][#b]?)?$/.test(s);
  function chordSpan(name) { return `<span class="ch${window.isBarre(name) ? " barre" : ""}">${esc(name)}</span>`; }

  // Current version (beginner vs record) of a song.
  function songVersion(song) {
    const st = songState(song.id);
    const easy = st.easy !== false;
    const sections = song.sections.map(sec => ({
      name: sec.name,
      bars: parseBars(easy && sec.easy ? sec.easy : sec.bars),
      strum: easy ? (sec.easyStrum || sec.strum || song.strum) : (sec.strum || song.strumRecord || song.strum),
    }));
    const chords = [];
    sections.forEach(sec => sec.bars.flat().forEach(c => { if (!chords.includes(c)) chords.push(c); }));
    return { easy, sections, chords };
  }
  function recordChords(song) {
    const set = [];
    song.sections.forEach(sec => parseBars(sec.bars).flat().forEach(c => { if (!set.includes(c)) set.push(c); }));
    return set;
  }

  // Stop anything playing or listening when the view changes.
  let activeSeq = null, activeTuner = null, activeTimer = null, seqMeta = null;
  function stopAll() {
    if (activeSeq) { activeSeq.stop(); activeSeq = null; }
    if (activeTuner) { activeTuner.stop(); activeTuner = null; }
    if (activeTimer) { clearInterval(activeTimer); activeTimer = null; }
    keepAwake(false);
  }

  // ---------- Router ----------
  const view = $("#view");
  function route() {
    stopAll();
    const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
    const [page, id, tab] = parts;
    const navPage = ["tuner", "basics", "songs"].includes(page) ? page : "home";
    $$(".nav a").forEach(a => { if (a.dataset.page === navPage) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (page === "tuner") renderTuner();
    else if (page === "basics" && id) renderLesson(id);
    else if (page === "basics") renderLessons();
    else if (page === "songs" && id) renderSong(id, tab || "play");
    else if (page === "songs") renderSongs();
    else renderHome();
    window.scrollTo(0, 0);
    const h = $("h1", view);
    if (h) document.title = `${h.textContent} — Elvis Guitar`;
  }
  window.addEventListener("hashchange", route);

  // ---------- Home ----------
  function nextSong() {
    return SONGS.find(s => songState(s.id).status === "learning" || songState(s.id).status === "getting")
      || SONGS.find(s => songState(s.id).status !== "nailed") || SONGS[0];
  }
  function renderHome() {
    const song = nextSong();
    const v = songVersion(song);
    const doneLessons = LESSONS.filter(l => store.lessons[l.id]).length;
    const nailed = SONGS.filter(s => songState(s.id).status === "nailed").length;
    view.innerHTML = `
      <section class="poster">
        <div class="tonight">Up next</div>
        <h1 class="display">${esc(song.title)}</h1>
        <p class="billing">${esc(song.blurb)}</p>
        <div class="chord-strip" aria-label="Chords in this song">
          ${v.chords.map(c => `<figure>${window.chordSVG(c)}<figcaption>${esc(c)}</figcaption></figure>`).join("")}
        </div>
        <div class="row">
          <a class="btn primary" href="#/songs/${song.id}">Practice ${esc(song.title)}</a>
          <a class="btn" href="#/tuner">Tune up first</a>
        </div>
      </section>
      <section>
        <div class="stats">
          <div><strong>${streak()}</strong><span>${streak() === 1 ? "day" : "days"} in a row</span></div>
          <div><strong>${weekMinutes()}</strong><span>minutes this week</span></div>
          <div><strong>${nailed}/${SONGS.length}</strong><span>songs nailed</span></div>
        </div>
      </section>
      <section>
        <h2>Starter path</h2>
        <p class="muted">${doneLessons === LESSONS.length ? "You've finished the starter path. Keep the chord-change drill in your warm-up." : `${doneLessons} of ${LESSONS.length} done. Work through these alongside your first songs.`}</p>
        <ol class="path">
          ${LESSONS.map(l => `<li class="${store.lessons[l.id] ? "done" : ""}"><a href="#/basics/${l.id}">${esc(l.title)}</a><span class="min">${l.minutes} min</span></li>`).join("")}
        </ol>
      </section>`;
  }

  // ---------- Songs list ----------
  let eraFilter = "All";
  function renderSongs() {
    const eras = ["All", "50s rockers", "Ballads", "Late 60s & 70s", "Gospel"];
    const list = SONGS.filter(s => eraFilter === "All" || s.era === eraFilter);
    view.innerHTML = `
      <h1 class="display">Songs</h1>
      <p class="lede">Easiest first. Every song has a beginner version with open chords, plus the record version when you're ready.</p>
      <div class="filters" role="group" aria-label="Filter by era">
        ${eras.map(e => `<button class="chip" aria-pressed="${e === eraFilter}" data-era="${esc(e)}">${esc(e)}</button>`).join("")}
      </div>
      <ul class="songlist">
        ${list.map(s => {
          const st = songState(s.id);
          return `<li><a href="#/songs/${s.id}">
            <span class="t">${esc(s.title)}</span>
            <span class="lv">${levelDots(s.level)}<br>${statusPill(st.status)}</span>
            <span class="m">${s.year}, key of ${esc(s.key)}${s.capo ? `, capo ${s.capo}` : ""}${s.lyrics ? ", lyrics included" : ""}</span>
          </a></li>`;
        }).join("")}
      </ul>`;
    $$(".chip", view).forEach(b => b.addEventListener("click", () => { eraFilter = b.dataset.era; renderSongs(); }));
  }

  // ---------- Song page ----------
  function renderSong(id, tab) {
    const song = SONGS.find(s => s.id === id);
    if (!song) { view.innerHTML = `<div class="empty">That song isn't in the list. <a href="#/songs">Go to songs</a></div>`; return; }
    const st = songState(id);
    const v = songVersion(song);
    const meter = METERS[song.meter];
    const idx = SONGS.indexOf(song);
    const tabs = [["play", "Play along"], ["chords", "Chords"], ["lyrics", "Lyrics"], ["lick", "Practice lick"], ["notes", "Progress"]];
    view.innerHTML = `
      <div class="song-top">
        <label class="sr-only" for="song-switch">Switch song</label>
        <select id="song-switch">${SONGS.map(s => `<option value="${s.id}" ${s.id === id ? "selected" : ""}>${esc(s.title)}</option>`).join("")}</select>
        <div class="row">
          <a class="btn quiet small" href="#/songs/${SONGS[(idx - 1 + SONGS.length) % SONGS.length].id}/${tab}" aria-label="Previous song">Prev</a>
          <a class="btn quiet small" href="#/songs/${SONGS[(idx + 1) % SONGS.length].id}/${tab}" aria-label="Next song">Next</a>
        </div>
      </div>
      <header class="song-head">
        <h1 class="display">${esc(song.title)}</h1>
        <div class="rec">${esc(song.recorded)}</div>
        <dl class="facts">
          <div><dt>${song.ownKey ? "Played in" : "Record key"}</dt><dd>${esc(song.key)}</dd></div>
          <div><dt>Capo</dt><dd>${song.capo ? `Fret ${song.capo}` : "None"}</dd></div>
          <div><dt>Time</dt><dd>${esc(song.meter)}</dd></div>
          <div><dt>Record tempo</dt><dd>≈${song.tempo.target}</dd></div>
          <div><dt>Level</dt><dd>${levelDots(song.level)}</dd></div>
        </dl>
        <div class="version-row">
          <label class="switch"><input type="checkbox" id="easy" ${v.easy ? "checked" : ""}> Beginner version</label>
          <span class="muted">${v.easy ? "Open chords and simpler strums." : "Closer to the record, barre chords included."}</span>
        </div>
        <p class="callout">${esc(song.note)}</p>
      </header>
      <nav class="tabs" aria-label="Song sections">
        ${tabs.map(([k, label]) => `<a href="#/songs/${id}/${k}" ${k === tab ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
      <div id="tab"></div>`;
    $("#song-switch").addEventListener("change", e => { location.hash = `#/songs/${e.target.value}/${tab}`; });
    $("#easy").addEventListener("change", e => { st.easy = e.target.checked; save(); renderSong(id, tab); });
    const pane = $("#tab");
    if (tab === "chords") songChords(pane, song, v);
    else if (tab === "lyrics") songLyrics(pane, song, v);
    else if (tab === "lick") songLick(pane, song);
    else if (tab === "notes") songNotes(pane, song);
    else songPlay(pane, song, v, meter);
  }

  function strumStrip(strumId, meterName) {
    const p = STRUMS[strumId];
    const m = METERS[meterName];
    const counts = [];
    for (let b = 0; b < m.beats; b++) {
      if (m.slotsPerBeat === 2) counts.push(String(b + 1), "&");
      else counts.push(String(b + 1), "+", "a");
    }
    const glyph = s => ({ D: "↓", U: "↑", B: "B", A: "b", "-": "·" }[s] || s);
    return `<div class="strum" data-strum="${strumId}">${p.slots.map((s, i) =>
      `<div class="${s === "-" ? "rest" : ""}" data-slot="${i}"><span class="sym">${glyph(s)}</span><span class="cnt">${counts[i] || ""}</span></div>`).join("")}</div>`;
  }
  const STRUM_LEGEND = `↓ down-strum, ↑ up-strum, B bass note, b other bass note, 1–3 pluck that string (1 is the thin high E).`;

  function songPlay(pane, song, v, meter) {
    const st = songState(song.id);
    // Flatten the form into bars.
    const flat = [];
    song.form.forEach((name, fi) => {
      const sec = v.sections.find(s => s.name === name);
      if (!sec) return;
      sec.bars.forEach((bar, bi) => flat.push({ chords: bar, sec: sec.name, strum: sec.strum, fi, bi }));
    });
    const tempo = st.tempo || song.tempo.start;
    const firstStrum = v.sections[0].strum;
    pane.innerHTML = `
      <h2>Song form</h2>
      <ol class="form-seq" aria-label="Song form, in order">
        ${song.form.map((name, i) => `<li><button data-fi="${i}"><b>${i + 1}</b>${esc(name)}</button></li>`).join("")}
      </ol>
      ${v.sections.map(sec => `
        <div class="section-block" data-sec="${esc(sec.name)}">
          <h3>${esc(sec.name)} <small>${sec.bars.length} bars, ${esc(STRUMS[sec.strum].name.toLowerCase())}</small></h3>
          <div class="bars">
            ${sec.bars.map((bar, bi) => `<button class="bar" data-sec="${esc(sec.name)}" data-bi="${bi}" aria-label="Bar ${bi + 1}: ${esc(bar.join(" then "))}">
              <span class="num">${bi + 1}</span>${bar.map(chordSpan).join("")}</button>`).join("")}
          </div>
        </div>`).join("")}
      <h2 id="strum-title">Strum: ${esc(STRUMS[firstStrum].name)}</h2>
      <p id="strum-how">${esc(STRUMS[firstStrum].how)}</p>
      <div id="strum-wrap">${strumStrip(firstStrum, song.meter)}</div>
      <p class="legend">${STRUM_LEGEND} Pink chords are barre chords.</p>
      <div class="player" role="region" aria-label="Play-along controls">
        <button class="play" id="play" aria-label="Play along">${ICON.play}</button>
        <div class="tempo">
          <label for="tempo">Tempo</label>
          <input type="range" id="tempo" min="40" max="${song.tempo.target + 20}" value="${tempo}">
          <output for="tempo" id="tempo-out">${tempo} bpm</output>
        </div>
        <div class="opts">
          <label class="switch"><input type="checkbox" id="opt-guitar" ${store.settings.guitar ? "checked" : ""}> Backing guitar</label>
          <label class="switch"><input type="checkbox" id="opt-click" ${store.settings.click ? "checked" : ""}> Click</label>
          <label class="switch"><input type="checkbox" id="opt-loop"> Loop</label>
          <label class="sr-only" for="opt-part">Play which part</label>
          <select id="opt-part" style="min-height:36px;padding:4px 10px">
            <option value="">Whole song</option>
            ${v.sections.map(s => `<option value="${esc(s.name)}">${esc(s.name)} only</option>`).join("")}
          </select>
        </div>
      </div>`;

    const playBtn = $("#play"), tempoIn = $("#tempo"), tempoOut = $("#tempo-out");
    let shownStrum = firstStrum;
    function showStrum(id) {
      if (id === shownStrum) return;
      shownStrum = id;
      $("#strum-title").textContent = `Strum: ${STRUMS[id].name}`;
      $("#strum-how").textContent = STRUMS[id].how;
      $("#strum-wrap").innerHTML = strumStrip(id, song.meter);
    }
    function clearHighlight() {
      $$(".bar.now", pane).forEach(b => b.classList.remove("now"));
      $$(".form-seq .now", pane).forEach(b => b.classList.remove("now"));
      $$(".strum .on", pane).forEach(b => b.classList.remove("on"));
    }
    function setPlaying(on) {
      playBtn.innerHTML = on ? ICON.stop : ICON.play;
      playBtn.setAttribute("aria-label", on ? "Stop" : "Play along");
      keepAwake(on);
    }
    function start(fromFlat = 0) {
      stopAll();
      const part = $("#opt-part").value;
      let bars = flat;
      if (part) {
        const sec = v.sections.find(s => s.name === part);
        const fi = song.form.indexOf(part);
        bars = sec.bars.map((chords, bi) => ({ chords, sec: part, strum: sec.strum, fi, bi }));
      }
      const seqStart = part ? 0 : fromFlat;
      let lastBar = -2;
      const seq = new AudioKit.Sequencer({
        bars: bars.map(b => b.chords),
        slotsFor: i => STRUMS[bars[i].strum].slots,
        tempo: Number(tempoIn.value),
        beats: meter.beats, slotsPerBeat: meter.slotsPerBeat,
        swing: !!STRUMS[bars[0].strum].swing,
        capo: song.capo,
        guitar: $("#opt-guitar").checked, click: $("#opt-click").checked,
        loop: $("#opt-loop").checked, countIn: true,
        onSlot: (bi, slot) => {
          if (bi !== lastBar) {
            clearHighlight();
            lastBar = bi;
            if (bi >= 0) {
              const b = bars[bi];
              const el = pane.querySelector(`.bar[data-sec="${CSS.escape(b.sec)}"][data-bi="${b.bi}"]`);
              if (el) { el.classList.add("now"); el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
              const fb = pane.querySelector(`.form-seq button[data-fi="${b.fi}"]`);
              if (fb) fb.classList.add("now");
              showStrum(b.strum);
              seq.o.swing = !!STRUMS[b.strum].swing;
            }
          }
          $$(".strum .on", pane).forEach(x => x.classList.remove("on"));
          if (bi >= 0) { const s = pane.querySelector(`.strum [data-slot="${slot}"]`); if (s) s.classList.add("on"); }
        },
        onStop: () => {
          logPractice(song.id, seq.elapsedSeconds());
          clearHighlight(); setPlaying(false);
          if (activeSeq === seq) activeSeq = null;
        },
      });
      activeSeq = seq;
      seq.start(seqStart);
      setPlaying(true);
    }
    playBtn.addEventListener("click", () => { if (activeSeq) stopAll(); else start(0); });
    tempoIn.addEventListener("input", () => {
      tempoOut.textContent = `${tempoIn.value} bpm`;
      st.tempo = Number(tempoIn.value); save();
      if (activeSeq) activeSeq.o.tempo = Number(tempoIn.value);
    });
    $("#opt-guitar").addEventListener("change", e => { store.settings.guitar = e.target.checked; save(); if (activeSeq) activeSeq.o.guitar = e.target.checked; });
    $("#opt-click").addEventListener("change", e => { store.settings.click = e.target.checked; save(); if (activeSeq) activeSeq.o.click = e.target.checked; });
    $("#opt-loop").addEventListener("change", e => { if (activeSeq) activeSeq.o.loop = e.target.checked; });
    $("#opt-part").addEventListener("change", () => { if (activeSeq) start(0); });
    $$(".form-seq button", pane).forEach(b => b.addEventListener("click", () => {
      $("#opt-part").value = "";
      start(flat.findIndex(x => x.fi === Number(b.dataset.fi)));
    }));
    $$(".bar", pane).forEach(b => b.addEventListener("click", () => {
      if (activeSeq) {
        $("#opt-part").value = "";
        start(flat.findIndex(x => x.sec === b.dataset.sec && x.bi === Number(b.dataset.bi)));
      } else {
        const chords = flat.find(x => x.sec === b.dataset.sec && x.bi === Number(b.dataset.bi)).chords;
        AudioKit.strumNow(chords[0], song.capo);
      }
    }));
  }

  function chordGrid(names, capo = 0, withTips = false) {
    return `<div class="chord-grid">${names.map(n => `
      <div class="chord-card">
        <button data-chord="${esc(n)}" aria-label="Play ${esc(n)} chord">${window.chordSVG(n)}<div class="name">${esc(n)}</div></button>
        ${withTips && window.CHORD_TIPS[n] ? `<div class="hint">${esc(window.CHORD_TIPS[n])}</div>` : `<div class="hint">Tap to hear</div>`}
      </div>`).join("")}</div>`;
  }
  function wireChordGrid(root, capo = 0) {
    $$("[data-chord]", root).forEach(b => b.addEventListener("click", () => AudioKit.strumNow(b.dataset.chord, capo)));
  }

  function songChords(pane, song, v) {
    const extra = v.easy ? recordChords(song).filter(c => !v.chords.includes(c)) : [];
    pane.innerHTML = `
      <h2>${v.easy ? "Beginner version chords" : "Record version chords"}</h2>
      ${song.capo ? `<p class="muted">Capo on fret ${song.capo}. Diagrams show the shapes; fret numbers count from the capo.</p>` : ""}
      ${chordGrid(v.chords, song.capo, true)}
      ${extra.length ? `<section><h2>The record version adds</h2><p class="muted">Turn off Beginner version to practice with these.</p>${chordGrid(extra, song.capo)}</section>` : ""}`;
    wireChordGrid(pane, song.capo);
  }

  // Chord-over-lyrics renderer: "[G]word" marks where a chord lands.
  function renderChordText(text, subst = {}) {
    const stanzas = text.replace(/\r/g, "").split(/\n\s*\n/);
    return stanzas.map(st => {
      const lines = st.split("\n");
      return `<div class="stanza">${lines.map(line => {
        const tag = line.trim().match(/^\[([^\]]+)\]$/);
        if (tag && !isChordName(tag[1].trim())) return `<div class="tag">${esc(tag[1])}</div>`;
        const segs = [];
        let cur = { c: "", w: "" };
        line.split(/(\[[^\]]+\])/).forEach(p => {
          const m = p.match(/^\[([^\]]+)\]$/);
          if (m) { if (cur.c || cur.w) segs.push(cur); cur = { c: m[1], w: "" }; }
          else cur.w += p;
        });
        if (cur.c || cur.w) segs.push(cur);
        return `<div class="line">${segs.map(s => `<span class="seg"><span class="c">${esc(subst[s.c] || s.c)}</span><span class="w">${esc(s.w || " ")}</span></span>`).join("")}</div>`;
      }).join("")}</div>`;
    }).join("");
  }

  // In the beginner version, show the easy stand-ins for barre chords in lyric sheets.
  function easySubst(song, v) {
    if (!v.easy) return {};
    const map = {};
    [["F", "Fmaj7"], ["Bm", "Bm7"]].forEach(([hard, easy]) => { if (v.chords.includes(easy) && !v.chords.includes(hard)) map[hard] = easy; });
    return map;
  }
  function songLyrics(pane, song, v) {
    const st = songState(song.id);
    if (song.lyrics) {
      pane.innerHTML = `
        <div class="row" style="justify-content:space-between;margin-bottom:16px">
          <label class="switch"><input type="checkbox" id="chords-only"> Chords only</label>
        </div>
        <div class="lyrics" id="lyr">${renderChordText(song.lyrics, easySubst(song, v))}</div>
        <p class="source">${esc(song.lyricsSource)}</p>`;
      $("#chords-only").addEventListener("change", e => $("#lyr").classList.toggle("chords-only", e.target.checked));
      return;
    }
    const show = editing => {
      if (editing || !st.lyrics) {
        pane.innerHTML = `
          <h2>Your lyrics sheet</h2>
          <p class="muted">This song's lyrics are still under copyright, so they aren't built in. Paste in lyrics you have — from the album sleeve or a licensed lyrics site — and add chords in square brackets right before the word where the chord changes, like <code>[A]Well, that's all right</code>. It's saved only on this device.</p>
          <div class="insert-row" aria-label="Insert a chord at the cursor">
            ${v.chords.map(c => `<button class="chip" data-ins="${esc(c)}">[${esc(c)}]</button>`).join("")}
            <button class="chip" data-ins="[Verse]">[Verse]</button>
            <button class="chip" data-ins="[Chorus]">[Chorus]</button>
          </div>
          <label class="sr-only" for="lyr-edit">Lyrics with chords</label>
          <textarea id="lyr-edit" placeholder="[Verse]&#10;[${esc(v.chords[0])}]First line of the song...">${esc(st.lyrics || "")}</textarea>
          <div class="row" style="margin-top:12px">
            <button class="btn primary" id="lyr-save">Save lyrics</button>
            ${st.lyrics ? `<button class="btn quiet" id="lyr-cancel">Cancel</button>` : ""}
          </div>
          <p class="source">Find the words: <a href="https://www.google.com/search?q=${encodeURIComponent(song.title + " Elvis Presley lyrics")}" target="_blank" rel="noopener">search for licensed lyrics</a></p>`;
        const ta = $("#lyr-edit");
        $$("[data-ins]", pane).forEach(b => b.addEventListener("click", () => {
          const raw = b.dataset.ins;
          const ins = raw.startsWith("[") ? `${raw}\n` : `[${raw}]`;
          const a = ta.selectionStart, z = ta.selectionEnd;
          ta.value = ta.value.slice(0, a) + ins + ta.value.slice(z);
          ta.focus(); ta.selectionStart = ta.selectionEnd = a + ins.length;
        }));
        $("#lyr-save").addEventListener("click", () => { st.lyrics = ta.value.trim(); save(); toast("Lyrics saved"); show(false); });
        const c = $("#lyr-cancel"); if (c) c.addEventListener("click", () => show(false));
      } else {
        pane.innerHTML = `
          <div class="row" style="justify-content:space-between;margin-bottom:16px">
            <label class="switch"><input type="checkbox" id="chords-only"> Chords only</label>
            <button class="btn quiet small" id="lyr-edit-btn">Edit lyrics</button>
          </div>
          <div class="lyrics" id="lyr">${renderChordText(st.lyrics, easySubst(song, v))}</div>
          <p class="source">Your own lyrics sheet, saved on this device.</p>`;
        $("#chords-only").addEventListener("change", e => $("#lyr").classList.toggle("chords-only", e.target.checked));
        $("#lyr-edit-btn").addEventListener("click", () => show(true));
      }
    };
    show(false);
  }

  function songLick(pane, song) {
    pane.innerHTML = `
      <h2>${esc(song.lick.title)}</h2>
      <pre class="tab" aria-label="Guitar tab">${esc(song.lick.tab)}</pre>
      <p>${esc(song.lick.how)}</p>
      ${song.capo ? `<p class="muted">With the capo on fret ${song.capo}, count frets from the capo.</p>` : ""}
      <p class="callout">An original practice exercise in the style of the song, not a transcription of the record. Reading tab: each line is a string (thin high E on top), and the numbers are frets. 0 means play the string open.</p>`;
  }

  function songNotes(pane, song) {
    const st = songState(song.id);
    const mins = Math.round((st.seconds || 0) / 60);
    pane.innerHTML = `
      <h2>Where you're at</h2>
      <div class="filters" role="radiogroup" aria-label="Song status">
        ${Object.entries(STATUS).map(([k, label]) => `<button class="chip" role="radio" aria-checked="${st.status === k}" aria-pressed="${st.status === k}" data-st="${k}">${label}</button>`).join("")}
      </div>
      <p class="muted">${mins ? `${mins} ${mins === 1 ? "minute" : "minutes"} of play-along practice on this song.` : "Play-along time on this song will show up here."}</p>
      <section>
        <h2>Listen to the record</h2>
        <div class="row">
          <a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(song.ytQuery)}">Find it on YouTube</a>
          <a class="btn" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent(song.ytQuery)}">Find it on Spotify</a>
        </div>
      </section>
      <section>
        <h2>Song tips</h2>
        <ul>${song.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      </section>
      <section>
        <h2><label for="notes">Your notes</label></h2>
        <textarea id="notes" style="min-height:140px" placeholder="What tripped you up today? Which change needs work?">${esc(st.notes || "")}</textarea>
      </section>`;
    $$("[data-st]", pane).forEach(b => b.addEventListener("click", () => { st.status = b.dataset.st; save(); songNotes(pane, song); toast(STATUS[st.status]); }));
    let t;
    $("#notes").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { st.notes = e.target.value; save(); }, 400); });
  }

  // ---------- Lessons ----------
  function renderLessons() {
    view.innerHTML = `
      <h1 class="display">Starter path</h1>
      <p class="lede">Nine short lessons for a brand-new player. Do them in order, a few a week, alongside your first songs.</p>
      <ol class="path">
        ${LESSONS.map(l => `<li class="${store.lessons[l.id] ? "done" : ""}"><a href="#/basics/${l.id}">${esc(l.title)}</a><span class="min">${l.minutes} min</span></li>`).join("")}
      </ol>`;
  }

  function miniPlayer({ bars, strum, tempo, meter = "4/4", capo = 0, logId = null }) {
    const id = "mp" + Math.random().toString(36).slice(2, 7);
    const html = `
      <div class="mini-player" id="${id}">
        <button class="btn primary" data-act="play">${ICON.play}<span>Play</span></button>
        <label style="flex:1;min-width:180px" class="tempo-l">Tempo <output>${tempo}</output> bpm
          <input type="range" min="40" max="160" value="${tempo}"></label>
      </div>
      ${strumStrip(strum, meter)}`;
    const wire = root => {
      const box = $("#" + id, root);
      const btn = $("[data-act=play]", box), range = $("input", box), out = $("output", box);
      const m = METERS[meter];
      const parsed = parseBars(bars);
      const reset = () => { btn.innerHTML = `${ICON.play}<span>Play</span>`; $$(".strum .on", root).forEach(x => x.classList.remove("on")); $$(".bar.now", root).forEach(x => x.classList.remove("now")); keepAwake(false); };
      btn.addEventListener("click", () => {
        if (activeSeq) { stopAll(); return; }
        const seq = new AudioKit.Sequencer({
          bars: parsed, slots: STRUMS[strum].slots, tempo: Number(range.value),
          beats: m.beats, slotsPerBeat: m.slotsPerBeat, swing: !!STRUMS[strum].swing, capo,
          guitar: true, click: true, loop: true, countIn: true,
          onSlot: (bi, slot) => {
            $$(".strum .on", root).forEach(x => x.classList.remove("on"));
            $$(".bar.now", root).forEach(x => x.classList.remove("now"));
            if (bi >= 0) {
              const s = root.querySelector(`.strum [data-slot="${slot}"]`); if (s) s.classList.add("on");
              const b = root.querySelector(`.bar[data-bi="${bi}"]`); if (b) b.classList.add("now");
            }
          },
          onStop: () => { logPractice(logId, seq.elapsedSeconds()); reset(); if (activeSeq === seq) activeSeq = null; },
        });
        activeSeq = seq; seq.start(0);
        btn.innerHTML = `${ICON.stop}<span>Stop</span>`;
        keepAwake(true);
      });
      range.addEventListener("input", () => { out.textContent = range.value; if (activeSeq) activeSeq.o.tempo = Number(range.value); });
    };
    return { html, wire };
  }

  function renderLesson(id) {
    const i = LESSONS.findIndex(l => l.id === id);
    const l = LESSONS[i];
    if (!l) { view.innerHTML = `<div class="empty">That lesson isn't here. <a href="#/basics">Go to the starter path</a></div>`; return; }
    const extras = [];
    let wires = [];
    if (l.chords) { extras.push(chordGrid(l.chords, 0, true)); wires.push(root => wireChordGrid(root)); }
    if (l.strumDemo) {
      const d = l.strumDemo;
      const mp = miniPlayer({ bars: d.chord, strum: d.strum, tempo: d.tempo, meter: STRUMS[d.strum].meter });
      extras.push(`<h2>${esc(STRUMS[d.strum].name)} on ${esc(d.chord)}</h2><p>${esc(STRUMS[d.strum].how)}</p>${mp.html}<p class="legend">${STRUM_LEGEND}</p>`);
      wires.push(mp.wire);
    }
    if (l.practiceBars) {
      const d = l.practiceBars;
      const bars = parseBars(d.bars);
      const mp = miniPlayer({ bars: d.bars, strum: d.strum, tempo: d.tempo, meter: d.meter });
      extras.push(`<div class="bars" style="margin:18px 0">${bars.map((b, bi) => `<button class="bar" data-bi="${bi}" data-chord="${esc(b[0])}"><span class="num">${bi + 1}</span>${b.map(chordSpan).join("")}</button>`).join("")}</div>${mp.html}`);
      wires.push(mp.wire, root => wireChordGrid(root));
    }
    if (l.metronome) {
      const mp = miniPlayer({ bars: "Em", strum: "downs", tempo: l.metronome });
      extras.push(`<h2>Metronome</h2><p class="muted">The player strums Em with you. Turn your volume down if you only want the click.</p>${mp.html}`);
      wires.push(mp.wire);
    }
    if (l.drill) { extras.push(`<div id="drill"></div>`); wires.push(root => renderDrill($("#drill", root))); }
    const done = !!store.lessons[l.id];
    view.innerHTML = `
      <a href="#/basics" class="muted">Starter path</a>
      <h1 class="display" style="margin:10px 0 6px">${esc(l.title)}</h1>
      <p class="muted">Lesson ${i + 1} of ${LESSONS.length}, about ${l.minutes} minutes</p>
      <div class="lesson-body">${l.body}</div>
      ${l.action ? `<a class="btn primary" href="${l.action.href}">${esc(l.action.label)}</a>` : ""}
      ${extras.join("")}
      <div class="lesson-nav">
        <button class="btn ${done ? "quiet" : "primary"}" id="done">${done ? "Marked as done" : "Mark as done"}</button>
        <div class="row">
          ${i > 0 ? `<a class="btn quiet" href="#/basics/${LESSONS[i - 1].id}">Previous lesson</a>` : ""}
          ${i < LESSONS.length - 1 ? `<a class="btn quiet" href="#/basics/${LESSONS[i + 1].id}">Next lesson</a>` : `<a class="btn quiet" href="#/songs">Go to songs</a>`}
        </div>
      </div>`;
    wires.forEach(w => w(view));
    $("#done").addEventListener("click", () => {
      store.lessons[l.id] = !store.lessons[l.id]; save();
      if (store.lessons[l.id]) toast("Lesson done");
      renderLesson(id);
    });
  }

  function renderDrill(box) {
    let pairIdx = Number(sessionStorage.getItem("drillPair") || 0);
    let count = 0, left = 60;
    const draw = () => {
      const [a, b] = DRILL_PAIRS[pairIdx];
      const key = `${a}-${b}`;
      box.innerHTML = `
        <div class="drill">
          <label for="pair">Chord pair</label>
          <select id="pair">${DRILL_PAIRS.map(([x, y], i) => `<option value="${i}" ${i === pairIdx ? "selected" : ""}>${x} and ${y}${store.drills[`${x}-${y}`] ? ` (best ${store.drills[`${x}-${y}`]})` : ""}</option>`).join("")}</select>
          <div class="pair">
            <figure>${window.chordSVG(a)}<figcaption><b>${a}</b></figcaption></figure>
            <figure>${window.chordSVG(b)}<figcaption><b>${b}</b></figcaption></figure>
          </div>
          <div class="clock" aria-live="polite" id="clock">${left}</div>
          <div class="row">
            <button class="btn primary" id="go">${activeTimer ? "Stop timer" : "Start the minute"}</button>
          </div>
          <p class="muted" style="margin-top:14px">Count your changes as you go, then enter the total.</p>
          <div class="counter">
            <button class="btn quiet" id="minus" aria-label="One fewer">−</button>
            <output id="count">${count}</output>
            <button class="btn quiet" id="plus" aria-label="One more">+</button>
            <button class="btn" id="save">Save score</button>
          </div>
          <p class="muted" style="margin-top:12px">Best for ${a} and ${b}: <strong>${store.drills[key] || "none yet"}</strong></p>
        </div>`;
      $("#pair", box).addEventListener("change", e => { pairIdx = Number(e.target.value); sessionStorage.setItem("drillPair", pairIdx); count = 0; draw(); });
      $("#go", box).addEventListener("click", () => {
        if (activeTimer) { clearInterval(activeTimer); activeTimer = null; left = 60; keepAwake(false); draw(); return; }
        left = 60; count = 0;
        AudioKit.click(AudioKit.audio().currentTime + 0.02, true);
        keepAwake(true);
        activeTimer = setInterval(() => {
          left--;
          const c = $("#clock", box); if (c) c.textContent = left;
          if (left <= 3 && left > 0) AudioKit.click(AudioKit.audio().currentTime + 0.01, false);
          if (left <= 0) {
            clearInterval(activeTimer); activeTimer = null; keepAwake(false);
            AudioKit.click(AudioKit.audio().currentTime + 0.01, true);
            AudioKit.click(AudioKit.audio().currentTime + 0.15, true);
            logPractice(null, 60);
            left = 60; draw(); toast("Time. Enter your count and save it.");
          }
        }, 1000);
        draw();
      });
      $("#plus", box).addEventListener("click", () => { count++; $("#count", box).textContent = count; });
      $("#minus", box).addEventListener("click", () => { count = Math.max(0, count - 1); $("#count", box).textContent = count; });
      $("#save", box).addEventListener("click", () => {
        if (!count) { toast("Enter how many changes you made first"); return; }
        const best = store.drills[key] || 0;
        if (count > best) { store.drills[key] = count; save(); toast(`New best: ${count}`); }
        else toast(`Saved. Your best is still ${best}`);
        count = 0; draw();
      });
    };
    draw();
  }

  // ---------- Tuner ----------
  function renderTuner() {
    const a4 = store.settings.a4;
    let mode = "auto", target = null; // target: string index in manual mode
    const done = new Set();
    const ticks = [];
    for (let c = -50; c <= 50; c += 5) {
      const ang = (c / 50) * 60 * Math.PI / 180;
      const major = c % 10 === 0;
      const r1 = 250, r2 = major ? 222 : 232;
      const x1 = 280 + r1 * Math.sin(ang), y1 = 300 - r1 * Math.cos(ang);
      const x2 = 280 + r2 * Math.sin(ang), y2 = 300 - r2 * Math.cos(ang);
      ticks.push(`<line class="tick${major ? " major" : ""}${c === 0 ? " zero" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
      if (major && c !== 0) {
        const xl = 280 + 202 * Math.sin(ang), yl = 300 - 202 * Math.cos(ang) + 4;
        ticks.push(`<text class="lbl" x="${xl.toFixed(1)}" y="${yl.toFixed(1)}">${c > 0 ? "+" + c : c}</text>`);
      }
    }
    const zoneA = 6 * Math.PI / 180, zr = 238;
    const zone = `<path class="zone" d="M ${280 - zr * Math.sin(zoneA)} ${300 - zr * Math.cos(zoneA)} A ${zr} ${zr} 0 0 1 ${280 + zr * Math.sin(zoneA)} ${300 - zr * Math.cos(zoneA)}"/>`;
    view.innerHTML = `
      <h1 class="display" style="margin-bottom:6px">Tuner</h1>
      <p class="muted">Standard tuning, low to high: E A D G B E. Pluck one string and let it ring.</p>
      <div class="tuner" id="tuner">
        <div class="dial">
          <svg viewBox="0 -12 560 330" aria-hidden="true">
            <path class="face" d="M 30 300 A 250 250 0 0 1 530 300 Z"/>
            ${zone}
            ${ticks.join("")}
            <line class="needle" id="needle" x1="280" y1="300" x2="280" y2="78" style="transform: rotate(0deg)"/>
            <circle class="hub" cx="280" cy="300" r="10"/>
          </svg>
        </div>
        <div class="readout" aria-live="polite">
          <div class="note" id="note">–</div>
          <div class="cents" id="cents">&nbsp;</div>
          <div class="hint" id="hint">Tap “Start listening” and allow the microphone.</div>
        </div>
        <div class="strings" role="group" aria-label="Strings">
          ${window.OPEN_STRINGS.map((s, i) => `<button data-i="${i}" aria-pressed="false"><b>${s.name}</b><span>${6 - i}${["th", "th", "th", "rd", "nd", "st"][i]} string</span></button>`).join("")}
        </div>
        <p class="muted" id="mode-hint">Auto mode picks the nearest string. Tap a string to lock onto it.</p>
        <div class="tuner-controls">
          <button class="btn primary" id="listen">Start listening</button>
          <button class="btn" id="ref">Play reference note</button>
          <label>Pitch of A <select id="a4">${[432, 436, 438, 439, 440, 441, 442, 444].map(f => `<option ${f === a4 ? "selected" : ""} value="${f}">${f} Hz</option>`).join("")}</select></label>
        </div>
        <div id="tuner-msg"></div>
      </div>`;

    const tunerEl = $("#tuner"), needle = $("#needle"), noteEl = $("#note"), centsEl = $("#cents"), hintEl = $("#hint");
    const listenBtn = $("#listen");
    const hist = [];
    let inTuneSince = 0, lastHeard = 0;

    function setMode(i) {
      if (i === null || target === i) { mode = "auto"; target = null; }
      else { mode = "manual"; target = i; }
      $$(".strings button").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.i) === target)));
      $("#mode-hint").textContent = mode === "auto" ? "Auto mode picks the nearest string. Tap a string to lock onto it." : `Locked on the ${window.OPEN_STRINGS[target].name} string. Tap it again to go back to auto.`;
    }
    $$(".strings button").forEach(b => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      setMode(i);
      if (!activeTuner && target !== null) AudioKit.tone(window.OPEN_STRINGS[i].midi, 2.5, store.settings.a4);
    }));
    $("#ref").addEventListener("click", () => {
      const i = target !== null ? target : 0;
      if (target === null) setMode(0);
      AudioKit.tone(window.OPEN_STRINGS[i].midi, 2.5, store.settings.a4);
    });
    $("#a4").addEventListener("change", e => { store.settings.a4 = Number(e.target.value); save(); });

    function show(freq) {
      const a = store.settings.a4;
      const m = 69 + 12 * Math.log2(freq / a);
      let ti = target;
      if (mode === "auto") {
        let best = 0, bd = Infinity;
        window.OPEN_STRINGS.forEach((s, i) => { const d = Math.abs(m - s.midi); if (d < bd) { bd = d; best = i; } });
        ti = best;
      }
      const tgt = window.OPEN_STRINGS[ti];
      const cents = (m - tgt.midi) * 100;
      const nearest = Math.round(m);
      $$(".strings button").forEach(b => b.classList.toggle("active", Number(b.dataset.i) === ti));
      const far = Math.abs(cents) >= 100;
      noteEl.innerHTML = far ? `${NOTE_NAMES[((nearest % 12) + 12) % 12]}<sub>${Math.floor(nearest / 12) - 1}</sub>` : `${tgt.name}<sub>${tgt.octave}</sub>`;
      const c = Math.max(-50, Math.min(50, cents));
      needle.style.transform = `rotate(${(c / 50) * 60}deg)`;
      const ok = Math.abs(cents) <= 5;
      const rc = Math.round(cents);
      centsEl.textContent = far ? `Aiming for ${tgt.name}${tgt.octave}` : `${rc > 0 ? "+" : ""}${rc} cents`;
      hintEl.className = "hint " + (ok ? "ok" : cents < 0 ? "flat" : "sharp");
      hintEl.textContent = ok ? "In tune" : cents < 0 ? (far ? "Way low: tighten the string" : "A little low: tighten slowly") : (far ? "Way high: loosen the string" : "A little high: loosen slowly");
      tunerEl.classList.toggle("intune", ok);
      if (ok) {
        if (!inTuneSince) inTuneSince = performance.now();
        if (performance.now() - inTuneSince > 600 && !done.has(ti)) {
          done.add(ti);
          const b = $(`.strings button[data-i="${ti}"]`); if (b) b.classList.add("done");
          if (done.size === 6) toast("All six strings in tune");
        }
      } else inTuneSince = 0;
    }

    function onPitch({ freq, clarity }) {
      const now = performance.now();
      if (freq > 60 && freq < 1100 && clarity > 0.85) {
        hist.push(freq); if (hist.length > 5) hist.shift();
        const sorted = hist.slice().sort((x, y) => x - y);
        show(sorted[Math.floor(sorted.length / 2)]);
        lastHeard = now;
      } else if (now - lastHeard > 700) {
        hist.length = 0;
        if (lastHeard) {
          hintEl.className = "hint"; hintEl.textContent = "Pluck a string";
          centsEl.innerHTML = "&nbsp;"; tunerEl.classList.remove("intune");
          needle.style.transform = "rotate(0deg)";
          lastHeard = 0;
        }
      }
    }

    listenBtn.addEventListener("click", async () => {
      if (activeTuner) { stopAll(); listenBtn.textContent = "Start listening"; hintEl.textContent = "Stopped. Tap “Start listening” to tune again."; return; }
      $("#tuner-msg").innerHTML = "";
      const t = new AudioKit.Tuner(onPitch);
      try {
        await t.start();
        activeTuner = t;
        listenBtn.textContent = "Stop listening";
        hintEl.className = "hint"; hintEl.textContent = "Pluck a string";
        keepAwake(true);
      } catch (err) {
        const name = err && err.name;
        let msg = `<strong>The microphone didn't start.</strong> ${esc(err && err.message || "")}`;
        if (name === "NotAllowedError" || name === "SecurityError") msg = `<strong>Microphone access is blocked.</strong> Allow the microphone for this site in your browser settings (on iPhone: Settings, Safari, Microphone; in Chrome: the icon left of the address bar), then tap Start listening again.`;
        else if (name === "NotFoundError") msg = `<strong>No microphone found.</strong> Plug one in or use your phone, then try again.`;
        else if (name === "InsecureContext") msg = `<strong>The tuner needs a secure (https) page.</strong> Open the app from its GitHub Pages link rather than a local file.`;
        else if (name === "NotSupported") msg = `<strong>This browser can't use the microphone.</strong> Try Safari or Chrome.`;
        $("#tuner-msg").innerHTML = `<div class="msg">${msg}</div>`;
      }
    });
  }

  // ---------- Boot ----------
  route();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  // Expose for tests.
  window.__app = { store, songVersion, parseBars, renderChordText };
})();
