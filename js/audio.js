// Audio: shared context, plucked-string synth (Karplus–Strong), chord strums,
// a lookahead sequencer for play-along, and a YIN pitch detector for the tuner.
(function () {
  let ctx = null, master = null, guitarBus = null, clickBus = null;
  const pluckCache = new Map();

  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      guitarBus = ctx.createBiquadFilter();
      guitarBus.type = "lowpass";
      guitarBus.frequency.value = 3200;
      guitarBus.Q.value = 0.4;
      const gGain = ctx.createGain();
      gGain.gain.value = 0.55;
      guitarBus.connect(gGain).connect(master);
      clickBus = ctx.createGain();
      clickBus.gain.value = 0.5;
      clickBus.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  const midiToFreq = (m, a4 = 440) => a4 * Math.pow(2, (m - 69) / 12);

  function pluckBuffer(midi) {
    const key = Math.round(midi);
    if (pluckCache.has(key)) return pluckCache.get(key);
    const ac = audio();
    const sr = ac.sampleRate;
    const freq = midiToFreq(key);
    const dur = 2.2;
    const len = Math.floor(sr * dur);
    const buf = ac.createBuffer(1, len, sr);
    const y = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    // Softened noise burst for a warmer, pick-on-steel attack.
    let prev = 0;
    for (let i = 0; i < N; i++) {
      const n = Math.random() * 2 - 1;
      prev = prev * 0.45 + n * 0.55;
      y[i] = prev;
    }
    const decay = freq < 120 ? 0.9985 : freq < 250 ? 0.9978 : 0.997;
    for (let i = N; i < len; i++) {
      y[i] = decay * 0.5 * (y[i - N] + y[i - N - 1 < 0 ? 0 : i - N - 1]);
    }
    // Normalize.
    let peak = 0;
    for (let i = 0; i < N * 4 && i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
    if (peak > 0) for (let i = 0; i < len; i++) y[i] /= peak;
    pluckCache.set(key, buf);
    return buf;
  }

  function pluck(midi, when, gain = 0.32, dur = 1.6) {
    const ac = audio();
    const src = ac.createBufferSource();
    src.buffer = pluckBuffer(midi);
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.setTargetAtTime(0, when + dur, 0.08);
    src.connect(g).connect(guitarBus);
    src.start(when);
    src.stop(when + dur + 0.6);
  }

  // String notes for a chord shape (+ capo).
  function chordNotes(name, capo = 0) {
    const c = window.CHORDS[name];
    if (!c) return [];
    return c.frets.map((f, i) => (f < 0 ? null : window.OPEN_STRINGS[i].midi + f + capo));
  }

  function bassNotes(name, capo = 0) {
    const notes = chordNotes(name, capo);
    const r = notes.findIndex(n => n !== null);
    if (r < 0) return { root: null, alt: null };
    const root = notes[r];
    return { root, alt: r === 0 ? root + 7 : root - 5 };
  }

  // Play a strum symbol for a chord at `when`.
  function playSymbol(sym, chord, when, capo = 0, slotDur = 0.25) {
    if (!chord || sym === "-") return;
    const notes = chordNotes(chord, capo);
    const ring = Math.max(0.35, Math.min(1.8, slotDur * 3));
    if (sym === "D") {
      let k = 0;
      notes.forEach(n => { if (n !== null) pluck(n, when + 0.011 * k++, 0.26, ring); });
    } else if (sym === "U") {
      const top = notes.slice(2).filter(n => n !== null).reverse();
      top.forEach((n, k) => pluck(n, when + 0.009 * k, 0.16, ring * 0.8));
    } else if (sym === "B" || sym === "A") {
      const b = bassNotes(chord, capo);
      const n = sym === "B" ? b.root : b.alt;
      if (n !== null) pluck(n, when, 0.42, ring);
    } else if (/^[1-6]$/.test(sym)) {
      const idx = 6 - Number(sym);
      const n = notes[idx];
      if (n !== null && n !== undefined) pluck(n, when, 0.3, ring * 1.4);
    }
  }

  function strumNow(chord, capo = 0) {
    const ac = audio();
    playSymbol("D", chord, ac.currentTime + 0.03, capo, 0.6);
  }

  function click(when, accent) {
    const ac = audio();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = accent ? 1760 : 1180;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.5, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    o.connect(g).connect(clickBus);
    o.start(when);
    o.stop(when + 0.06);
  }

  function tone(midi, seconds = 2.5, a4 = 440) {
    // Reference tone for tuning: a plucked string, re-plucked once.
    const ac = audio();
    const t = ac.currentTime + 0.02;
    const shift = 12 * Math.log2(a4 / 440);
    // Detune by playing the pluck buffer at an adjusted rate.
    [0, 1.2].forEach(off => {
      if (off > seconds) return;
      const src = ac.createBufferSource();
      src.buffer = pluckBuffer(midi);
      src.playbackRate.value = Math.pow(2, shift / 12);
      const g = ac.createGain();
      g.gain.value = 0.5;
      src.connect(g).connect(guitarBus);
      src.start(t + off);
      src.stop(t + off + 2.2);
    });
  }

  // ---------- Sequencer ----------
  // bars: [[chord, chord?], ...]; slots: strum slots for one bar.
  class Sequencer {
    constructor(opts) {
      this.o = Object.assign({ tempo: 80, beats: 4, slotsPerBeat: 2, swing: false, capo: 0, guitar: true, click: true, countIn: true, loop: false }, opts);
      this.running = false;
      this.queue = [];
      this.timer = null;
      this.raf = null;
    }
    get slotsPerBar() { return this.o.beats * this.o.slotsPerBeat; }
    slotDuration(slotInBeat) {
      const beat = 60 / this.o.tempo;
      if (this.o.swing && this.o.slotsPerBeat === 2) return slotInBeat === 0 ? beat * 2 / 3 : beat / 3;
      return beat / this.o.slotsPerBeat;
    }
    start(fromBar = 0) {
      const ac = audio();
      this.stop(true);
      this.running = true;
      this.scheduling = true;
      this.bar = this.o.countIn ? -1 : fromBar;
      this.startBar = fromBar;
      this.slot = 0;
      this.nextTime = ac.currentTime + 0.12;
      this.startedAt = performance.now();
      this.timer = setInterval(() => this.schedule(), 25);
      this.schedule();
      const tick = () => {
        const now = audio().currentTime;
        while (this.queue.length && this.queue[0].time <= now + 0.01) {
          const ev = this.queue.shift();
          if (ev.type === "slot" && this.o.onSlot) this.o.onSlot(ev.bar, ev.slot);
          if (ev.type === "end") { this.stop(); if (this.o.onEnd) this.o.onEnd(); return; }
        }
        if (this.running) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    schedule() {
      const ac = audio();
      const bars = this.o.bars;
      while (this.scheduling && this.nextTime < ac.currentTime + 0.15) {
        const spb = this.o.slotsPerBeat;
        const slotInBeat = this.slot % spb;
        const t = this.nextTime;
        const dur = this.slotDuration(slotInBeat);
        if (this.bar === -1) {
          if (slotInBeat === 0) click(t, this.slot === 0); // count-in always clicks
        } else {
          const chords = bars[this.bar] || [];
          const per = this.slotsPerBar / Math.max(1, chords.length);
          const chord = chords[Math.min(chords.length - 1, Math.floor(this.slot / per))];
          const slots = (this.o.slotsFor ? this.o.slotsFor(this.bar) : this.o.slots) || [];
          if (this.o.click && slotInBeat === 0) click(t, this.slot === 0);
          if (this.o.guitar) playSymbol(slots[this.slot] || "-", chord, t, this.o.capo, dur);
        }
        this.queue.push({ type: "slot", time: t, bar: this.bar, slot: this.slot });
        this.nextTime += dur;
        this.slot++;
        if (this.slot >= this.slotsPerBar) {
          this.slot = 0;
          this.bar = this.bar === -1 ? this.startBar : this.bar + 1;
          if (this.bar >= bars.length) {
            if (this.o.loop) this.bar = this.o.loopStart || 0;
            else { this.queue.push({ type: "end", time: this.nextTime }); this.scheduling = false; }
          }
        }
      }
    }
    stop(silent) {
      const wasRunning = this.running || this.timer;
      this.running = false;
      this.scheduling = false;
      clearInterval(this.timer); this.timer = null;
      cancelAnimationFrame(this.raf);
      this.queue = [];
      if (wasRunning && !silent && this.o.onStop) this.o.onStop();
    }
    elapsedSeconds() { return this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0; }
  }

  // ---------- Pitch detection (YIN) ----------
  function yin(buf, sr, threshold = 0.12) {
    const half = Math.floor(buf.length / 2);
    const tauMin = Math.floor(sr / 1100);
    const tauMax = Math.min(half - 1, Math.floor(sr / 60));
    const d = new Float32Array(tauMax + 1);
    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      for (let i = 0; i < half; i++) {
        const delta = buf[i] - buf[i + tau];
        sum += delta * delta;
      }
      d[tau] = sum;
    }
    // Cumulative mean normalized difference.
    d[0] = 1;
    let running = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      running += d[tau];
      d[tau] = running ? d[tau] * tau / running : 1;
    }
    let tau = -1;
    for (let t = tauMin; t <= tauMax; t++) {
      if (d[t] < threshold) {
        while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
        tau = t;
        break;
      }
    }
    if (tau === -1) return { freq: -1, clarity: 0 };
    // Parabolic interpolation.
    const x0 = tau > 1 ? d[tau - 1] : d[tau];
    const x2 = tau + 1 <= tauMax ? d[tau + 1] : d[tau];
    const denom = 2 * (2 * d[tau] - x2 - x0);
    const better = denom ? tau + (x2 - x0) / denom : tau;
    return { freq: sr / better, clarity: 1 - d[tau] };
  }

  class Tuner {
    constructor(onPitch) {
      this.onPitch = onPitch;
      this.stream = null;
    }
    async start() {
      if (!window.isSecureContext) throw Object.assign(new Error("insecure"), { name: "InsecureContext" });
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error("nomedia"), { name: "NotSupported" });
      const ac = audio();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      this.source = ac.createMediaStreamSource(this.stream);
      this.hp = ac.createBiquadFilter();
      this.hp.type = "highpass"; this.hp.frequency.value = 55;
      this.analyser = ac.createAnalyser();
      this.analyser.fftSize = 4096;
      this.source.connect(this.hp).connect(this.analyser);
      this.buf = new Float32Array(this.analyser.fftSize);
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        this.analyser.getFloatTimeDomainData(this.buf);
        let rms = 0;
        for (let i = 0; i < this.buf.length; i++) rms += this.buf[i] * this.buf[i];
        rms = Math.sqrt(rms / this.buf.length);
        let result = { freq: -1, clarity: 0 };
        if (rms > 0.006) result = yin(this.buf, ac.sampleRate);
        this.onPitch(Object.assign(result, { rms }));
        this.raf = requestAnimationFrame(loop);
      };
      loop();
    }
    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
      try { this.source && this.source.disconnect(); } catch (e) {}
    }
  }

  window.AudioKit = { audio, pluck, strumNow, playSymbol, click, tone, Sequencer, Tuner, yin, midiToFreq, chordNotes };
})();
