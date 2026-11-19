// =====================================================================
//  AUDIO: sintetizador chiptune propio (WebAudio). Melodías originales.
// =====================================================================
'use strict';
const AUD = { ctx: null, master: null, musicGain: null, sfxGain: null, cur: null, curName: null, vol: 0.7, sfxVol: 0.8, timer: null };
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteFreq(n) { const m = n.match(/^([A-G][#b]?)(\d)$/); if (!m) return 0; const semi = NOTE_IDX[m[1]] + (parseInt(m[2]) + 1) * 12; return 440 * Math.pow(2, (semi - 69) / 12); }
function parseSeq(s) { return s.trim().split(/\s+/).map(t => { const [n, d] = t.split('/'); return [n, parseFloat(d || 1)]; }); }

AUD.init = function () {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  AUD.ctx = new AC();
  AUD.master = AUD.ctx.createGain(); AUD.master.gain.value = 0.9; AUD.master.connect(AUD.ctx.destination);
  AUD.musicGain = AUD.ctx.createGain(); AUD.musicGain.gain.value = AUD.vol * 0.32; AUD.musicGain.connect(AUD.master);
  AUD.sfxGain = AUD.ctx.createGain(); AUD.sfxGain.gain.value = AUD.sfxVol * 0.4; AUD.sfxGain.connect(AUD.master);
  const mkPulse = (duty) => { const n = 32, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) { im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); } return AUD.ctx.createPeriodicWave(re, im); };
  AUD.waves = { sq50: mkPulse(0.5), sq25: mkPulse(0.25), sq12: mkPulse(0.125) };
  const len = AUD.ctx.sampleRate * 0.5; const nb = AUD.ctx.createBuffer(1, len, AUD.ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; AUD.noise = nb;
  if (AUD.pending) { const p = AUD.pending; AUD.pending = null; AUD.play(p); }
};
AUD.setVol = function (v) { AUD.vol = v; if (AUD.musicGain) AUD.musicGain.gain.value = v * 0.32; };
function tone(t, freq, dur, wave, gain, dest, opts = {}) {
  const c = AUD.ctx; const o = c.createOscillator(); const g = c.createGain();
  if (wave === 'tri') o.type = 'triangle'; else if (wave === 'sine') o.type = 'sine'; else o.setPeriodicWave(AUD.waves[wave] || AUD.waves.sq50);
  o.frequency.setValueAtTime(freq, t);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
  if (opts.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = freq * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(t + dur + 0.05); }
  const a = 0.008, rel = Math.min(0.08, dur * 0.4);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a);
  g.gain.setValueAtTime(gain * (opts.sus ?? 0.75), t + Math.max(a, dur * 0.35));
  g.gain.linearRampToValueAtTime(0, t + dur + rel);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + rel + 0.02);
}
function drum(t, kind, dest) {
  const c = AUD.ctx;
  if (kind === 'k') { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.16); return; }
  const s = c.createBufferSource(); s.buffer = AUD.noise; const f = c.createBiquadFilter(); const g = c.createGain();
  if (kind === 's') { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); }
  else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); }
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + 0.15);
}

// Canciones: bpm, unidad = corchea. Pistas: mel (pulso 50%), har (pulso 25%), bas (triángulo), drm (patrón por compás)
const SONGS = {
  titulo: { bpm: 112, mel: 'G4/1 C5/1 E5/2 D5/1 C5/1 D5/2 E5/1 G5/1 A5/2 G5/2 E5/2 C5/1 D5/1 E5/2 D5/1 C5/1 A4/2 G4/2 C5/4 G4/1 C5/1 E5/2 D5/1 C5/1 D5/2 E5/1 G5/1 C6/2 B5/2 A5/2 G5/1 E5/1 F5/2 E5/1 D5/1 C5/4 R/4', har: 'E4/4 F4/4 G4/4 E4/4 C4/4 F4/4 E4/4 G4/4 E4/4 F4/4 G4/4 F4/4 E4/4 F4/4 E4/4 R/4', bas: 'C3/2 G3/2 F3/2 C3/2 C3/2 G3/2 A2/2 E3/2 F3/2 C3/2 G3/2 C3/2 A2/2 E3/2 F3/2 G3/2 C3/2 G3/2 F3/2 C3/2 C3/2 G3/2 A2/2 E3/2 F3/2 C3/2 G3/2 G3/2 C3/4 R/4', drm: 'k.h.s.h.' },
  casa: { bpm: 104, mel: 'E5/1 G5/1 C6/2 B5/1 A5/1 G5/2 F5/1 A5/1 G5/2 E5/2 R/2 D5/1 E5/1 F5/2 E5/1 D5/1 C5/2 D5/1 E5/1 D5/4 R/2 E5/1 G5/1 C6/2 B5/1 A5/1 G5/2 F5/1 A5/1 G5/2 E5/2 C5/1 D5/1 E5/2 D5/2 C5/1 B4/1 C5/4 R/4', har: 'C5/4 B4/4 A4/4 G4/4 F4/4 E4/4 F4/4 G4/4 C5/4 B4/4 A4/4 G4/4 F4/4 G4/4 E4/4 R/4', bas: 'C3/2 G3/2 G2/2 D3/2 A2/2 E3/2 E2/2 B2/2 F2/2 C3/2 C3/2 G3/2 D3/2 A3/2 G2/2 D3/2 C3/2 G3/2 G2/2 D3/2 A2/2 E3/2 E2/2 B2/2 F2/2 C3/2 G2/2 D3/2 C3/2 G2/2 C3/4', drm: 'k...s...' },
  colonia: { bpm: 126, ts: 3, mel: 'D5/2 A4/1 B4/1 C#5/1 D5/1 E5/2 A4/2 A4/2 F#5/2 G5/1 F#5/1 E5/1 D5/1 C#5/2 A4/2 A4/2 B4/2 C#5/1 D5/1 E5/1 F#5/1 G5/2 F#5/1 E5/1 D5/2 E5/2 A4/1 B4/1 C#5/2 D5/6', har: 'F#4/6 G4/6 A4/6 A4/6 G4/6 E4/6 E4/6 F#4/6', bas: 'D3/2 A3/2 A3/2 E3/2 A3/2 A3/2 D3/2 A3/2 A3/2 A2/2 E3/2 E3/2 G2/2 D3/2 D3/2 E3/2 B3/2 B3/2 A2/2 E3/2 E3/2 D3/2 A2/2 D3/2', drm: 'k.h.h.' },
  alameda: { bpm: 132, mel: 'C5/1 C5/1 E5/1 G5/1 C6/2 G5/2 A5/1 G5/1 F5/1 E5/1 D5/2 G4/2 C5/1 C5/1 E5/1 G5/1 C6/2 E6/2 D6/1 C6/1 B5/1 A5/1 G5/4 A5/1 A5/1 F5/1 A5/1 C6/2 A5/2 G5/1 G5/1 E5/1 G5/1 C6/2 G5/2 F5/1 E5/1 D5/1 C5/1 D5/2 G5/2 C5/4 R/4', har: 'E4/4 E4/4 F4/4 D4/4 E4/4 G4/4 F4/4 D4/4 F4/4 F4/4 E4/4 E4/4 F4/4 G4/4 E4/4 R/4', bas: 'C3/2 C3/2 C3/2 G2/2 F2/2 F2/2 G2/2 G2/2 C3/2 C3/2 C3/2 A2/2 D3/2 G2/2 G2/2 G2/2 F2/2 F2/2 F2/2 F2/2 C3/2 C3/2 C3/2 C3/2 F2/2 F2/2 G2/2 G2/2 C3/2 G2/2 C3/4', drm: 'k.s.k.s.' },
  triste: { bpm: 72, mel: 'A4/2 C5/2 E5/4 D5/2 C5/2 B4/4 C5/2 A4/2 F4/4 E4/6 R/2 A4/2 C5/2 E5/4 G5/2 F5/2 E5/4 D5/2 B4/2 C5/2 B4/2 A4/8', har: 'E4/8 G4/8 F4/8 E4/8 E4/8 C5/8 G4/8 E4/8', bas: 'A2/4 E3/4 G2/4 D3/4 F2/4 C3/4 E2/4 E2/4 A2/4 E3/4 C3/4 G2/4 D3/4 E3/4 A2/8', drm: '' },
  reconquista: { bpm: 108, mel: 'E4/1 R/1 E4/1 G4/1 R/1 F#4/1 E4/1 R/1 B3/1 R/1 B3/1 D4/1 E4/2 R/2 E4/1 R/1 E4/1 G4/1 R/1 A4/1 B4/1 R/1 C5/1 B4/1 A4/1 G4/1 F#4/2 R/2 G4/1 R/1 G4/1 B4/1 R/1 A4/1 G4/1 R/1 F#4/1 R/1 F#4/1 A4/1 G4/1 F#4/1 E4/2 C5/1 B4/1 A4/1 G4/1 F#4/1 G4/1 A4/1 F#4/1 E4/4 R/4', har: '', bas: 'E2/1 R/1 E3/1 R/1 E2/1 R/1 E3/1 R/1 B1/1 R/1 B2/1 R/1 E2/1 R/1 E3/1 R/1 E2/1 R/1 E3/1 R/1 A2/1 R/1 A2/1 R/1 B2/1 R/1 B2/1 R/1 B1/1 R/1 B2/1 R/1 G2/1 R/1 G3/1 R/1 G2/1 R/1 G3/1 R/1 D2/1 R/1 D3/1 R/1 E2/1 R/1 E3/1 R/1 A2/1 R/1 A2/1 R/1 B2/1 R/1 B2/1 R/1 E2/1 R/1 E3/1 R/1 E2/2 R/2', drm: '..h...h.' },
  hacienda: { bpm: 150, ts: 3, mel: 'G4/1 B4/1 D5/1 G5/2 F#5/1 E5/1 D5/1 C5/1 B4/2 A4/1 G4/1 B4/1 D5/1 G5/1 A5/1 B5/1 A5/2 G5/1 F#5/3 E5/1 G5/1 E5/1 C5/1 E5/1 G5/1 B5/2 A5/1 G5/1 F#5/1 E5/1 D5/1 C5/1 B4/1 A4/1 D5/1 G4/3 R/3', har: 'B4/3 D5/3 E4/3 G4/3 B4/3 D5/3 D5/3 A4/3 C5/3 E5/3 D5/3 B4/3 C5/3 F#4/3 B4/3 R/3', bas: 'G2/1 D3/1 G3/1 G2/1 D3/1 G3/1 C3/1 G3/1 C3/1 G2/1 D3/1 G3/1 G2/1 D3/1 G3/1 E2/1 B2/1 E3/1 D3/1 A3/1 D3/1 D3/1 A3/1 D3/1 C3/1 G3/1 C3/1 A2/1 E3/1 A3/1 D3/1 A3/1 D3/1 E3/1 B3/1 E3/1 A2/1 E3/1 A3/1 D3/1 A3/1 D3/1 G2/1 D3/1 G3/1 G2/3', drm: 'k.hs.h' },
  cueva: { bpm: 84, mel: 'D4/2 F4/2 A4/4 G#4/2 A4/2 R/4 D4/2 F4/2 C5/4 B4/2 A4/2 R/4 F4/2 A4/2 D5/4 C5/2 A4/2 F4/4 E4/2 G4/2 A4/8 R/4', har: '', bas: 'D2/8 D2/8 D2/8 D2/8 B1/8 C2/8 A1/8 A1/4', drm: '' },
  independencia: { bpm: 120, mel: 'G4/1 G4/1 C5/2 C5/1 D5/1 E5/2 E5/1 F5/1 G5/4 E5/2 C5/2 A5/2 G5/1 F5/1 E5/2 D5/1 C5/1 D5/6 R/2 G4/1 G4/1 C5/2 C5/1 D5/1 E5/2 E5/1 F5/1 G5/4 C6/2 B5/1 A5/1 G5/2 F5/2 E5/2 D5/2 C5/6 R/2', har: 'E4/4 G4/4 C5/4 G4/4 F4/4 A4/4 G4/6 R/2 E4/4 G4/4 C5/4 E5/4 D5/4 B4/4 C5/6 R/2', bas: 'C3/2 G3/2 C3/2 G3/2 C3/2 G3/2 E3/2 C3/2 F2/2 C3/2 F2/2 A2/2 G2/2 D3/2 G2/2 D3/2 C3/2 G3/2 C3/2 G3/2 C3/2 G3/2 A2/2 E3/2 F2/2 C3/2 G2/2 D3/2 C3/2 G2/2 C3/4', drm: 'k.s.k.sh' },
  piano: { bpm: 96, ts: 3, mel: 'E5/3 D5/1 C5/1 D5/1 E5/2 G5/1 E5/3 D5/3 C5/1 B4/1 C5/1 D5/3 R/3 C5/3 B4/1 A4/1 B4/1 C5/2 E5/1 A5/3 G5/2 F5/1 E5/2 D5/1 C5/6', har: 'C4/6 G3/6 F3/6 G3/6 A3/6 E3/6 F3/6 C4/6', bas: 'C3/1 G3/1 C4/1 C3/1 G3/1 C4/1 G2/1 D3/1 G3/1 G2/1 D3/1 G3/1 F2/1 C3/1 F3/1 G2/1 D3/1 G3/1 A2/1 E3/1 A3/1 E2/1 B2/1 E3/1 F2/1 C3/1 F3/1 C3/1 G3/1 C4/1', drm: '', melWave: 'sq12' },
  puerto: { bpm: 100, ts: 3, mel: 'A4/1 D5/2 D5/1 E5/1 F5/1 E5/2 D5/1 C5/2 A4/1 A4/2 G4/1 F4/2 G4/1 A4/3 C5/2 A4/1 A4/1 D5/2 D5/1 E5/1 F5/1 G5/2 F5/1 E5/2 C5/1 D5/2 E5/1 F5/2 E5/1 D5/3 R/3', har: 'F4/3 F4/3 A4/3 E4/3 D4/3 E4/3 F4/3 E4/3 F4/3 A4/3 G4/3 A4/3 B4/3 C5/3 A4/3 R/3', bas: 'D3/3 D3/3 A2/3 A2/3 F2/3 C3/3 F2/3 A2/3 D3/3 D3/3 G2/3 G2/3 C3/3 A2/3 D3/3 D3/3', drm: 'k.h' },
  batalla: { bpm: 152, mel: 'E5/1 E5/1 R/1 E5/1 R/1 C5/1 E5/2 G5/2 R/2 G4/2 R/2 C5/2 R/1 G4/1 R/2 E4/2 A4/2 B4/2 A#4/1 A4/2 G4/1 E5/1 G5/1 A5/2 F5/1 G5/1 R/1 E5/2 C5/1 D5/1 B4/2 R/2', har: 'G4/1 G4/1 R/1 G4/1 R/1 E4/1 G4/2 B4/2 R/2 G3/2 R/2 E4/2 R/1 C4/1 R/2 G3/2 C4/2 D4/2 C#4/1 C4/2 C4/1 G4/1 B4/1 C5/2 A4/1 B4/1 R/1 G4/2 E4/1 F4/1 D4/2 R/2', bas: 'C3/1 C3/1 C3/1 C3/1 C3/1 C3/1 C3/1 C3/1 G2/1 G2/1 G2/1 G2/1 G2/1 G2/1 G2/1 G2/1 E2/1 E2/1 E2/1 E2/1 A2/1 A2/1 A2/1 A2/1 F2/1 F2/1 G2/1 G2/1 C3/1 C3/1 G2/1 G2/1', drm: 'k.skk.s.' },
  final: { bpm: 140, mel: 'A4/1 C5/1 E5/1 A5/1 G5/2 E5/2 F5/1 E5/1 D5/1 C5/1 B4/2 E5/2 A4/1 C5/1 E5/1 A5/1 B5/2 C6/2 B5/1 A5/1 G#5/1 B5/1 A5/4 F5/1 A5/1 C6/1 F6/1 E6/2 C6/2 D6/1 C6/1 B5/1 A5/1 G#5/2 E5/2 A5/1 B5/1 C6/1 D6/1 E6/2 B5/2 C6/1 B5/1 A5/1 G#5/1 A5/4', har: 'E4/4 C4/4 D4/4 E4/4 E4/4 G4/4 E4/4 E4/4 F4/4 A4/4 F4/4 E4/4 A4/4 G#4/4 E4/4 E4/4', bas: 'A2/1 A3/1 A2/1 A3/1 C3/1 C4/1 C3/1 C4/1 D3/1 D4/1 D3/1 D4/1 E3/1 E4/1 E3/1 E4/1 A2/1 A3/1 A2/1 A3/1 G2/1 G3/1 G2/1 G3/1 E2/1 E3/1 E2/1 E3/1 A2/1 A3/1 A2/1 A3/1 F2/1 F3/1 F2/1 F3/1 C3/1 C4/1 C3/1 C4/1 D3/1 D4/1 D3/1 D4/1 E3/1 E4/1 E3/1 E4/1 A2/1 A3/1 A2/1 A3/1 E3/1 E4/1 E3/1 E4/1 E3/1 E4/1 E3/1 E4/1 A2/2 A2/2 A2/4', drm: 'k.skk.sk' },
  tiempo: { bpm: 140, mel: 'C5/1 E5/1 G5/1 C6/1 G5/1 E5/1 D5/1 F5/1 A5/1 D6/1 A5/1 F5/1 E5/1 G5/1 B5/1 E6/1 B5/1 G5/1 F5/1 A5/1 C6/1 F6/1 C6/1 A5/1', har: '', bas: 'C3/6 D3/6 E3/6 F3/6', drm: 'h.h.h.', melWave: 'sq25' },
  creditos: { bpm: 96, mel: 'C5/2 E5/2 G5/3 F5/1 E5/2 D5/2 C5/4 A4/2 C5/2 F5/3 E5/1 D5/2 C5/2 D5/4 E5/2 G5/2 C6/3 B5/1 A5/2 G5/2 F5/2 E5/2 D5/2 G5/2 E5/2 D5/2 C5/8', har: 'E4/8 C4/8 F4/8 G4/8 G4/8 A4/8 F4/4 G4/4 E4/8', bas: 'C3/4 G2/4 A2/4 E2/4 F2/4 C3/4 G2/4 G2/4 C3/4 E3/4 F2/4 C3/4 D3/4 G2/4 C3/8', drm: 'k...s...' }
};
// Fanfarrias (no repiten)
const JINGLES = {
  medalla: { bpm: 140, mel: 'G4/1 C5/1 E5/1 G5/2 E5/1 G5/1 C6/6', har: 'E4/1 G4/1 C5/1 E5/2 C5/1 E5/1 G5/6', bas: 'C3/3 G2/2 G2/1 C3/6' },
  item: { bpm: 160, mel: 'C5/1 E5/1 G5/1 C6/3', har: 'G4/1 C5/1 E5/1 G5/3', bas: 'C3/6' },
  victoria: { bpm: 150, mel: 'C5/1 C5/1 C5/1 C5/3 G#4/3 A#4/3 C5/2 A#4/1 C5/6', har: 'E4/1 E4/1 E4/1 E4/3 C4/3 D4/3 E4/2 D4/1 E4/6', bas: 'C3/6 G#2/3 A#2/3 C3/9' },
  misterio: { bpm: 90, mel: 'E5/2 D#5/2 E5/2 B4/2 D5/2 C5/2 A4/6', har: '', bas: 'A2/8 E2/6' }
};

AUD.play = function (name, force) {
  if (!AUD.ctx) { AUD.pending = name; return; }
  if (AUD.curName === name && !force) return;
  AUD.stop();
  const s = SONGS[name]; if (!s) return;
  AUD.curName = name;
  const tracks = [['mel', s.melWave || 'sq50', 0.55], ['har', 'sq25', 0.3], ['bas', 'tri', 0.8]].filter(([k]) => s[k]).map(([k, w, g]) => ({ seq: parseSeq(s[k]), wave: w, gain: g, i: 0, t: 0 }));
  const step = 60 / s.bpm / 2; // corchea
  const total = Math.max(...tracks.map(tr => tr.seq.reduce((a, b) => a + b[1], 0)));
  const st = { tracks, step, total, start: AUD.ctx.currentTime + 0.1, loop: 0, drm: s.drm || '', ts: s.ts || 4, nextDrum: 0 };
  AUD.cur = st;
  tracks.forEach(tr => { tr.t = st.start; });
  st.nextDrum = st.start;
  const sched = () => {
    if (AUD.cur !== st) return;
    const ahead = AUD.ctx.currentTime + 0.25;
    tracks.forEach(tr => {
      while (tr.t < ahead) {
        const [n, d] = tr.seq[tr.i]; const dur = d * step;
        if (n !== 'R') tone(tr.t, noteFreq(n), dur * 0.92, tr.wave, tr.gain, AUD.musicGain, { vib: tr.wave !== 'tri' && d >= 3 });
        tr.t += dur; tr.i++;
        if (tr.i >= tr.seq.length) { tr.i = 0; const loopEnd = st.start + total * step * (Math.floor((tr.t - st.start) / (total * step - 1e-6)) + (0)); }
      }
    });
    // sincronía: si una pista termina antes, espera al largo total
    if (st.drm) {
      const pat = st.drm; let k = Math.round((st.nextDrum - st.start) / step);
      while (st.nextDrum < ahead) { const ch = pat[k % pat.length]; if (ch && ch !== '.') drum(st.nextDrum, ch, AUD.musicGain); st.nextDrum += step; k++; }
    }
    AUD.timer = setTimeout(sched, 60);
  };
  // asegurar loops alineados: rellenar pistas cortas con silencio
  tracks.forEach(tr => { const len = tr.seq.reduce((a, b) => a + b[1], 0); if (len < total) tr.seq.push(['R', total - len]); });
  sched();
};
AUD.stop = function () { AUD.cur = null; AUD.curName = null; clearTimeout(AUD.timer); if (AUD.musicGain && AUD.ctx) { const g = AUD.musicGain; const v = g.gain.value; g.gain.cancelScheduledValues(AUD.ctx.currentTime); g.gain.setValueAtTime(0, AUD.ctx.currentTime); g.gain.setValueAtTime(v, AUD.ctx.currentTime + 0.05); } };
AUD.jingle = function (name) {
  if (!AUD.ctx) return Promise.resolve();
  const s = JINGLES[name]; if (!s) return Promise.resolve();
  const prev = AUD.curName; AUD.stop();
  const step = 60 / s.bpm / 2; const t0 = AUD.ctx.currentTime + 0.05; let maxT = 0;
  [['mel', 'sq50', 0.6], ['har', 'sq25', 0.35], ['bas', 'tri', 0.8]].forEach(([k, w, g]) => { if (!s[k]) return; let t = t0; parseSeq(s[k]).forEach(([n, d]) => { if (n !== 'R') tone(t, noteFreq(n), d * step * 0.95, w, g, AUD.sfxGain, { vib: d >= 3 }); t += d * step; }); maxT = Math.max(maxT, t); });
  return new Promise(res => setTimeout(() => { res(); if (prev) AUD.play(prev); }, (maxT - t0) * 1000 + 250));
};
AUD.sfx = function (name) {
  if (!AUD.ctx) return; const t = AUD.ctx.currentTime + 0.01, d = AUD.sfxGain;
  switch (name) {
    case 'blip': tone(t, 880, 0.025, 'sq25', 0.18, d); break;
    case 'select': tone(t, 660, 0.05, 'sq50', 0.3, d); tone(t + 0.05, 990, 0.07, 'sq50', 0.3, d); break;
    case 'move': tone(t, 520, 0.03, 'sq25', 0.2, d); break;
    case 'back': tone(t, 500, 0.05, 'sq50', 0.25, d); tone(t + 0.05, 330, 0.07, 'sq50', 0.25, d); break;
    case 'bump': tone(t, 110, 0.07, 'sq50', 0.3, d); break;
    case 'door': drum(t, 's', d); tone(t, 220, 0.12, 'tri', 0.5, d, { slide: 110 }); break;
    case 'flash': for (let i = 0; i < 8; i++) tone(t + i * 0.04, 400 + i * 180, 0.05, 'sq25', 0.25, d); break;
    case 'warp': tone(t, 200, 0.8, 'sq25', 0.25, d, { slide: 1600 }); tone(t, 300, 0.8, 'tri', 0.4, d, { slide: 2400 }); break;
    case 'correct': tone(t, 784, 0.08, 'sq50', 0.3, d); tone(t + 0.08, 1047, 0.15, 'sq50', 0.3, d); break;
    case 'wrong': tone(t, 300, 0.12, 'sq50', 0.3, d); tone(t + 0.12, 220, 0.2, 'sq50', 0.3, d); break;
    case 'hit': drum(t, 's', d); tone(t, 180, 0.1, 'sq50', 0.3, d, { slide: 80 }); break;
    case 'heal': [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.06, f, 0.08, 'sq25', 0.25, d)); break;
    case 'alert': tone(t, 1200, 0.06, 'sq50', 0.35, d); tone(t + 0.08, 1200, 0.1, 'sq50', 0.35, d); break;
    case 'bark': tone(t, 520, 0.06, 'sq25', 0.35, d, { slide: 300 }); tone(t + 0.12, 560, 0.07, 'sq25', 0.35, d, { slide: 320 }); break;
    case 'step': drum(t, 'h', d); break;
    case 'push': tone(t, 90, 0.15, 'tri', 0.6, d, { slide: 70 }); break;
    case 'page': drum(t, 'h', d); tone(t, 1500, 0.04, 'sq12', 0.1, d, { slide: 800 }); break;
    case 'gallop': for (let i = 0; i < 6; i++) drum(t + i * 0.12 + (i % 2) * 0.04, 'k', d); break;
    case 'whistle': tone(t, 1800, 0.12, 'sine', 0.35, d, { slide: 2400 }); tone(t + 0.15, 2200, 0.12, 'sine', 0.35, d, { slide: 1700 }); break;
  }
};
// Nota individual (minijuegos de melodía): instrumento guitarra/piano/silbido
AUD.note = function (n, inst = 'piano', dur = 0.35) {
  if (!AUD.ctx) return; const t = AUD.ctx.currentTime + 0.01;
  const f = noteFreq(n);
  if (inst === 'silbido') tone(t, f * 2, dur, 'sine', 0.4, AUD.sfxGain, { vib: true });
  else if (inst === 'guitarra') { tone(t, f, dur, 'sq12', 0.35, AUD.sfxGain, { sus: 0.3 }); tone(t, f * 2, dur * 0.6, 'tri', 0.25, AUD.sfxGain, { sus: 0.2 }); }
  else { tone(t, f, dur, 'tri', 0.6, AUD.sfxGain, { sus: 0.4 }); tone(t, f * 2, dur * 0.5, 'sq25', 0.12, AUD.sfxGain, { sus: 0.2 }); }
};
