/* =========================================================
   audio.js ― 自作チップチューンBGMと効果音（WebAudio）
   ========================================================= */
(function () {
const AU = G.audio = { ctx: null, bgmGain: null, sfxGain: null, cur: null, timer: null, step: 0, nextT: 0 };
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n) { const m = /^([A-G]#?)(\d)$/.exec(n); if (!m) return 0; return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12); }
function parse(s) { return s.trim().split(/\s+/); }

AU.init = function () {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume().catch(() => {}); return true; }
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.bgmGain = AU.ctx.createGain(); AU.sfxGain = AU.ctx.createGain();
    AU.bgmGain.connect(AU.ctx.destination); AU.sfxGain.connect(AU.ctx.destination);
    AU.applyVol();
    const len = AU.ctx.sampleRate * 0.3, buf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = buf;
    return true;
  } catch (e) { AU.ctx = null; return false; }
};
AU.applyVol = function () {
  if (!AU.ctx) return;
  const m = G.set.mute ? 0 : 1;
  AU.bgmGain.gain.value = 0.22 * G.set.bgm * m;
  AU.sfxGain.gain.value = 0.5 * G.set.sfx * m;
};
function tone(f, t, dur, type, vol, dest, slide) {
  if (!AU.ctx || !f) return;
  const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, vol, dest, hp) {
  if (!AU.ctx || !AU.noise) return;
  const s = AU.ctx.createBufferSource(), g = AU.ctx.createGain(), f = AU.ctx.createBiquadFilter();
  s.buffer = AU.noise; f.type = 'highpass'; f.frequency.value = hp || 6000;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur);
}

/* ---------- BGM（1ステップ＝8分音符） ---------- */
const T = AU.tracks = {
  title: { bpm: 104, lead: 'A4 _ C5 _ E5 _ D5 C5 B4 _ G4 _ B4 C5 D5 _ C5 _ E5 _ A5 _ G5 E5 F5 _ E5 D5 E5 _ _ _ A4 _ C5 _ E5 _ D5 C5 B4 _ G4 _ E5 D5 C5 _ A4 _ B4 C5 D5 _ C5 B4 A4 _ _ _ _ _',
           bass: 'A2 . A3 . A2 . A3 . G2 . G3 . G2 . G3 . F2 . F3 . F2 . F3 . E2 . E3 . E2 . G#2 . A2 . A3 . A2 . A3 . G2 . G3 . G2 . G3 . F2 . F3 . E2 . E3 . A2 . E2 . A2 . . .', hat: true },
  explore: { bpm: 96, lead: 'D5 _ . F5 E5 _ D5 . A4 _ _ . . . . . C5 _ . E5 D5 _ C5 . A4 _ _ . . . . . D5 _ F5 _ A5 _ G5 F5 E5 _ D5 _ C#5 _ . . D5 _ . . A4 . D5 . E5 _ _ _ . . . .',
             bass: 'D3 . A2 . D3 . A2 . D3 . A2 . D3 . A2 . C3 . G2 . C3 . G2 . C3 . G2 . C3 . G2 . A#2 . F2 . A#2 . F2 . A2 . E2 . A2 . C#3 . D3 . A2 . D3 . A2 . D3 . . . D2 . . .' },
  creepy: { bpm: 70, lead: 'E5 _ _ . D#5 _ _ . E5 _ . . A#4 _ _ _ . . . . G5 _ F#5 _ E5 _ _ . . . . . E5 _ _ . D#5 _ _ . G5 _ . . A#4 _ _ _ . . . . B4 _ C5 _ B4 _ _ _ . . . .',
            bass: 'E2 _ _ _ E2 _ _ _ E2 _ _ _ A#1 _ _ _ E2 _ _ _ E2 _ _ _ D#2 _ _ _ D#2 _ _ _ E2 _ _ _ E2 _ _ _ E2 _ _ _ A#1 _ _ _ E2 _ _ _ E2 _ _ _ B1 _ _ _ B1 _ _ _' },
  talk: { bpm: 112, lead: 'G4 . B4 . D5 . B4 . C5 _ A4 . . . . . F#4 . A4 . C5 . A4 . B4 _ G4 . . . . . G4 . B4 . D5 . G5 . F#5 _ E5 . D5 . C5 . B4 . A4 . G4 . A4 _ _ . . . . .',
          bass: 'G2 . D3 . G2 . D3 . A2 . E3 . A2 . E3 . D2 . A2 . D2 . A2 . G2 . D3 . G2 . D3 . E2 . B2 . E2 . B2 . C3 . G2 . C3 . G2 . D3 . A2 . D3 . A2 . D2 . F#2 . A2 . D3 .' },
  testimony: { bpm: 150, lead: 'E5 . E5 . G5 . E5 . D5 . D5 . C5 . B4 . E5 . E5 . G5 . A5 . B5 _ _ . A5 . G5 . E5 . E5 . G5 . E5 . D5 . D5 . C5 . B4 . C5 . B4 . A4 . G4 . A4 _ _ _ . . . .',
               bass: 'E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 C2 C3 D2 D3 D2 D3 E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 D2 D3 E2 E3 E2 E3 A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 G1 G2 G1 G2 A1 A2 A1 A2 B1 B2 B1 B2 E2 E3 E2 E3 E2 . . .', hat: true },
  truth: { bpm: 124, lead: 'C5 _ E5 _ G5 _ C6 _ B5 _ G5 _ E5 _ D5 _ F5 _ A5 _ F5 _ D5 _ E5 _ G5 _ C5 _ _ _ C5 _ E5 _ G5 _ C6 _ D6 _ C6 _ B5 _ A5 _ G5 _ F5 _ E5 _ D5 _ C5 _ _ _ _ _ _ _',
           bass: 'C3 . G2 . C3 . G2 . E2 . B2 . E2 . B2 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . G2 . E2 . B2 . E2 . B2 . F2 . C3 . G2 . D3 . C3 . G2 . C3 . . .', hat: true },
  ending: { bpm: 84, lead: 'E5 _ _ D5 C5 _ G4 _ A4 _ _ G4 E4 _ _ _ F4 _ _ G4 A4 _ C5 _ B4 _ _ _ G4 _ _ _ E5 _ _ D5 C5 _ G4 _ A4 _ _ C5 E5 _ _ _ D5 _ _ C5 B4 _ G4 _ C5 _ _ _ _ _ _ _',
            bass: 'C3 _ G3 _ E3 _ G3 _ F2 _ C3 _ A2 _ C3 _ D3 _ A2 _ F2 _ A2 _ G2 _ D3 _ B2 _ D3 _ C3 _ G3 _ E3 _ G3 _ A2 _ E3 _ C3 _ E3 _ F2 _ C3 _ G2 _ D3 _ C3 _ G2 _ C3 _ _ _' },
  inter: { bpm: 116, lead: 'C5 . E5 . G5 . E5 . F5 . A5 . G5 _ . . E5 . G5 . C6 . B5 . A5 . G5 . E5 _ . . D5 . F5 . A5 . F5 . E5 . G5 . C6 _ . . B5 . G5 . A5 . F5 . G5 _ _ _ . . . .',
           bass: 'C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . A2 . E3 . A2 . E3 . F2 . C3 . G2 . D3 . D3 . A2 . D3 . A2 . C3 . G2 . C3 . G2 . F2 . C3 . G2 . D3 . C3 . G2 . C3 . . .', hat: true },
};
for (const k in T) { T[k].L = parse(T[k].lead); T[k].B = parse(T[k].bass); }

AU.bgm = function (name) {
  if (AU.curName === name) return;
  AU.curName = name;
  AU.cur = name ? T[name] : null; AU.step = 0;
  if (!AU.ctx) return;
  AU.nextT = AU.ctx.currentTime + 0.08;
  if (!AU.timer) AU.timer = setInterval(sched, 40);
};
function sched() {
  if (!AU.ctx || !AU.cur) return;
  const tr = AU.cur, dt = 60 / tr.bpm / 2;
  while (AU.nextT < AU.ctx.currentTime + 0.2) {
    const i = AU.step % tr.L.length, j = AU.step % tr.B.length;
    const n = tr.L[i]; if (n !== '.' && n !== '_') { let len = 1; while (tr.L[(i + len) % tr.L.length] === '_' && len < 8) len++; tone(freq(n), AU.nextT, dt * len * 0.95, 'square', 0.16, AU.bgmGain); }
    const b = tr.B[j]; if (b !== '.' && b !== '_') { let len = 1; while (tr.B[(j + len) % tr.B.length] === '_' && len < 8) len++; tone(freq(b), AU.nextT, dt * len * 0.9, 'triangle', 0.32, AU.bgmGain); }
    if (tr.hat && AU.step % 2 === 1) noise(AU.nextT, 0.04, 0.08, AU.bgmGain);
    AU.nextT += dt; AU.step++;
  }
}

/* ---------- 効果音 ---------- */
AU.sfx = function (name, p) {
  if (!AU.ctx || G.auto) return;
  const t = AU.ctx.currentTime, D = AU.sfxGain;
  switch (name) {
    case 'blip': tone(p || 600, t, 0.035, 'square', 0.08, D); break;
    case 'move': tone(880, t, 0.04, 'square', 0.06, D); break;
    case 'ok': tone(660, t, 0.05, 'square', 0.08, D); tone(990, t + 0.05, 0.07, 'square', 0.08, D); break;
    case 'back': tone(500, t, 0.05, 'square', 0.07, D); tone(330, t + 0.05, 0.07, 'square', 0.07, D); break;
    case 'step': noise(t, 0.03, 0.03, D, 2000); break;
    case 'door': tone(220, t, 0.08, 'triangle', 0.2, D); tone(180, t + 0.08, 0.1, 'triangle', 0.2, D); break;
    case 'found': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.14, 'square', 0.12, D)); break;
    case 'combine': [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.12, 'triangle', 0.25, D)); tone(1568, t + 0.3, 0.3, 'square', 0.08, D); break;
    case 'reveal': tone(1200, t, 0.08, 'sine', 0.2, D); tone(1600, t + 0.08, 0.1, 'sine', 0.2, D); tone(2000, t + 0.16, 0.2, 'sine', 0.15, D); break;
    case 'bark': tone(700, t, 0.07, 'sawtooth', 0.15, D, 420); tone(760, t + 0.15, 0.07, 'sawtooth', 0.15, D, 450); break;
    case 'contra': noise(t, 0.25, 0.35, D, 800); [880, 1175, 1568].forEach((f, i) => tone(f, t + 0.05 + i * 0.05, 0.25, 'sawtooth', 0.15, D)); tone(196, t, 0.4, 'square', 0.25, D); break;
    case 'wrong': tone(220, t, 0.25, 'sawtooth', 0.22, D, 110); tone(160, t + 0.18, 0.35, 'sawtooth', 0.22, D, 80); break;
    case 'shock': noise(t, 0.4, 0.3, D, 300); tone(110, t, 0.5, 'square', 0.25, D, 55); break;
    case 'accuse': noise(t, 0.5, 0.4, D, 500); [130, 196, 261, 392].forEach(f => tone(f, t, 1.2, 'sawtooth', 0.12, D)); [523, 659, 784].forEach((f, i) => tone(f, t + 0.35 + i * 0.08, 0.6, 'square', 0.1, D)); break;
    case 'start': [196, 262, 330, 392].forEach((f, i) => tone(f, t + i * 0.12, 0.3, 'square', 0.12, D)); noise(t + 0.5, 0.3, 0.2, D, 1500); break;
    case 'success': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.2, 'square', 0.12, D)); break;
    case 'rank': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.3, 'triangle', 0.3, D)); break;
  }
};
})();
