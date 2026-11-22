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

/* ---------- スマホ・タブレット（タッチ操作） ---------- */
const TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches;
G.TOUCH = TOUCH;
G.padOn = function (on) {
  if (!document.getElementById('pad')) return;
  if (document.body.classList.contains('padon') === !!on) return;
  document.body.classList.toggle('padon', !!on);
  if (!on) G.explore.held = {};
  fit();
};
function setupTouch() {
  // 拡大縮小やダブルタップ拡大を防ぎ、ノッチ付き端末にも合わせる
  const vp = document.querySelector('meta[name=viewport]');
  if (vp) vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  const st = document.createElement('style');
  st.textContent = `
body.padon{touch-action:manipulation;-webkit-tap-highlight-color:transparent;padding:0}
body.padon #screen{box-shadow:none}
#pad{display:none;user-select:none;-webkit-user-select:none;touch-action:none}
body.padon #pad{display:flex}
#pad button{font:inherit;color:#f5efe0;background:rgba(20,26,51,.72);border:2px solid rgba(232,224,200,.75);border-radius:14px;touch-action:none;-webkit-touch-callout:none;padding:0;display:flex;align-items:center;justify-content:center}
#pad button.on{background:rgba(242,193,78,.9);color:#141a33}
#pad .dp{display:grid;grid-template-columns:repeat(3,var(--b));grid-template-rows:repeat(3,var(--b));gap:4px}
#pad .dp button{font-size:calc(var(--b)*.42)}
#pad .ab{display:grid;grid-template-columns:var(--a) var(--a);gap:10px;align-items:center}
#pad .ab button{width:var(--a);height:var(--a);border-radius:50%;font-size:calc(var(--a)*.34)}
#pad .ab .a{border-color:#f2c14e;transform:translateY(calc(var(--a)*-.35))}
#pad .ab small{display:block;font-size:.5em;line-height:1}
#pad .fn{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
#pad .fn button{padding:6px 10px;border-radius:10px;font-size:13px;min-height:38px}
#pad .fn .acc{border-color:#ff6b5a;color:#ffd8d0}
/* 縦画面：ゲーム画面の下にコントローラー */
body.padon.portrait #pad{--b:56px;--a:72px;position:relative;margin:10px auto 0;width:100%;max-width:560px;padding:0 12px 14px;justify-content:space-between;align-items:center;flex-wrap:wrap;row-gap:12px}
body.padon.portrait #pad .fn{order:-1;width:100%}
/* 横画面：ゲーム画面の左右に重ねる */
body.padon.landscape #pad{--b:min(52px,13vh);--a:min(66px,17vh);position:fixed;inset:0;pointer-events:none;z-index:50}
body.padon.landscape #pad .dp,body.padon.landscape #pad .ab,body.padon.landscape #pad .fn{position:absolute;pointer-events:auto}
body.padon.landscape #pad .dp{left:calc(env(safe-area-inset-left) + 8px);bottom:31vh;opacity:.6}
body.padon.landscape #pad .ab{right:calc(env(safe-area-inset-right) + 10px);bottom:31vh;opacity:.6}
body.padon.landscape #pad .fn{left:50%;transform:translateX(-50%);top:4px;flex-wrap:nowrap;width:auto;opacity:.85}
body.padon.landscape #pad .fn button{font-size:11px;min-height:30px;padding:3px 8px}
body.padon #hud .hb{display:none}
body.padon.landscape #about{margin-top:12px}
`;
  document.head.appendChild(st);
  const pad = document.createElement('div');
  pad.id = 'pad';
  pad.innerHTML = `<div class="dp"><span></span><button data-d="up" aria-label="上">▲</button><span></span><button data-d="left" aria-label="左">◀</button><span></span><button data-d="right" aria-label="右">▶</button><span></span><button data-d="down" aria-label="下">▼</button><span></span></div>
    <div class="fn"><button data-p="inv">証拠品</button><button data-p="menu">メニュー</button><button data-p="consult">助手</button><button data-p="accuse" class="acc">犯人だ！</button></div>
    <div class="ab"><button data-p="back" class="b">B<small>戻る</small></button><button data-p="ok" class="a">A<small>決定</small></button></div>`;
  $('screen').after(pad);
  // 最初の表示：指で操作する端末（スマホ・タブレット）なら表示、マウスのあるPCなら非表示
  G.padOn(!matchMedia('(pointer: fine)').matches);
  // キーボードを使ったら隠し、画面にタッチしたらまた表示する
  addEventListener('keydown', e => { if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; if (KM[e.code]) G.padOn(false); }, true);
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') G.padOn(true); }, true);
  // 十字ボタン：押しっぱなしで移動、メニューでは連続でカーソル移動
  pad.querySelectorAll('[data-d]').forEach(b => {
    const d = b.dataset.d; let timer = null;
    const down = e => {
      e.preventDefault(); b.classList.add('on'); G.audio.init();
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
      if (!G.ui.top()) { G.explore.held[d] = true; }
      else { G.press(d); timer = setTimeout(function rep() { if (G.ui.top()) G.press(d); timer = setTimeout(rep, 140); }, 380); }
    };
    const up = e => { e.preventDefault(); b.classList.remove('on'); G.explore.held[d] = false; clearTimeout(timer); timer = null; };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  pad.querySelectorAll('[data-p]').forEach(b => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('on'); G.press(b.dataset.p); });
    const off = () => b.classList.remove('on');
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  // 名前入力欄にフォーカスしているときは、決定ボタンで入力を確定できるように
  document.addEventListener('focusin', e => { if (e.target.tagName === 'INPUT') document.body.classList.add('typing'); });
  document.addEventListener('focusout', () => document.body.classList.remove('typing'));
}

/* ---------- 画面サイズ ---------- */
function fit() {
  const sc = $('screen');
  const W = innerWidth, H = innerHeight;
  let w;
  if (TOUCH && document.body.classList.contains('padon')) {
    const land = W > H;
    document.body.classList.toggle('landscape', land);
    document.body.classList.toggle('portrait', !land);
    w = land ? Math.min(W, H * 16 / 9) : W;
  } else {
    w = Math.max(320, Math.min(W - 8, (H - 8) * 16 / 9));
  }
  sc.style.width = w + 'px'; sc.style.height = (w * 9 / 16) + 'px';
  sc.style.fontSize = Math.max(w / 56, TOUCH ? 9.5 : 0) + 'px';
}
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 250));

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
  if (TOUCH) setupTouch();
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
