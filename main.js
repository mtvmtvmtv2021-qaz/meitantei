/* =========================================================
   main.js ― 起動・入力・メインループ・画面サイズ調整
   ========================================================= */
(function () {
const $ = G.$;
const cv = $('cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------- 入力 ---------- */
const KM = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'ok', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back', KeyI: 'inv', KeyE: 'inv', KeyM: 'menu', KeyC: 'consult', KeyF: 'accuse', KeyH: 'consult' };
const DIRS = ['up', 'down', 'left', 'right'];
G.press = function (k, e) {
  G.audio.init();
  const top = G.ui.top();
  if (top) {
    // 証拠品画面の「A：AI分析」
    if (top.name === 'evidence' && e && e.code === 'KeyA') return top.key('robo');
    return top.key(k, e);
  }
  if (G.explore.mode === 'play') G.explore.key(k);
};
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  const k = KM[e.code];
  if (!k) return;
  e.preventDefault();
  if (DIRS.includes(k)) {
    if (!G.ui.top()) { G.explore.held[k] = true; return; }
    if (e.repeat && G.ui.top().name === 'dlg') return;
    return G.press(k, e);
  }
  if (e.repeat) return; // 決定・キャンセルの連打防止
  G.press(k, e);
});
addEventListener('keyup', e => { const k = KM[e.code]; if (k && DIRS.includes(k)) G.explore.held[k] = false; });
addEventListener('blur', () => { G.explore.held = {}; });
// 画面のボタン
document.addEventListener('click', e => {
  const b = e.target.closest('[data-key]'); if (!b) return;
  e.preventDefault(); G.press(b.dataset.key);
});
$('dlg').addEventListener('click', () => { const t = G.ui.top(); if (t && t.name === 'dlg') G.ui.dlg.advance(); });

/* ---------- 画面サイズ ---------- */
function fit() {
  const sc = $('screen');
  const W = innerWidth, H = innerHeight;
  let w = Math.min(W - 8, (H - 8) * 16 / 9);
  w = Math.max(320, w);
  sc.style.width = w + 'px'; sc.style.height = (w * 9 / 16) + 'px';
  sc.style.fontSize = (w / 56) + 'px';
}
addEventListener('resize', fit);

/* ---------- ループ ---------- */
function loop() {
  try {
    G.explore.update();
    G.ui.dlg.tick();
    if (G.story.mode === 'title' || G.story.mode === 'setup') { G.explore.frame++; G.story.drawTitle(ctx); }
    else if (!G.story.drawScene(ctx)) { if (G.explore.map && G.CASE) G.explore.draw(ctx); else { G.explore.frame++; G.story.drawTitle(ctx); } }
  } catch (err) { console.error(err); }
  requestAnimationFrame(loop);
}

/* ---------- 起動 ---------- */
G.SEO_TITLE = document.title;
G.boot = function () {
  G.loadSettings();
  fit();
  const last = G.latestSave();
  if (last) G.story.titleLook = (G.LOOKS[last.d.S.gender] || G.LOOKS.m).find(l => l.id === last.d.S.look);
  G.story.title();
  loop();
  // 初回クリックで音を有効化
  addEventListener('pointerdown', () => G.audio.init(), { once: true });
};
G.boot();
})();
