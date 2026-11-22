/* =========================================================
   art.js ― プログラムで描くドット絵（キャラ・立ち絵・タイル・アイコン）
   ========================================================= */
(function () {
const A = G.art = {};
const cache = {};
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c, g }; }
function R(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x, y, w == null ? 1 : w, h == null ? 1 : h); }
function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(gg) << 8) | f(b)).toString(16).slice(1);
}
A.cv = cv; A.R = R; A.shade = shade;
function flipH(src) { const { c, g } = cv(src.width, src.height); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
A.flipH = flipH;

/* =================== 16x16 マップ用キャラ =================== */
const BODY = {
  f: ["................", "................", ".....SSSSSS.....", "....SSSSSSSS....", "....SSSSSSSS....", "....SSESSESS....", "....SSSSSSSS....", ".....SSMMSS.....", "......SSSS......", "....CCCCCCCC....", "...CCCCIICCCC...", "...SCCCIICCCS...", "...SCCCCCCCCS...", "....PPPPPPPP....", "....PP....PP....", "....KK....KK...."],
  b: ["................", "................", ".....SSSSSS.....", "....SSSSSSSS....", "....SSSSSSSS....", "....SSSSSSSS....", "....SSSSSSSS....", ".....SSSSSS.....", "......SSSS......", "....CCCCCCCC....", "...CCCCCCCCCC...", "...SCCCCCCCCS...", "...SCCCCCCCCS...", "....PPPPPPPP....", "....PP....PP....", "....KK....KK...."],
  s: ["................", "................", ".....SSSSSS.....", "....SSSSSSSS....", "....SSSSSSSS....", "....SESSSSSS....", "...SSSSSSSSS....", ".....MSSSSS.....", "......SSSS......", "....CCCCCCCC....", "....CCSCCCCC....", "....CCSCCCCC....", "....CCCCCCCC....", "....PPPPPPPP....", ".....PP..PP.....", ".....KK..KK....."],
};
const STEP = { f: ["....PP.....P....", "....KK.....K...."], b: ["....P.....PP....", "....K.....KK...."], s: ["....PP....PP....", "....KK....KK...."] };

function hairSprite(g, L, d) {
  const h = L.hair || '#2b1e14', st = L.style || 'short';
  if (st === 'bald') { if (d !== 'b') R(g, shade(L.skin || '#f2c9a0', 0.45), 6, 3, 2, 1); return; }
  if (d === 'f') {
    R(g, h, 4, 1, 8, 2);
    if (st === 'slick') { R(g, h, 4, 3, 1, 2); R(g, h, 11, 3, 1, 2); }
    else { R(g, h, 4, 3, 8, 1); R(g, h, 4, 4, 1, 2); R(g, h, 11, 4, 1, 2); }
    if (st === 'long') { R(g, h, 3, 4, 2, 8); R(g, h, 11, 4, 2, 8); }
    if (st === 'bob') { R(g, h, 3, 4, 2, 5); R(g, h, 11, 4, 2, 5); }
    if (st === 'spiky') { [5, 7, 9].forEach(x => R(g, h, x, 0, 1, 1)); R(g, h, 11, 0, 1, 1); }
    if (st === 'bun') R(g, h, 6, 0, 4, 1);
    if (st === 'curly') { R(g, h, 5, 0, 2, 1); R(g, h, 9, 0, 2, 1); R(g, h, 3, 3, 1, 2); R(g, h, 12, 3, 1, 2); }
  } else if (d === 'b') {
    if (st === 'long') R(g, h, 3, 1, 10, 11);
    else if (st === 'bob') R(g, h, 3, 1, 10, 8);
    else R(g, h, 4, 1, 8, 7);
    if (st === 'ponytail') R(g, h, 7, 8, 2, 4);
    if (st === 'spiky') [5, 7, 9, 11].forEach(x => R(g, h, x, 0, 1, 1));
    if (st === 'bun') R(g, h, 6, 0, 4, 2);
  } else {
    R(g, h, 4, 1, 8, 3); R(g, h, 9, 4, 3, 3);
    if (st === 'slick') R(g, shade(L.skin || '#f2c9a0', 0), 4, 3, 1, 1);
    if (st === 'long') R(g, h, 9, 4, 4, 8);
    if (st === 'bob') R(g, h, 9, 4, 4, 5);
    if (st === 'ponytail') R(g, h, 12, 3, 2, 5);
    if (st === 'spiky') [6, 8, 10].forEach(x => R(g, h, x, 0, 1, 1));
    if (st === 'bun') R(g, h, 8, 0, 3, 1);
  }
}
function accSprite(g, L, d) {
  const acc = L.acc || [];
  if (acc.includes('glasses')) { if (d === 'f') { R(g, '#111', 5, 5, 6, 1); R(g, '#bfe2ff', 6, 5, 1, 1); R(g, '#bfe2ff', 9, 5, 1, 1); } else if (d === 's') { R(g, '#111', 3, 5, 3, 1); R(g, '#bfe2ff', 5, 5, 1, 1); } }
  if (acc.includes('mustache') && d === 'f') R(g, L.hair, 6, 7, 4, 1);
  if (acc.includes('tie') && d === 'f') R(g, '#8a1f2a', 7, 10, 2, 3);
  if (acc.includes('apron') && d !== 'b') R(g, '#f4f4f4', d === 'f' ? 5 : 5, 10, d === 'f' ? 6 : 4, 4);
  if (acc.includes('cap')) { const c = L.hatc || '#2a4a8a'; R(g, c, 4, 0, 8, 3); if (d === 'f') R(g, shade(c, -0.3), 4, 3, 8, 1); if (d === 's') R(g, shade(c, -0.3), 2, 3, 3, 1); }
  if (acc.includes('beret')) { const c = L.hatc || '#a83232'; R(g, c, 3, 0, 9, 2); R(g, c, 4, 2, 8, 1); }
  if (acc.includes('headset')) { R(g, '#222', 4, 1, 8, 1); if (d !== 'b') { R(g, '#222', d === 'f' ? 3 : 9, 4, 1, 3); } }
  if (acc.includes('hat')) { const c = L.hatc || '#3a3030'; R(g, c, 3, 2, 10, 1); R(g, c, 5, 0, 6, 2); }
  if (acc.includes('badge') && d === 'f') R(g, '#f2c14e', 5, 10, 1, 1);
  if (acc.includes('cane') && d !== 'b') R(g, '#6b4a2a', d === 'f' ? 13 : 3, 9, 1, 7);
  if (L.outfit === 'denim' && d !== 'b') { R(g, shade(L.cloth, 0.3), d === 'f' ? 4 : 5, 9, 1, 4); if (d === 'f') R(g, shade(L.cloth, 0.3), 11, 9, 1, 4); }
}
A.sprite = function (L, dir, frame) {
  dir = dir || 'down'; frame = frame || 0;
  if (L.kind === 'dog') return A.dogSprite(dir, frame);
  if (L.kind === 'robot') return A.robotSprite(frame);
  const key = 'S' + JSON.stringify(L) + dir + frame;
  if (cache[key]) return cache[key];
  const d = dir === 'up' ? 'b' : dir === 'down' ? 'f' : 's';
  const { c, g } = cv(16, 16);
  const pal = { S: L.skin || '#f2c9a0', E: '#222', M: '#b55', C: L.cloth || '#445', I: L.cloth2 || '#eee', P: L.pants || shade(L.cloth || '#445', -0.4), K: L.shoes || '#2a2222' };
  if (L.skirt) pal.P = L.pants || shade(L.cloth, -0.3);
  const rows = BODY[d].slice();
  if (frame) { rows[14] = STEP[d][0]; rows[15] = STEP[d][1]; }
  if (L.skirt) { rows[13] = d === 's' ? "....PPPPPPPPP..." : "...PPPPPPPPPP..."; if (!frame) rows[14] = d === 's' ? ".....SS..SS....." : "....SS....SS...."; }
  if (L.kid) { rows[13] = rows[13]; }
  rows.forEach((row, y) => [...row].forEach((k, x) => { if (k !== '.') R(g, pal[k] || '#f0f', x, y); }));
  if (L.outfit === 'suit' || L.outfit === 'coat') { if (d === 'f') R(g, pal.I, 7, 9, 2, 3); }
  if (L.outfit === 'coat' && d !== 'b') R(g, shade(pal.C, -0.25), d === 'f' ? 4 : 4, 13, 8, 1);
  hairSprite(g, L, d);
  accSprite(g, L, d);
  let out = c;
  if (dir === 'right') out = flipH(c);
  cache[key] = out; return out;
};
A.dogSprite = function (dir, frame) {
  const key = 'DOG' + dir + frame; if (cache[key]) return cache[key];
  const { c, g } = cv(16, 16), O = '#d98a3a', Od = '#b56a26', W = '#f6ead8', K = '#1d1410', Rd = '#c0392b';
  const lf = frame ? 1 : 0;
  if (dir === 'down') {
    R(g, O, 3, 2, 2, 2); R(g, O, 11, 2, 2, 2); R(g, '#f3b9a0', 4, 3, 1, 1); R(g, '#f3b9a0', 11, 3, 1, 1);
    R(g, O, 3, 4, 10, 5); R(g, W, 4, 4, 1, 1); R(g, W, 11, 4, 1, 1);
    R(g, K, 5, 5, 1, 1); R(g, K, 10, 5, 1, 1); R(g, W, 4, 6, 8, 3); R(g, K, 7, 6, 2, 1); R(g, '#e07a7a', 7, 8, 2, 1);
    R(g, Rd, 4, 9, 8, 1); R(g, O, 4, 10, 8, 4); R(g, W, 6, 10, 4, 3);
    R(g, O, 4, 14, 2, 1 + lf); R(g, O, 10, 14, 2, 2 - lf); R(g, W, 4, 15, 2, 1); R(g, W, 10, 15, 2, 1);
  } else if (dir === 'up') {
    R(g, O, 3, 2, 2, 2); R(g, O, 11, 2, 2, 2); R(g, O, 3, 4, 10, 5); R(g, Od, 3, 8, 10, 1);
    R(g, Rd, 4, 9, 8, 1); R(g, O, 4, 10, 8, 4); R(g, O, 7, 7, 2, 2); R(g, W, 7, 8, 1, 1);
    R(g, O, 4, 14, 2, 2 - lf); R(g, O, 10, 14, 2, 1 + lf);
  } else {
    R(g, O, 5, 2, 2, 2); R(g, O, 2, 4, 7, 5); R(g, W, 0, 6, 4, 3); R(g, K, 0, 6, 1, 1); R(g, K, 4, 5, 1, 1); R(g, W, 4, 4, 1, 1);
    R(g, Rd, 7, 8, 2, 3); R(g, O, 6, 9, 8, 4); R(g, W, 7, 12, 6, 1);
    R(g, O, 13, 6, 2, 3); R(g, W, 13, 6, 1, 1);
    R(g, O, 7, 13, 2, 2 - lf); R(g, O, 11, 13, 2, 1 + lf); R(g, W, 7, 15 - lf, 2, 1); R(g, W, 11, 14 + lf, 2, 1);
  }
  let out = c; if (dir === 'right') out = flipH(c);
  cache[key] = out; return out;
};
A.robotSprite = function (frame) {
  const key = 'ROB' + frame; if (cache[key]) return cache[key];
  const { c, g } = cv(16, 16);
  const y = frame ? 1 : 0;
  R(g, '#888', 7, 0 + y, 2, 2); R(g, '#ff5a5a', 7, 0 + y, 2, 1);
  R(g, '#2a3a5a', 3, 2 + y, 10, 7); R(g, '#eef4ff', 4, 3 + y, 8, 5); R(g, '#3ad1ff', 5, 4 + y, 2, 2); R(g, '#3ad1ff', 9, 4 + y, 2, 2); R(g, '#f59ab0', 5, 7 + y, 1, 1); R(g, '#f59ab0', 10, 7 + y, 1, 1);
  R(g, '#2a3a5a', 5, 9, 6, 5); R(g, '#d0dcf0', 6, 10, 4, 3); R(g, '#3ad1ff', 7, 11, 2, 1);
  R(g, '#9aa8c0', 3, 10, 2, 3); R(g, '#9aa8c0', 11, 10, 2, 3); R(g, '#556', 5, 14, 2, 2); R(g, '#556', 9, 14, 2, 2);
  cache[key] = c; return c;
};
A.phoneIcon = function (ex) {
  const key = 'PHN' + ex; if (cache[key]) return cache[key];
  const { c, g } = cv(16, 16);
  R(g, '#1c1c24', 3, 0, 10, 16); R(g, '#bde6ff', 4, 2, 8, 11); R(g, '#555', 7, 14, 2, 1);
  R(g, '#2a3a5a', 5, 4, 6, 6); R(g, '#eef4ff', 6, 5, 4, 4);
  if (ex === 'alert') { R(g, '#ff5a5a', 6, 6, 1, 2); R(g, '#ff5a5a', 9, 6, 1, 2); } else { R(g, '#3ad1ff', 6, 6, 1, 1); R(g, '#3ad1ff', 9, 6, 1, 1); }
  R(g, '#888', 7, 3, 2, 1);
  cache[key] = c; return c;
};

/* =================== 立ち絵（48x56） =================== */
function eyes(g, ex, x0, y0, d, fem, kid, isL) {
  const W = '#fff';
  switch (ex) {
    case 'smile': R(g, d, x0, y0 + 2, 1, 1); R(g, d, x0 + 1, y0 + 1, 3, 1); R(g, d, x0 + 4, y0 + 2, 1, 1); break;
    case 'angry': case 'point': R(g, d, x0, y0 + 1, 5, 3); R(g, W, x0 + (isL ? 3 : 1), y0 + 2, 1, 1); break;
    case 'surp': R(g, W, x0, y0 - 1, 5, 5); R(g, d, x0, y0 - 1, 5, 1); R(g, d, x0 + 2, y0 + 1, 2, 2); break;
    case 'conf': if (isL) { R(g, d, x0 + 1, y0, 3, 4); R(g, W, x0 + 2, y0 + 1, 1, 1); } else R(g, d, x0, y0 + 2, 5, 1); break;
    case 'sweat': case 'shake': R(g, W, x0, y0, 5, 4); R(g, d, x0, y0, 5, 1); R(g, d, x0 + 2, y0 + 2, 1, 1); break;
    case 'cry': R(g, d, x0, y0 + 1, 1, 1); R(g, d, x0 + 1, y0 + 2, 3, 1); R(g, d, x0 + 4, y0 + 1, 1, 1); R(g, '#8fd0ff', x0 + 1, y0 + 3, 2, 9); break;
    case 'lie': R(g, W, x0, y0, 5, 4); R(g, d, x0, y0, 5, 1); R(g, d, x0, y0 + 1, 2, 2); break;
    default: R(g, d, x0 + 1, y0, 3, kid ? 5 : 4); R(g, W, x0 + 2, y0 + 1, 1, 1);
  }
  if (fem && !['smile', 'cry'].includes(ex)) { R(g, d, x0, y0 - 1, 5, 1); R(g, d, isL ? x0 - 1 : x0 + 5, y0 - 1, 1, 1); }
}
function brows(g, ex, x0, c) {
  const y = 17;
  switch (ex) {
    case 'angry': case 'point': R(g, c, x0, y - 1, 2, 1); R(g, c, x0 + 2, y, 2, 1); R(g, c, x0 + 4, y + 1, 1, 1); break;
    case 'surp': R(g, c, x0, y - 3, 5, 1); break;
    case 'sweat': case 'shake': case 'cry': case 'lie': R(g, c, x0, y + 1, 2, 1); R(g, c, x0 + 2, y, 2, 1); R(g, c, x0 + 4, y - 1, 1, 1); break;
    case 'conf': R(g, c, x0, y - 1, 5, 1); break;
    default: R(g, c, x0, y, 5, 1);
  }
}
function browsMirror(g, ex, x0, c) {
  const y = 17;
  switch (ex) {
    case 'angry': case 'point': R(g, c, x0 + 3, y - 1, 2, 1); R(g, c, x0 + 1, y, 2, 1); R(g, c, x0, y + 1, 1, 1); break;
    case 'surp': R(g, c, x0, y - 3, 5, 1); break;
    case 'sweat': case 'shake': case 'cry': case 'lie': R(g, c, x0 + 3, y + 1, 2, 1); R(g, c, x0 + 1, y, 2, 1); R(g, c, x0, y - 1, 1, 1); break;
    case 'conf': R(g, c, x0, y + 1, 5, 1); break;
    default: R(g, c, x0, y, 5, 1);
  }
}
function mouth(g, ex, fem) {
  const m = fem ? '#b84a50' : '#8a3a32', o = '#5a1a1a';
  switch (ex) {
    case 'smile': R(g, m, 20, 30, 1, 1); R(g, m, 21, 31, 6, 1); R(g, m, 27, 30, 1, 1); R(g, '#fff', 22, 31, 4, 0); break;
    case 'angry': case 'point': R(g, o, 20, 30, 8, 4); R(g, '#fff', 21, 30, 6, 1); break;
    case 'surp': R(g, o, 22, 30, 4, 4); break;
    case 'conf': R(g, m, 21, 32, 2, 1); R(g, m, 23, 31, 2, 1); R(g, m, 25, 32, 2, 1); break;
    case 'sweat': R(g, m, 20, 31, 2, 1); R(g, m, 22, 32, 2, 1); R(g, m, 24, 31, 2, 1); R(g, m, 26, 32, 2, 1); break;
    case 'cry': R(g, o, 20, 30, 8, 3); R(g, m, 20, 30, 2, 1); R(g, m, 26, 30, 2, 1); break;
    case 'shake': for (let i = 0; i < 8; i++) R(g, m, 20 + i, 31 + (i % 2), 1, 1); break;
    case 'lie': R(g, m, 21, 32, 4, 1); R(g, m, 25, 31, 2, 1); break;
    default: R(g, m, 21, 31, 6, 1);
  }
}
function hairBack(g, L, h) {
  const st = L.style;
  if (st === 'long') R(g, h, 7, 10, 34, 40);
  if (st === 'bob') R(g, h, 8, 10, 32, 26);
  if (st === 'ponytail') { R(g, h, 37, 10, 7, 28); R(g, shade(h, -0.25), 37, 30, 7, 8); }
}
function capShape(g, h, y0, y1) {
  const ins = [8, 5, 3, 2, 1, 1];
  for (let y = y0; y <= y1; y++) { const i = ins[y - y0] != null ? ins[y - y0] : 0; R(g, h, 10 + i, y, 28 - i * 2, 1); }
}
function hairFront(g, L, h) {
  const st = L.style || 'short', hl = shade(h, 0.3);
  if (st === 'bald') { R(g, shade(L.skin, 0.5), 18, 10, 6, 2); R(g, shade(L.skin, 0.3), 16, 12, 3, 1); return; }
  if (st === 'slick') { capShape(g, h, 4, 13); R(g, h, 10, 12, 3, 10); R(g, h, 35, 12, 3, 10); R(g, hl, 15, 7, 12, 1); R(g, hl, 14, 9, 6, 1); return; }
  capShape(g, h, 4, 15);
  R(g, h, 11, 15, 26, 2);
  [[12, 4], [17, 3], [22, 5], [28, 3], [32, 4]].forEach(([x, w]) => R(g, h, x, 17, w, 1));
  R(g, h, 10, 15, 3, 9); R(g, h, 35, 15, 3, 9);
  R(g, hl, 16, 7, 10, 1);
  if (st === 'spiky') { [12, 18, 24, 30].forEach(x => { R(g, h, x, 2, 5, 3); R(g, h, x + 1, 0, 3, 2); }); R(g, h, 8, 8, 3, 4); R(g, h, 37, 8, 3, 4); }
  if (st === 'long') { R(g, h, 6, 14, 6, 38); R(g, h, 36, 14, 6, 38); R(g, hl, 8, 20, 1, 20); }
  if (st === 'bob') { R(g, h, 7, 14, 5, 22); R(g, h, 36, 14, 5, 22); R(g, shade(h, -0.2), 7, 34, 5, 2); R(g, shade(h, -0.2), 36, 34, 5, 2); }
  if (st === 'ponytail') { R(g, '#d04060', 36, 12, 3, 3); }
  if (st === 'bun') { R(g, h, 17, 0, 14, 6); R(g, hl, 19, 1, 6, 1); }
  if (st === 'curly') { for (let x = 9; x < 39; x += 4) R(g, h, x, 5 + (x % 8 ? 1 : 0), 3, 3); R(g, h, 8, 14, 4, 12); R(g, h, 36, 14, 4, 12); }
}
function torso(g, L, pose) {
  const cl = L.cloth || '#445', cld = shade(cl, -0.3), cll = shade(cl, 0.2), c2 = L.cloth2 || '#eee', sk = L.skin;
  R(g, cl, 10, 42, 28, 2); R(g, cl, 6, 44, 36, 12);
  R(g, cld, 6, 44, 2, 12); R(g, cld, 40, 44, 2, 12);
  const o = L.outfit || 'shirt';
  if (o === 'suit' || o === 'coat' || o === 'uniform') {
    for (let y = 42; y < 56; y++) { const w = Math.max(0, 8 - Math.floor((y - 42) * 0.55)); if (w) R(g, c2, 24 - w / 2, y, w, 1); }
    R(g, cld, 15, 42, 3, 14); R(g, cld, 30, 42, 3, 14);
    if ((L.acc || []).includes('tie') || o === 'suit') R(g, L.tie || '#8a1f2a', 23, 43, 2, 10);
    if (o === 'coat') { R(g, cll, 12, 44, 2, 12); R(g, cll, 34, 44, 2, 12); }
    if (o === 'uniform') { R(g, '#f2c14e', 13, 47, 3, 3); R(g, '#c9a227', 13, 50, 3, 1); }
  } else if (o === 'denim') {
    R(g, c2, 19, 42, 10, 14); R(g, cll, 14, 42, 5, 4); R(g, cll, 29, 42, 5, 4);
    for (let y = 46; y < 56; y += 3) { R(g, cll, 11, y, 6, 1); R(g, cll, 31, y, 6, 1); }
    R(g, '#c9a227', 17, 48, 1, 1); R(g, '#c9a227', 30, 48, 1, 1); R(g, cld, 18, 42, 1, 14); R(g, cld, 29, 42, 1, 14);
  } else if (o === 'dress') {
    R(g, sk, 18, 42, 12, 3); R(g, cll, 17, 45, 14, 1);
  } else if (o === 'vest') {
    R(g, c2, 16, 42, 16, 14); R(g, cl, 6, 44, 11, 12); R(g, cl, 31, 44, 11, 12); R(g, cld, 9, 50, 5, 3); R(g, cld, 34, 50, 5, 3); R(g, '#3a3a3a', 6, 53, 36, 2);
  } else if (o === 'knit') {
    for (let y = 44; y < 56; y += 2) R(g, cll, 8, y, 32, 1); R(g, c2, 19, 42, 10, 3);
  } else if (o === 'hoodie') {
    R(g, cld, 14, 41, 20, 4); R(g, c2, 21, 45, 1, 6); R(g, c2, 26, 45, 1, 6); R(g, cld, 16, 50, 16, 5);
  } else if (o === 'apron') {
    R(g, c2, 20, 42, 8, 3); R(g, '#fafafa', 14, 46, 20, 10); R(g, '#ddd', 14, 46, 20, 1);
  } else { // shirt
    R(g, c2, 18, 42, 4, 3); R(g, c2, 26, 42, 4, 3); R(g, cld, 23, 45, 2, 1); R(g, cld, 23, 49, 2, 1); R(g, cld, 23, 53, 2, 1);
  }
  if ((L.acc || []).includes('necklace')) R(g, '#f2e6c8', 18, 44, 12, 1);
  if (pose === 'point') {
    // 右肩から左へ伸ばした腕と指さし
    for (let i = 0; i < 30; i++) { const x = 36 - i, y = 47 - Math.floor(i * 0.45); R(g, cl, x, y, 3, 6); R(g, cld, x, y + 5, 3, 1); }
    R(g, sk, 2, 30, 7, 6); R(g, sk, 0, 31, 3, 2); R(g, shade(sk, -0.2), 3, 35, 6, 1); R(g, shade(sk, -0.2), 5, 30, 1, 3);
  }
}
A.portrait = function (L, ex, pose) {
  ex = ex || 'n';
  if (L.kind === 'dog') return dogPortrait(ex);
  if (L.kind === 'robot') return robotPortrait(ex);
  const key = 'P' + JSON.stringify(L) + ex + (pose || '');
  if (cache[key]) return cache[key];
  const { c, g } = cv(48, 56);
  const sk = L.skin || '#f2c9a0', skd = shade(sk, -0.15), h = L.hair || '#2b1e14', fem = !!L.female, acc = L.acc || [], kid = !!L.kid;
  const old = acc.includes('old');
  hairBack(g, L, h);
  torso(g, L, pose === 'point' ? null : null);
  R(g, sk, 20, 34, 8, 9); R(g, skd, 20, 34, 8, 3);
  // 頭
  const top = [7, 4, 3, 2, 1, 1], bot = [9, 6, 4, 3, 2, 1];
  for (let y = 8; y <= 38; y++) {
    let ins = 0; if (y - 8 < 6) ins = top[y - 8]; if (38 - y < 6) ins = Math.max(ins, bot[38 - y]);
    R(g, sk, 11 + ins, y, 26 - ins * 2, 1); R(g, skd, 36 - ins, y, 1, 1);
  }
  R(g, sk, 9, 21, 3, 6); R(g, sk, 36, 21, 3, 6); R(g, skd, 10, 23, 1, 3); R(g, skd, 37, 23, 1, 3);
  if (acc.includes('beard')) R(g, h, 13, 30, 22, 8);
  if (acc.includes('stubble')) for (let x = 15; x < 34; x += 2) for (let y = 31; y < 38; y += 2) R(g, shade(sk, -0.3), x + (y % 4 ? 1 : 0), y, 1, 1);
  const ed = '#2a1e1a';
  eyes(g, ex, 16, 21, ed, fem, kid, true); eyes(g, ex, 27, 21, ed, fem, kid, false);
  const bc = L.brow || (L.style === 'bald' ? '#7a5a40' : shade(h, -0.2));
  brows(g, ex, 16, bc); browsMirror(g, ex, 27, bc);
  R(g, skd, 23, 27, 2, 2);
  if (acc.includes('mustache')) { R(g, h, 18, 29, 12, 2); R(g, h, 17, 30, 2, 1); R(g, h, 29, 30, 2, 1); }
  mouth(g, ex, fem);
  if (old) { R(g, skd, 17, 29, 1, 3); R(g, skd, 30, 29, 1, 3); R(g, skd, 15, 26, 4, 1); R(g, skd, 29, 26, 4, 1); if (['bald', 'slick'].includes(L.style)) R(g, skd, 18, 12, 12, 1); }
  if (kid || ex === 'smile' && fem) { R(g, '#f5a0a0', 14, 28, 4, 1); R(g, '#f5a0a0', 30, 28, 4, 1); }
  hairFront(g, L, h);
  if (acc.includes('cap')) { const hc = L.hatc || '#2a4a8a'; capShape(g, hc, 3, 11); R(g, shade(hc, -0.3), 8, 11, 32, 3); }
  if (acc.includes('beret')) { const hc = L.hatc || '#a83232'; for (let y = 2; y < 10; y++) R(g, hc, 7 + Math.abs(5 - y), y, 34 - Math.abs(5 - y) * 2, 1); R(g, hc, 22, 0, 3, 2); }
  if (acc.includes('hat')) { const hc = L.hatc || '#3a3030'; R(g, hc, 13, 0, 22, 8); R(g, '#8a2a2a', 13, 5, 22, 2); R(g, hc, 6, 8, 36, 3); }
  if (acc.includes('headset')) { R(g, '#222', 10, 5, 28, 2); R(g, '#222', 7, 19, 4, 9); R(g, '#222', 8, 28, 10, 1); R(g, '#555', 17, 27, 3, 3); }
  if (acc.includes('ribbon')) { R(g, '#e8506e', 30, 6, 8, 5); R(g, '#c03050', 33, 7, 2, 3); }
  if (acc.includes('glasses') || acc.includes('sunglasses')) {
    const fr = '#1a1a1a';
    [[14, 19], [26, 19]].forEach(([x, y]) => { R(g, fr, x, y, 8, 1); R(g, fr, x, y + 7, 8, 1); R(g, fr, x, y, 1, 8); R(g, fr, x + 7, y, 1, 8); });
    R(g, fr, 22, 21, 4, 1); R(g, fr, 11, 20, 3, 1); R(g, fr, 34, 20, 3, 1);
    g.fillStyle = acc.includes('sunglasses') ? 'rgba(20,20,30,0.85)' : 'rgba(170,215,255,0.28)'; g.fillRect(15, 20, 6, 6); g.fillRect(27, 20, 6, 6);
    R(g, 'rgba(255,255,255,0.7)', 16, 21, 2, 1); R(g, 'rgba(255,255,255,0.7)', 28, 21, 2, 1);
  }
  if (acc.includes('earring')) { R(g, '#f2c14e', 10, 28, 2, 3); R(g, '#f2c14e', 37, 28, 2, 3); }
  if (acc.includes('bandage')) { R(g, '#f4eee0', 28, 12, 7, 3); }
  // 感情エフェクト
  if (['sweat', 'lie', 'shake'].includes(ex)) { R(g, '#a8dcff', 39, 13, 3, 4); R(g, '#a8dcff', 40, 11, 1, 2); R(g, '#fff', 39, 14, 1, 1); }
  if (ex === 'lie') { R(g, '#a8dcff', 6, 16, 2, 3); }
  if (ex === 'shake') { R(g, '#fff', 3, 16, 4, 1); R(g, '#fff', 2, 21, 4, 1); R(g, '#fff', 42, 21, 4, 1); R(g, '#fff', 41, 26, 4, 1); }
  if (ex === 'angry') { R(g, '#d33', 32, 9, 4, 1); R(g, '#d33', 33, 8, 1, 4); R(g, '#d33', 35, 8, 1, 4); }
  if (ex === 'surp') { R(g, '#fff', 4, 4, 1, 5); R(g, '#fff', 8, 2, 1, 5); R(g, '#fff', 43, 4, 1, 5); R(g, '#fff', 39, 2, 1, 5); }
  if (pose === 'point') torso(g, L, 'point');
  cache[key] = c; return c;
};
function dogPortrait(ex) {
  const key = 'DOGP' + ex; if (cache[key]) return cache[key];
  const { c, g } = cv(48, 56), O = '#d98a3a', Od = '#b8692a', W = '#f6ead8', K = '#1d1410';
  const m = { surp: 'alert', angry: 'bark', cry: 'sad', sweat: 'sad', lie: 'conf', shake: 'alert', point: 'bark' }[ex] || ex;
  // 体
  R(g, O, 8, 44, 32, 12); R(g, W, 16, 46, 16, 10); R(g, '#c0392b', 12, 42, 24, 3); R(g, '#f2c14e', 22, 44, 4, 3);
  // 耳
  const earUp = m !== 'sad';
  if (earUp) { for (let i = 0; i < 10; i++) { R(g, O, 8 + Math.floor(i / 2), 4 + i, 10 - i, 1); R(g, O, 30 + Math.floor(i / 2), 4 + i, 10 - i, 1); } R(g, '#f3b9a0', 10, 9, 4, 4); R(g, '#f3b9a0', 34, 9, 4, 4); }
  else { R(g, O, 5, 12, 9, 6); R(g, O, 34, 12, 9, 6); }
  // 頭
  for (let y = 10; y <= 44; y++) { const t = Math.abs(27 - y); const ins = Math.max(0, Math.floor(t * t / 60)); R(g, O, 6 + ins, y, 36 - ins * 2, 1); }
  for (let y = 28; y <= 44; y++) { const ins = Math.floor((y - 28) * 0.4); R(g, W, 10 + ins, y, 28 - ins * 2, 1); }
  R(g, Od, 6, 20, 2, 10); R(g, Od, 40, 20, 2, 10);
  R(g, W, 15, 17, 4, 2); R(g, W, 29, 17, 4, 2);
  if (m === 'smile') { R(g, K, 14, 22, 1, 1); R(g, K, 15, 21, 4, 1); R(g, K, 19, 22, 1, 1); R(g, K, 28, 22, 1, 1); R(g, K, 29, 21, 4, 1); R(g, K, 33, 22, 1, 1); }
  else if (m === 'sad') { R(g, K, 15, 23, 4, 3); R(g, K, 29, 23, 4, 3); R(g, W, 16, 23, 1, 1); R(g, W, 30, 23, 1, 1); R(g, '#8fd0ff', 15, 27, 1, 3); }
  else if (m === 'alert') { R(g, '#fff', 14, 20, 6, 6); R(g, K, 16, 21, 3, 4); R(g, '#fff', 28, 20, 6, 6); R(g, K, 29, 21, 3, 4); }
  else { R(g, K, 15, 21, 4, 5); R(g, K, 29, 21, 4, 5); R(g, '#fff', 16, 22, 1, 1); R(g, '#fff', 30, 22, 1, 1); }
  R(g, K, 21, 29, 6, 4); R(g, '#555', 22, 29, 2, 1);
  if (m === 'bark') { R(g, '#5a1a1a', 18, 34, 12, 6); R(g, '#e07a7a', 21, 37, 6, 3); R(g, '#fff', 19, 34, 2, 1); R(g, '#fff', 27, 34, 2, 1); [[2, 18], [1, 24], [44, 18], [45, 24]].forEach(([x, y]) => R(g, '#fff', x, y, 3, 1)); }
  else if (m === 'smile') { R(g, K, 20, 34, 8, 1); R(g, '#e07a7a', 22, 35, 4, 4); }
  else { R(g, K, 23, 33, 2, 2); R(g, K, 20, 35, 3, 1); R(g, K, 25, 35, 3, 1); }
  if (m === 'alert') { R(g, '#ffe14a', 40, 2, 3, 7); R(g, '#ffe14a', 40, 11, 3, 2); }
  if (m === 'conf') { R(g, '#fff', 40, 3, 5, 1); R(g, '#fff', 44, 4, 1, 3); R(g, '#fff', 42, 7, 2, 1); R(g, '#fff', 42, 8, 1, 2); R(g, '#fff', 42, 11, 1, 1); }
  cache[key] = c; return c;
}
function robotPortrait(ex) {
  const key = 'ROBP' + ex; if (cache[key]) return cache[key];
  const { c, g } = cv(48, 56);
  const m = { surp: 'alert', shake: 'alert', angry: 'alert', cry: 'conf', sweat: 'conf', lie: 'conf', point: 'alert' }[ex] || ex;
  R(g, '#15151c', 8, 1, 32, 55); R(g, '#15151c', 7, 3, 34, 51); R(g, '#2c2c38', 9, 2, 30, 1);
  R(g, '#0a2a44', 10, 6, 28, 44); R(g, '#bde6ff', 11, 7, 26, 42);
  for (let y = 9; y < 49; y += 4) R(g, '#aedcf8', 11, y, 26, 1);
  R(g, '#444', 20, 3, 8, 1); R(g, '#333', 21, 51, 6, 2);
  R(g, '#888', 23, 10, 2, 4); R(g, m === 'alert' ? '#ff5a5a' : '#ffd23a', 22, 8, 4, 3);
  R(g, '#2a3a5a', 13, 14, 22, 18); R(g, '#f4f8ff', 15, 16, 18, 14); R(g, '#dfe8f8', 15, 28, 18, 2);
  const e = '#1aa8e0';
  if (m === 'smile') { R(g, e, 17, 21, 1, 1); R(g, e, 18, 20, 3, 1); R(g, e, 21, 21, 1, 1); R(g, e, 26, 21, 1, 1); R(g, e, 27, 20, 3, 1); R(g, e, 30, 21, 1, 1); R(g, '#f59ab0', 16, 24, 3, 1); R(g, '#f59ab0', 29, 24, 3, 1); }
  else if (m === 'think') { R(g, e, 17, 21, 5, 1); R(g, e, 26, 21, 5, 1); [[36, 12], [39, 9], [42, 6]].forEach(([x, y], i) => R(g, '#fff', x, y, 2 + i, 2 + i)); }
  else if (m === 'alert') { R(g, e, 17, 19, 5, 5); R(g, e, 26, 19, 5, 5); R(g, '#fff', 18, 20, 1, 1); R(g, '#fff', 27, 20, 1, 1); R(g, '#ff5a5a', 40, 12, 3, 8); R(g, '#ff5a5a', 40, 22, 3, 2); }
  else if (m === 'conf') { R(g, e, 17, 20, 5, 1); R(g, e, 19, 21, 1, 2); R(g, e, 26, 22, 5, 1); R(g, e, 28, 20, 1, 2); }
  else if (m === 'analyze') { R(g, e, 17, 20, 4, 3); R(g, e, 27, 20, 4, 3); R(g, 'rgba(58,209,255,0.5)', 11, 26, 26, 2); }
  else { R(g, e, 18, 19, 3, 4); R(g, e, 27, 19, 3, 4); R(g, '#fff', 19, 20, 1, 1); R(g, '#fff', 28, 20, 1, 1); }
  R(g, '#5a6a8a', 21, 27, 6, 1);
  R(g, '#2a3a5a', 17, 32, 14, 12); R(g, '#d0dcf0', 19, 34, 10, 8); R(g, '#3ad1ff', 22, 36, 4, 2);
  R(g, '#9aa8c0', 13, 33, 4, 8); R(g, '#9aa8c0', 31, 33, 4, 8);
  cache[key] = c; return c;
}

/* =================== タイル =================== */
const TH = {
  mansion: { fa: '#a8744a', fa2: '#94633b', fb: '#8e1f30', fb2: '#a8303f', fc: '#c9bea8', fc2: '#b0a58e', wt: '#2a1f30', wt2: '#3a2b42', wf: '#e3d3a8', wf2: '#d1bd8b', wn: '#7a4a28', win: '#9aa8b5', style: 'wood' },
  hotel: { fa: '#cdb68c', fa2: '#bba377', fb: '#6b2a4a', fb2: '#7e3a5c', fc: '#ebe6dc', fc2: '#d8d0c0', wt: '#3a2d24', wt2: '#4a3a2e', wf: '#f0e6d0', wf2: '#e0d2b0', wn: '#5a4632', win: '#a8d8f0', style: 'carpet' },
  tv: { fa: '#8c9099', fa2: '#7c808a', fb: '#3a4a6a', fb2: '#4a5a7a', fc: '#a9a9a2', fc2: '#9a9a92', wt: '#1c1f26', wt2: '#2a2e38', wf: '#b8bcc4', wf2: '#a6aab3', wn: '#4a4e58', win: '#1a2350', style: 'vinyl' },
  studio: { fa: '#3a3440', fa2: '#2e2934', fb: '#5a2030', fb2: '#6a2a3a', fc: '#d8d0c0', fc2: '#c0b8a8', wt: '#121018', wt2: '#1e1a26', wf: '#2a2532', wf2: '#332d3c', wn: '#151219', win: '#202848', style: 'stage' },
  archive: { fa: '#6c7068', fa2: '#5c6058', fb: '#3a4038', fb2: '#454c42', fc: '#888', fc2: '#777', wt: '#15171a', wt2: '#22252a', wf: '#7f8478', wf2: '#727768', wn: '#3a3e36', win: '#111a30', style: 'vinyl' },
};
A.TH = TH;
function floorA(g, T) {
  R(g, T.fa, 0, 0, 16, 16);
  if (T.style === 'wood') { for (let y = 0; y < 16; y += 4) R(g, T.fa2, 0, y + 3, 16, 1); R(g, T.fa2, 5, 0, 1, 4); R(g, T.fa2, 11, 4, 1, 4); R(g, T.fa2, 3, 8, 1, 4); R(g, T.fa2, 13, 12, 1, 4); R(g, shade(T.fa, 0.15), 1, 1, 3, 1); }
  else if (T.style === 'carpet') { for (let i = 0; i < 16; i += 8) { R(g, T.fa2, i + 3, 3, 2, 2); R(g, T.fa2, i + 7, 11, 2, 2); } R(g, shade(T.fa, 0.1), 0, 0, 16, 1); }
  else if (T.style === 'vinyl') { R(g, T.fa2, 0, 7, 16, 1); R(g, T.fa2, 7, 0, 1, 16); R(g, shade(T.fa, 0.12), 1, 1, 5, 1); R(g, shade(T.fa, 0.12), 9, 9, 5, 1); }
  else { for (let y = 0; y < 16; y += 4) R(g, T.fa2, 0, y + 3, 16, 1); R(g, shade(T.fa, 0.1), 2, 1, 4, 1); }
}
function floorB(g, T) { R(g, T.fb, 0, 0, 16, 16); R(g, T.fb2, 1, 1, 14, 14); for (let i = 2; i < 16; i += 4) { R(g, '#d4a838', i, 2, 1, 1); R(g, '#d4a838', i, 13, 1, 1); } R(g, shade(T.fb, -0.2), 0, 0, 16, 1); R(g, shade(T.fb, -0.2), 0, 15, 16, 1); }
function floorC(g, T) { R(g, T.fc, 0, 0, 16, 16); R(g, T.fc2, 0, 0, 8, 8); R(g, T.fc2, 8, 8, 8, 8); R(g, shade(T.fc, 0.15), 1, 1, 3, 1); R(g, shade(T.fc2, -0.1), 12, 3, 1, 3); }
const SOLID = new Set('#WBTtcSbPLCKdMEdRvpFGHYyZXQUJOVnhmgfqiwlAk '.split(''));
A.SOLID = SOLID;
A.WALK = new Set(['.', ',', ':', '_', '=', 'D', 'r', 's', '*']);
const tcache = {};
A.tile = function (ch, theme) {
  const key = ch + '|' + theme; if (tcache[key]) return tcache[key];
  const T = TH[theme] || TH.mansion;
  const { c, g } = cv(16, 16);
  const fl = () => floorA(g, T);
  switch (ch) {
    case '.': fl(); break;
    case ',': floorB(g, T); break;
    case ':': floorC(g, T); break;
    case 'r': fl(); R(g, '#7a3a2a', 1, 1, 14, 14); R(g, '#a85a3a', 2, 2, 12, 12); R(g, '#e0c070', 4, 4, 8, 8); R(g, '#a85a3a', 6, 6, 4, 4); break;
    case 's': fl(); for (let y = 0; y < 16; y += 4) { R(g, shade(T.fa, -0.3), 0, y, 16, 1); R(g, shade(T.fa, 0.2), 0, y + 1, 16, 1); } break;
    case '*': R(g, '#eef4fa', 0, 0, 16, 16); [[2, 3], [9, 2], [13, 9], [5, 11], [11, 13], [7, 7]].forEach(([x, y]) => R(g, '#c8d8ea', x, y, 2, 1)); R(g, '#ffffff', 4, 6, 2, 1); break;
    case '_': R(g, '#3d6e3a', 0, 0, 16, 16); [[2, 3], [9, 2], [13, 9], [5, 11], [11, 13], [7, 7]].forEach(([x, y]) => { R(g, '#4f8a4a', x, y, 1, 2); R(g, '#4f8a4a', x + 1, y - 1, 1, 2); }); break;
    case '=': R(g, '#8a8a90', 0, 0, 16, 16); R(g, '#7a7a80', 0, 7, 16, 1); R(g, '#7a7a80', 7, 0, 1, 7); R(g, '#7a7a80', 12, 8, 1, 8); R(g, '#9a9aa0', 1, 1, 4, 1); break;
    case 'wt': R(g, T.wt, 0, 0, 16, 16); R(g, T.wt2, 0, 0, 16, 2); R(g, shade(T.wt, -0.3), 0, 14, 16, 2); break;
    case 'wf': R(g, T.wf, 0, 0, 16, 10); for (let x = 1; x < 16; x += 4) R(g, T.wf2, x, 0, 2, 10); R(g, T.wn, 0, 10, 16, 6); R(g, shade(T.wn, -0.3), 0, 10, 16, 1); R(g, shade(T.wn, 0.15), 2, 12, 4, 3); R(g, shade(T.wn, 0.15), 10, 12, 4, 3); break;
    case 'W': R(g, T.wf, 0, 0, 16, 16); R(g, T.wn, 0, 12, 16, 4); R(g, '#5a3a22', 2, 1, 12, 11); R(g, T.win, 3, 2, 10, 9); R(g, shade(T.win, 0.3), 4, 3, 3, 2); R(g, '#5a3a22', 7, 2, 1, 9); R(g, '#5a3a22', 3, 6, 10, 1); break;
    case 'D': fl(); R(g, '#4a2a18', 0, 0, 2, 16); R(g, '#4a2a18', 14, 0, 2, 16); R(g, shade(T.fa, -0.25), 2, 0, 12, 3); R(g, '#7a4a28', 2, 0, 3, 14); R(g, '#c9a227', 4, 7, 1, 1); break;
    case 'B': R(g, '#4a2a12', 0, 0, 16, 16); ['#c0392b', '#2e86de', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22'].forEach((col, i) => { R(g, col, 1 + Math.floor(i * 2.4), 2, 2, 5); R(g, col, 2 + Math.floor(i * 2.2), 9, 2, 5); }); R(g, '#2a1606', 0, 7, 16, 2); R(g, '#2a1606', 0, 14, 16, 2); break;
    case 'T': fl(); R(g, '#5a3418', 1, 13, 2, 3); R(g, '#5a3418', 13, 13, 2, 3); R(g, '#7a4a24', 0, 2, 16, 11); R(g, '#9a6434', 1, 3, 14, 8); R(g, '#b07a44', 1, 3, 14, 1); break;
    case 't': fl(); R(g, '#e9e2cf', 0, 1, 16, 13); R(g, '#d6cdb4', 0, 12, 16, 2); R(g, '#fff', 2, 3, 5, 1); R(g, '#c9a227', 11, 5, 2, 3); break;
    case 'c': fl(); R(g, '#5a3418', 4, 3, 8, 2); R(g, '#7a4a24', 4, 5, 8, 6); R(g, '#5a3418', 4, 11, 2, 4); R(g, '#5a3418', 10, 11, 2, 4); R(g, '#9b2335', 5, 6, 6, 4); break;
    case 'S': fl(); R(g, '#5a2a3a', 0, 3, 16, 11); R(g, '#7a3a50', 1, 6, 14, 6); R(g, '#8e4a62', 1, 3, 14, 3); R(g, '#3a1a24', 0, 13, 16, 2); break;
    case 'A': fl(); R(g, '#3a4a6a', 2, 3, 12, 11); R(g, '#4a5a7e', 3, 6, 10, 6); R(g, '#2a3450', 2, 3, 2, 11); R(g, '#2a3450', 12, 3, 2, 11); break;
    case 'b': fl(); R(g, '#6b4226', 1, 0, 14, 16); R(g, '#f4f0e8', 2, 1, 12, 5); R(g, '#c8d8f0', 2, 6, 12, 9); R(g, '#a8b8d8', 2, 6, 12, 1); break;
    case 'P': fl(); R(g, '#a0522d', 5, 10, 6, 5); R(g, '#7a3a1d', 5, 14, 6, 1); R(g, '#2f8f4a', 3, 3, 10, 7); R(g, '#46b264', 5, 2, 3, 4); R(g, '#1f6b36', 9, 6, 3, 3); break;
    case 'L': fl(); R(g, '#333', 7, 7, 2, 7); R(g, '#222', 3, 13, 10, 2); R(g, '#222', 2, 1, 12, 7); R(g, '#fff2b0', 3, 2, 10, 4); R(g, '#555', 2, 1, 12, 1); break;
    case 'C': fl(); R(g, '#1e1e24', 1, 3, 14, 12); R(g, '#33333c', 2, 4, 12, 10); R(g, '#9aa0a8', 1, 8, 14, 1); R(g, '#c9a227', 7, 5, 2, 2); R(g, '#9aa0a8', 1, 3, 2, 2); R(g, '#9aa0a8', 13, 3, 2, 2); break;
    case 'K': fl(); R(g, '#6b3f1e', 1, 1, 14, 14); R(g, '#8a5530', 2, 2, 12, 5); R(g, '#8a5530', 2, 8, 12, 6); R(g, '#c9a227', 7, 4, 2, 1); R(g, '#c9a227', 7, 10, 2, 1); break;
    case 'd': fl(); R(g, '#5a3418', 0, 2, 16, 12); R(g, '#7a4a24', 1, 3, 14, 7); R(g, '#f4ecd2', 3, 4, 5, 4); R(g, '#555', 4, 5, 3, 1); R(g, '#555', 4, 6, 2, 1); R(g, '#3a2010', 0, 12, 16, 2); break;
    case 'M': fl(); R(g, '#4a4a52', 0, 6, 16, 8); R(g, '#222', 3, 0, 10, 7); R(g, '#4ab0e0', 4, 1, 8, 5); R(g, '#aee4ff', 5, 2, 3, 1); R(g, '#666', 7, 7, 2, 1); R(g, '#bbb', 3, 10, 10, 2); break;
    case 'E': R(g, T.wf, 0, 0, 16, 16); R(g, T.wn, 0, 12, 16, 4); R(g, '#6a6e76', 2, 1, 12, 12); R(g, '#8a8e96', 3, 2, 10, 10); [[4, 3], [7, 3], [10, 3], [4, 7], [7, 7], [10, 7]].forEach(([x, y]) => R(g, '#222', x, y, 2, 3)); R(g, '#ffd23a', 4, 3, 2, 1); R(g, '#e33', 7, 7, 2, 1); break;
    case 'R': fl(); R(g, '#4a2e1a', 0, 2, 16, 12); R(g, '#6b4426', 0, 3, 16, 5); R(g, '#c9a227', 0, 2, 16, 1); R(g, '#3a2010', 0, 12, 16, 2); break;
    case 'v': R(g, '#6a6e76', 0, 0, 16, 16); R(g, '#aab0ba', 1, 1, 7, 15); R(g, '#9aa0aa', 8, 1, 7, 15); R(g, '#555', 7, 1, 2, 15); R(g, '#ffd23a', 12, 0, 3, 2); break;
    case 'p': fl(); R(g, '#111', 1, 1, 14, 13); R(g, '#2a2a2a', 2, 2, 12, 6); R(g, '#f4f4f4', 1, 10, 14, 3); for (let x = 2; x < 15; x += 2) R(g, '#111', x, 10, 1, 2); break;
    case 'F': R(g, '#8a8a90', 0, 0, 16, 16); R(g, '#3a3a40', 0, 3, 16, 1); R(g, '#3a3a40', 0, 9, 16, 1); for (let x = 1; x < 16; x += 5) R(g, '#3a3a40', x, 2, 1, 10); break;
    case 'G': fl(); R(g, '#c9a227', 3, 10, 10, 5); R(g, '#a07f18', 3, 14, 10, 1); R(g, '#9fd3e6', 3, 1, 10, 9); R(g, '#c9ecf6', 4, 2, 2, 6); R(g, '#7a1626', 5, 7, 6, 3); break;
    case 'H': fl(); R(g, '#5a3418', 0, 0, 16, 16); R(g, '#9fd3e6', 1, 1, 14, 12); R(g, '#c9a227', 3, 6, 3, 6); R(g, '#c9a227', 9, 4, 4, 8); R(g, '#e8c860', 10, 2, 2, 2); R(g, '#5a3418', 0, 6, 16, 1); break;
    case 'Y': R(g, '#3d6e3a', 0, 0, 16, 16); R(g, '#4a2e14', 6, 10, 4, 6); R(g, '#1f4a2a', 1, 0, 14, 11); R(g, '#2e6b3a', 3, 1, 9, 7); R(g, '#3f8a4a', 5, 2, 4, 3); break;
    case 'y': R(g, '#3d6e3a', 0, 0, 16, 16); R(g, '#24552e', 2, 5, 12, 10); R(g, '#33703c', 4, 6, 7, 5); break;
    case 'Z': R(g, '#55606e', 0, 0, 16, 16); R(g, '#6e7a8a', 1, 1, 6, 14); R(g, '#6e7a8a', 9, 1, 6, 14); R(g, '#333', 2, 3, 4, 1); R(g, '#333', 10, 3, 4, 1); R(g, '#c9a227', 6, 8, 1, 2); R(g, '#c9a227', 14, 8, 1, 2); break;
    case 'X': R(g, '#3a3226', 0, 0, 16, 16); for (let y = 1; y < 16; y += 5) { R(g, '#6b5a40', 0, y + 3, 16, 1); for (let x = 1; x < 15; x += 4) { R(g, '#9aa0a8', x, y, 3, 3); R(g, '#555', x + 1, y + 1, 1, 1); } } break;
    case 'Q': fl(); R(g, '#222', 7, 9, 2, 5); R(g, '#222', 3, 14, 10, 1); R(g, '#3a3a44', 2, 2, 11, 7); R(g, '#555', 12, 3, 3, 5); R(g, '#111', 3, 3, 3, 3); R(g, '#e33', 10, 3, 1, 1); break;
    case 'U': R(g, '#1a1a22', 0, 0, 16, 16); R(g, '#3a6ab0', 1, 1, 6, 6); R(g, '#6ab03a', 9, 1, 6, 6); R(g, '#b03a6a', 1, 9, 6, 6); R(g, '#b0a03a', 9, 9, 6, 6); break;
    case 'J': R(g, '#5a4a6a', 0, 0, 16, 16); R(g, '#6e5c80', 0, 0, 16, 3); R(g, '#3a2e46', 0, 13, 16, 3); R(g, '#f2c14e', 0, 3, 16, 1); break;
    case 'O': R(g, '#8a8a90', 0, 0, 16, 16); R(g, '#bbb', 1, 1, 14, 14); R(g, '#4a7fc0', 3, 3, 10, 10); R(g, '#8ac0f0', 6, 5, 4, 2); break;
    case 'V': fl(); R(g, '#c0392b', 1, 0, 14, 15); R(g, '#e8e8e8', 3, 2, 10, 6); R(g, '#3a3a3a', 3, 10, 6, 3); R(g, '#2e86de', 4, 3, 2, 3); R(g, '#f1c40f', 7, 3, 2, 3); R(g, '#27ae60', 10, 3, 2, 3); break;
    case 'n': fl(); R(g, '#d8dce4', 1, 3, 14, 10); R(g, '#a8acb4', 1, 3, 14, 3); R(g, '#fff', 4, 1, 8, 3); R(g, '#3a3a3a', 3, 9, 10, 2); R(g, '#3ad15a', 12, 7, 1, 1); break;
    case 'h': fl(); R(g, '#555', 1, 1, 14, 1); R(g, '#555', 1, 1, 1, 14); R(g, '#555', 14, 1, 1, 14); ['#c0392b', '#2e86de', '#f1c40f', '#8e44ad'].forEach((col, i) => R(g, col, 2 + i * 3, 2, 3, 9)); break;
    case 'm': fl(); R(g, '#5a3418', 1, 0, 14, 14); R(g, '#cfe8f4', 3, 1, 10, 7); R(g, '#fff', 4, 2, 2, 3); R(g, '#7a4a24', 1, 9, 14, 5); R(g, '#ffe9a0', 2, 1, 1, 1); R(g, '#ffe9a0', 13, 1, 1, 1); break;
    case 'g': fl(); R(g, '#4a2a12', 4, 0, 8, 16); R(g, '#6b3f1e', 5, 1, 6, 14); R(g, '#f4ecd2', 5, 2, 6, 5); R(g, '#222', 8, 3, 1, 3); R(g, '#c9a227', 7, 9, 2, 4); break;
    case 'f': R(g, '#6b6b75', 0, 0, 16, 16); R(g, '#55555e', 0, 4, 16, 1); R(g, '#222', 3, 6, 10, 10); R(g, '#ff8a20', 5, 10, 6, 6); R(g, '#ffd23a', 6, 12, 4, 4); R(g, '#8a8a95', 1, 0, 14, 3); break;
    case 'q': fl(); R(g, '#3a3a3a', 1, 2, 14, 12); R(g, '#7ab0c8', 2, 3, 10, 8); R(g, '#555', 13, 4, 1, 1); R(g, '#555', 13, 7, 1, 1); R(g, '#222', 4, 14, 8, 2); break;
    case 'i': fl(); R(g, '#6a6e76', 4, 5, 8, 10); R(g, '#8a8e96', 3, 4, 10, 2); R(g, '#555', 6, 7, 1, 7); R(g, '#555', 9, 7, 1, 7); break;
    case 'w': R(g, T.wf, 0, 0, 16, 16); R(g, T.wn, 0, 12, 16, 4); R(g, '#888', 1, 1, 14, 11); R(g, '#fafafa', 2, 2, 12, 9); R(g, '#3a6ab0', 3, 3, 7, 1); R(g, '#c0392b', 3, 5, 9, 1); R(g, '#333', 3, 7, 6, 1); R(g, '#333', 3, 9, 8, 1); break;
    case 'l': fl(); R(g, '#333', 7, 5, 2, 10); R(g, '#222', 5, 14, 6, 2); R(g, '#f4e8c0', 4, 0, 8, 5); R(g, '#d8c890', 4, 4, 8, 1); break;
    case 'k': fl(); R(g, '#555b66', 0, 2, 16, 12); R(g, '#7a808c', 1, 3, 14, 5); R(g, '#222', 2, 4, 4, 3); R(g, '#e33', 3, 5, 1, 1); R(g, '#3ad15a', 5, 5, 1, 1); R(g, '#222', 9, 4, 5, 3); break;
    default: R(g, '#0a0a10', 0, 0, 16, 16);
  }
  tcache[key] = c; return c;
};

/* =================== 証拠品アイコン =================== */
A.icon = function (kind, col) {
  const key = 'I' + kind + col; if (cache[key]) return cache[key];
  const { c, g } = cv(16, 16); col = col || '#c0392b';
  const paper = () => { R(g, '#f4ecd2', 3, 1, 10, 14); R(g, '#d8cba8', 3, 14, 10, 1); };
  const lines = (cl, n) => { for (let i = 0; i < n; i++) R(g, cl || '#777', 5, 4 + i * 2, 6 - (i % 2) * 2, 1); };
  switch (kind) {
    case 'watch': R(g, '#888', 7, 0, 2, 3); R(g, '#c8ccd4', 3, 3, 10, 10); R(g, '#9aa0a8', 3, 3, 10, 1); R(g, '#f8f8f0', 4, 4, 8, 8); R(g, '#222', 8, 5, 1, 3); R(g, '#222', 8, 8, 3, 1); R(g, '#fff', 5, 5, 1, 1); break;
    case 'key': R(g, '#c9a227', 1, 5, 6, 6); R(g, '#0000', 3, 7, 2, 2); g.clearRect(3, 7, 2, 2); R(g, '#e8c860', 7, 7, 8, 2); R(g, '#c9a227', 11, 9, 1, 3); R(g, '#c9a227', 13, 9, 1, 2); break;
    case 'paper': paper(); lines('#777', 5); break;
    case 'log': paper(); for (let i = 0; i < 5; i++) { R(g, '#555', 4, 3 + i * 2, 2, 1); R(g, col, 7, 3 + i * 2, 5, 1); } break;
    case 'photo': R(g, '#fafafa', 1, 2, 14, 12); R(g, '#4a6a9a', 2, 3, 12, 8); R(g, '#f2c9a0', 9, 5, 3, 3); R(g, col, 8, 8, 5, 3); R(g, '#c9a227', 3, 7, 3, 4); break;
    case 'phone': R(g, '#1c1c24', 4, 0, 8, 16); R(g, '#7ec8f0', 5, 2, 6, 10); R(g, '#fff', 6, 4, 4, 1); R(g, '#fff', 6, 6, 3, 1); R(g, '#555', 7, 13, 2, 1); break;
    case 'tape': R(g, '#222', 2, 3, 12, 10); R(g, '#3a3a3a', 3, 4, 10, 8); R(g, '#8a8a8a', 6, 6, 4, 4); R(g, '#222', 13, 10, 3, 2); break;
    case 'timer': R(g, '#e8e8e8', 2, 2, 12, 12); R(g, '#aaa', 2, 12, 12, 2); R(g, '#222', 4, 4, 8, 4); R(g, '#3ad15a', 5, 5, 6, 2); R(g, '#555', 6, 10, 4, 1); R(g, col, 12, 3, 1, 1); break;
    case 'note': R(g, col, 2, 1, 12, 14); R(g, '#f4ecd2', 4, 2, 9, 12); lines('#777', 4); break;
    case 'card': R(g, '#e8e8e8', 1, 4, 14, 9); R(g, col, 1, 4, 14, 3); R(g, '#c9a227', 3, 9, 3, 2); break;
    case 'print': paper(); R(g, '#222', 5, 3, 6, 1); R(g, '#222', 4, 5, 8, 1); R(g, '#222', 5, 7, 5, 1); R(g, col, 9, 12, 3, 1); break;
    case 'film': R(g, '#333', 2, 2, 12, 12); R(g, '#666', 4, 4, 8, 8); R(g, '#222', 7, 7, 2, 2); [[3, 3], [11, 3], [3, 11], [11, 11]].forEach(([x, y]) => R(g, '#111', x, y, 2, 2)); R(g, col, 0, 7, 3, 2); break;
    case 'trophy': R(g, '#c9a227', 4, 1, 8, 6); R(g, '#e8c860', 5, 2, 2, 3); R(g, '#c9a227', 2, 2, 2, 3); R(g, '#c9a227', 12, 2, 2, 3); R(g, '#a07f18', 7, 7, 2, 4); R(g, '#8a6a20', 3, 11, 10, 4); R(g, col, 4, 14, 8, 1); break;
    case 'script': R(g, '#e8e0c8', 2, 1, 12, 14); R(g, col, 2, 1, 12, 3); R(g, '#fff', 4, 2, 6, 1); lines('#666', 5); break;
    case 'bracelet': for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; R(g, ['#e8506e', '#3a9ad9', '#f1c40f'][i % 3], Math.round(7 + Math.cos(a) * 5), Math.round(7 + Math.sin(a) * 5), 2, 2); } break;
    case 'memo': R(g, '#fff6a0', 2, 2, 12, 12); R(g, '#e8dc80', 2, 2, 12, 2); lines('#777', 4); break;
    case 'board': R(g, '#888', 1, 2, 14, 11); R(g, '#fafafa', 2, 3, 12, 9); R(g, '#3a6ab0', 3, 4, 8, 1); R(g, '#c0392b', 3, 6, 9, 1); R(g, '#333', 3, 8, 7, 1); R(g, '#555', 4, 13, 1, 3); R(g, '#555', 11, 13, 1, 3); break;
    case 'video': R(g, '#222', 1, 3, 14, 10); R(g, '#3a6ab0', 2, 4, 9, 8); R(g, '#e33', 12, 4, 2, 2); R(g, '#fff', 5, 6, 1, 4); R(g, '#fff', 6, 7, 1, 2); break;
    case 'glove': R(g, '#e8e0d0', 4, 4, 8, 10); [4, 6, 8, 10].forEach(x => R(g, '#e8e0d0', x, 1, 2, 4)); R(g, '#3a3030', 5, 9, 6, 4); break;
    case 'dust': R(g, '#7a6a50', 1, 6, 14, 6); R(g, '#9a8a6a', 2, 7, 12, 4); R(g, '#5a4a38', 5, 7, 6, 4); R(g, '#9a8a6a', 6, 8, 4, 2); break;
    case 'combo': R(g, col, 2, 2, 12, 12); R(g, '#fff', 4, 7, 8, 2); R(g, '#fff', 7, 4, 2, 8); R(g, shade(col, -0.3), 2, 13, 12, 1); break;
    case 'frag': R(g, '#f4ecd2', 2, 3, 12, 10); R(g, '#7a5a3a', 3, 4, 10, 8); R(g, '#c9a227', 5, 6, 2, 4); R(g, '#e8e0c8', 9, 6, 3, 3); for (let i = 0; i < 5; i++) R(g, '#0a0d1c', 11 + (i % 2), 3 + i * 2, 3, 1); R(g, '#ffe14a', 0, 0, 2, 2); break;
    case 'bag': R(g, col, 2, 5, 12, 10); R(g, shade(col, -0.3), 2, 5, 12, 2); R(g, '#555', 5, 1, 6, 1); R(g, '#555', 5, 1, 1, 4); R(g, '#555', 10, 1, 1, 4); break;
    case 'ledger': R(g, '#5a3418', 2, 1, 12, 14); R(g, '#8a5530', 3, 2, 10, 12); R(g, '#f4ecd2', 4, 3, 8, 3); R(g, '#c9a227', 3, 11, 10, 1); break;
    case 'fire': R(g, '#555', 2, 9, 12, 6); R(g, '#e8631a', 4, 4, 8, 6); R(g, '#ffd23a', 6, 6, 4, 4); R(g, '#e8631a', 7, 1, 2, 3); break;
    default: paper(); lines();
  }
  cache[key] = c; return c;
};

/* 場面表示用の追加オブジェクト（布・テープ跡など） */
A.overlay = function (g, kind, x, y) {
  const p = (c, a, b, w, h) => R(g, c, x + a, y + b, w, h);
  if (kind === 'sheet') { p('#e8e8ee', 1, 4, 14, 8); p('#c8c8d0', 1, 10, 14, 2); p('#d8d8e0', 3, 3, 6, 2); }
  if (kind === 'paper') { p('#f4ecd2', 5, 6, 7, 6); p('#999', 6, 8, 5, 1); p('#999', 6, 10, 4, 1); }
  if (kind === 'tapemark') { p('#f2c14e', 2, 2, 12, 1); p('#f2c14e', 2, 13, 12, 1); p('#f2c14e', 2, 2, 1, 12); p('#f2c14e', 13, 2, 1, 12); }
  if (kind === 'clip') { p('#e8506e', 6, 7, 4, 2); p('#ffd23a', 7, 7, 2, 1); }
  if (kind === 'bag') { p('#3a5a8a', 4, 6, 8, 7); p('#2a4060', 4, 6, 8, 2); }
  if (kind === 'puddle') { p('#3d5f94', 2, 5, 12, 7); p('#4f77b0', 3, 6, 10, 5); p('#a8c8f0', 5, 7, 3, 1); }
  if (kind === 'foot') { p('#9ab0c8', 3, 2, 3, 4); p('#9ab0c8', 9, 6, 3, 4); p('#9ab0c8', 4, 10, 3, 4); p('#9ab0c8', 10, 13, 3, 3); }
  if (kind === 'ash') { p('#555', 3, 8, 10, 5); p('#888', 5, 9, 4, 2); }
};
})();
