/* =========================================================
   ui.js ― レイヤー・会話ウィンドウ・立ち絵・メニュー類
   ========================================================= */
(function () {
const $ = id => document.getElementById(id);
G.$ = $;
const UI = G.ui = { stack: [] };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
G.esc = esc;

/* ---------- レイヤー（入力の行き先） ---------- */
UI.push = function (layer) { UI.stack.push(layer); return layer; };
UI.pop = function (layer) { const i = UI.stack.lastIndexOf(layer); if (i >= 0) UI.stack.splice(i, 1); };
UI.top = () => UI.stack[UI.stack.length - 1];
UI.busy = () => UI.stack.length > 0;

/* ---------- キャラ解決 ---------- */
G.charOf = function (k) {
  if (k === 'me') { const L = G.myLook(); return { name: G.S ? G.S.name : '', look: L, v: G.S && G.S.gender === 'f' ? 560 : 400 }; }
  if (k === 'as') { const a = G.ASSIST[G.C ? G.C.as : 'c']; return { name: G.asName(), look: a.look, v: a.v, as: a.key }; }
  if (k === 'c' || k === 'd' || k === 'r') { const a = G.ASSIST[k]; return { name: G.asName(k), look: a.look, v: a.v, as: a.key }; }
  if (G.CASE && G.CASE.chars[k]) return G.CASE.chars[k];
  if (G.GCH[k]) return G.GCH[k];
  return null;
};

/* ---------- 立ち絵 ---------- */
const ST = UI.st = { L: null, R: null, Lex: 'n', Rex: 'n', speak: null };
function drawPort(cvs, ch, ex, pose) {
  const g = cvs.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cvs.width, cvs.height);
  if (!ch) return;
  g.drawImage(G.art.portrait(ch.look, ex, pose), 0, 0);
}
UI.stageShow = function (on) { $('stage').classList.toggle('on', !!on); };
UI.setL = function (k, ex) { if (ex && typeof ex === 'object') ex = G.pick(ex); ST.L = k; ST.Lex = ex || 'n'; drawPort($('pl'), k ? G.charOf(k) : null, ST.Lex); $('pl').classList.toggle('none', !k); };
UI.setR = function (k, ex, pose) { if (ex && typeof ex === 'object') ex = G.pick(ex); ST.R = k; ST.Rex = ex || 'n'; const c = $('pr'); drawPort(c, k ? G.charOf(k) : null, ST.Rex, pose); c.classList.toggle('none', !k); c.classList.toggle('robot', k === 'r' || (k === 'as' && G.C && G.C.as === 'r')); };
UI.focus = function (side) { $('pl').classList.toggle('off', side !== 'L'); $('pr').classList.toggle('off', side !== 'R'); };
UI.clearStage = function () { UI.setL(null); UI.setR(null); UI.stageShow(false); };

/* ---------- 演出 ---------- */
const FX = G.fx = {};
FX.shake = function (strong) { const s = $('screen'); s.classList.remove('shake', 'shake2'); void s.offsetWidth; s.classList.add(strong ? 'shake2' : 'shake'); };
FX.flash = function (col) { const f = $('flash'); f.style.background = col || '#fff'; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); };
FX.dark = function (on) { $('darken').classList.toggle('on', !!on); };
FX.big = function (text, cls, ms, cb) {
  const b = $('big'); b.className = 'on ' + (cls || ''); b.innerHTML = esc(G.fmt(text)).replace(/\n/g, '<br>');
  const done = () => { b.className = ''; cb && cb(); };
  if (G.auto) return done();
  setTimeout(done, ms || 1300);
};
G.toast = function (t, ms) { const e = $('toast'); e.textContent = G.fmt(t); e.classList.add('on'); clearTimeout(G.toast.h); G.toast.h = setTimeout(() => e.classList.remove('on'), ms || 2400); };

/* ---------- 会話ウィンドウ ---------- */
const D = UI.dlg = { line: null, shown: 0, cb: null, typing: false, layer: null };
const dlgEl = () => $('dlg');
function speakerSide(who) { if (who === 'me' || who === 'as' || who === 'c' || who === 'd' || who === 'r') return 'R'; if (who === 'nar' || who === 'sys') return null; return 'L'; }
D.open = function () { dlgEl().classList.add('on'); };
D.close = function () { dlgEl().classList.remove('on'); $('choices').innerHTML = ''; $('choices').classList.remove('on'); };
D.say = function (who, ex, text, cb) {
  if (ex && typeof ex === 'object') ex = G.pick(ex);
  text = G.fmt(text);
  const side = speakerSide(who);
  const ch = side ? G.charOf(who) : null;
  if (side) {
    UI.stageShow(true);
    if (side === 'L') UI.setL(who, ex); else UI.setR(who, ex);
    if (side === 'L') UI.setR(null); else UI.setL(null);
    UI.focus(side);
  } else { UI.clearStage(); }
  const nm = $('dname');
  nm.textContent = ch ? (ch.name || '') : '';
  nm.className = side === 'R' ? 'r' : '';
  nm.style.display = ch ? '' : 'none';
  $('dtext').className = who === 'nar' ? 'nar' : (who === 'sys' ? 'sys' : '');
  D.line = { text, v: ch ? ch.v || 500 : 0 }; D.shown = 0; D.cb = cb; D.typing = true;
  $('dtext').textContent = ''; $('dnext').classList.remove('on');
  D.open();
  if (!D.layer) D.layer = UI.push({ name: 'dlg', key: k => { if (k === 'ok' || k === 'back' && false) D.advance(); } });
  if (G.auto) { D.shown = text.length; D.typing = false; $('dtext').textContent = text; const c = D.cb; D.cb = null; setTimeout(() => c && c(), 0); }
};
D.advance = function () {
  if (!D.line) return;
  if (D.typing) { D.shown = D.line.text.length; D.typing = false; $('dtext').textContent = D.line.text; $('dnext').classList.add('on'); return; }
  G.audio.sfx('blip', 900);
  const c = D.cb; D.cb = null; D.line = null; c && c();
};
D.tick = function () {
  if (!D.line || !D.typing) return;
  const sp = [0.45, 0.9, 2.2][G.set.speed] || 0.9;
  const before = Math.floor(D.shown);
  D.shown = Math.min(D.line.text.length, D.shown + sp);
  const n = Math.floor(D.shown);
  if (n !== before) { $('dtext').textContent = D.line.text.slice(0, n); if (n % 2 === 0 && D.line.v && !' 、。…！？「」（）'.includes(D.line.text[n - 1])) G.audio.sfx('blip', D.line.v + (n % 3) * 30); }
  if (D.shown >= D.line.text.length) { D.typing = false; $('dnext').classList.add('on'); }
};
D.end = function () { D.close(); UI.clearStage(); if (D.layer) { UI.pop(D.layer); D.layer = null; } D.line = null; };

/* 選択肢 */
D.choice = function (q, opts, cb, who, ex) {
  const show = () => {
    const box = $('choices'); box.classList.add('on');
    let sel = 0;
    const render = () => { box.innerHTML = opts.map((o, i) => `<button class="ch${i === sel ? ' sel' : ''}" data-i="${i}">${esc(G.fmt(o.t || o))}</button>`).join(''); };
    render();
    const pick = i => { G.audio.sfx('ok'); box.innerHTML = ''; box.classList.remove('on'); UI.pop(layer); cb(i); };
    const layer = UI.push({ name: 'choice', key: k => {
      if (k === 'up' || k === 'left') { sel = (sel + opts.length - 1) % opts.length; G.audio.sfx('move'); render(); }
      else if (k === 'down' || k === 'right') { sel = (sel + 1) % opts.length; G.audio.sfx('move'); render(); }
      else if (k === 'ok') pick(sel);
    } });
    box.onclick = e => { const b = e.target.closest('button'); if (b) pick(+b.dataset.i); };
    if (G.auto) { const i = G.autoChoice ? G.autoChoice(q, opts) : 0; setTimeout(() => pick(i), 0); }
  };
  if (q) {
    D.say(who || 'nar', ex || 'n', q, null);
    D.shown = D.line.text.length; D.typing = false; $('dtext').textContent = D.line.text;
    show();
  } else show();
};

/* ---------- スクリプト実行 ---------- */
G.run = function (script, done) {
  const q = (script || []).slice();
  const next = () => {
    if (!q.length) { D.end(); done && done(); return; }
    const it = q.shift();
    G.exec(it, next, q);
  };
  next();
};
G.exec = function (it, next, q) {
  if (it == null) return next();
  if (typeof it === 'string') return D.say('nar', 'n', it, next);
  if (Array.isArray(it)) { const [who, ex, t] = it; return D.say(who, ex || 'n', t, next); }
  if (typeof it === 'function') { it(); return next(); }
  if (it.if !== undefined) { const br = G.cond(it.if) ? it.then : it.else; if (br) q.unshift(...br); return next(); }
  if (it.as) { const a = it.as[G.C ? G.C.as : 'c']; if (a) q.unshift(...a); return next(); }
  if (it.diff) { const a = it.diff[G.C ? G.C.diff : 'normal']; if (a) q.unshift(...a); return next(); }
  if (it.flag) { [].concat(it.flag).forEach(f => G.C.flags[f] = true); return next(); }
  if (it.unflag) { [].concat(it.unflag).forEach(f => delete G.C.flags[f]); return next(); }
  if (it.sfx) G.audio.sfx(it.sfx);
  if (it.bgm !== undefined) G.audio.bgm(it.bgm);
  if (it.shake) FX.shake(it.shake === 2);
  if (it.flash) FX.flash(it.flash === true ? '#fff' : it.flash);
  if (it.dark !== undefined) FX.dark(it.dark);
  if (it.L !== undefined) { UI.stageShow(true); UI.setL(it.L, it.ex); }
  if (it.R !== undefined) { UI.stageShow(true); UI.setR(it.R, it.ex); }
  if (it.rep) { G.addRep(it.rep); G.toast((it.rep > 0 ? '探偵としての評判が上がった！ ＋' : '評判が下がった… ') + it.rep); }
  if (it.info) { G.addInfo(it.info[0], it.info[1]); }
  if (it.sus) { G.addInfo(it.sus[0], it.sus[1], 'sus'); }
  if (it.log) { G.addLog(it.log); }
  if (it.fn) { it.fn(); }
  if (it.ev) { return G.gainEv(it.ev, it.how, next, it.silent); }
  if (it.reveal) { G.C.rev[it.reveal] = true; G.audio.sfx('reveal'); }
  if (it.choice) { const c = it.choice; const opts = c.opts.filter(o => G.cond(o.need)); return D.choice(c.q, opts, i => { const s = opts[i].s; if (s) q.unshift(...s); next(); }, c.who, c.ex); }
  if (it.big) { return FX.big(it.big, it.cls, it.ms, next); }
  if (it.testi) { D.end(); return G.trial.testimony(it.testi, () => next()); }
  if (it.wait) { if (G.auto) return next(); return setTimeout(next, it.wait); }
  if (it.go) { D.end(); return it.go(); }
  if (it.clear) { UI.clearStage(); }
  next();
};

/* ---------- 汎用メニュー（パネル） ---------- */
const P = UI.panel = {};
P.open = function (html, cls) { const p = $('panel'); p.className = 'on ' + (cls || ''); p.innerHTML = html; return p; };
P.close = function () { const p = $('panel'); p.className = ''; p.innerHTML = ''; };
UI.menu = function (o) {
  // o: {title, items:[{t,sub,dis,fn,badge}], back, cls, sel}
  let sel = o.sel || 0; const items = o.items;
  const html = () => `<div class="box menu ${o.cls || ''}"><div class="ttl">${esc(G.fmt(o.title || ''))}</div>${o.head || ''}<div class="list">${items.map((it, i) =>
    `<button class="mi${i === sel ? ' sel' : ''}${it.dis ? ' dis' : ''}" data-i="${i}"><span>${esc(G.fmt(it.t))}</span>${it.badge ? `<em>${esc(it.badge)}</em>` : ''}${it.sub ? `<small>${esc(G.fmt(it.sub))}</small>` : ''}</button>`).join('')}</div>${o.foot ? `<div class="mfoot">${o.foot}</div>` : ''}</div>`;
  const render = () => { const p = P.open(html(), 'center ' + (o.cls || '')); p.onclick = e => { const b = e.target.closest('.mi'); if (b) { sel = +b.dataset.i; choose(); } }; const s = p.querySelector('.mi.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' }); };
  const close = () => { UI.pop(layer); P.close(); };
  const choose = () => { const it = items[sel]; if (!it || it.dis) { G.audio.sfx('wrong'); return; } G.audio.sfx('ok'); if (!it.keep) close(); it.fn && it.fn(close); };
  const layer = UI.push({ name: 'menu', key: k => {
    if (k === 'up') { sel = (sel + items.length - 1) % items.length; G.audio.sfx('move'); render(); }
    else if (k === 'down') { sel = (sel + 1) % items.length; G.audio.sfx('move'); render(); }
    else if (k === 'ok') choose();
    else if (k === 'back' && o.back !== false) { G.audio.sfx('back'); close(); o.back && o.back(); }
  }, refresh: render });
  render();
  return { close, layer };
};
UI.confirm = function (q, yes, no) {
  UI.menu({ title: q, items: [{ t: 'はい', fn: yes }, { t: 'いいえ', fn: no }], back: no, cls: 'small' });
};

/* ---------- 証拠品 ---------- */
G.evData = id => (G.CASE && G.CASE.evidence[id]) || null;
G.gainEv = function (id, how, next, silent) {
  const e = G.evData(id);
  if (!e) { console.warn('no ev', id); return next && next(); }
  if (G.has(id)) return next && next();
  G.C.ev.push(id);
  G.C.evInfo[id] = { where: e.where || '', how: G.fmt(how || e.how || '') };
  if (id === G.CASE.fragment) { G.caseRec(G.CASE.id).frag = true; }
  G.autosave();
  if (silent) return next && next();
  G.audio.sfx('found'); FX.flash('#fff6c8');
  const box = $('getbox'); box.innerHTML = `<canvas width="16" height="16"></canvas><div><small>証拠品を手に入れた！</small><b>${esc(e.name)}</b></div>`;
  box.querySelector('canvas').getContext('2d').drawImage(G.art.icon(e.icon, e.col), 0, 0);
  box.classList.add('on');
  D.say('sys', 'n', `証拠品「${e.name}」を手帳に記録した。`, () => { box.classList.remove('on'); next && next(); });
};
G.addInfo = function (who, text, kind) {
  const p = G.C.ppl[who] || (G.C.ppl[who] = { met: true, info: [], sus: [], tl: [] });
  const arr = kind === 'sus' ? p.sus : p.info; const t = G.fmt(text);
  if (!arr.includes(t)) { arr.push(t); if (!G.auto) G.toast(kind === 'sus' ? '人物図鑑：怪しい点を記録した' : '人物図鑑が更新された'); }
};
G.addTl = function (who, text) {
  const p = G.C.ppl[who] || (G.C.ppl[who] = { met: true, info: [], sus: [], tl: [] }); const t = G.fmt(text);
  if (!p.tl.includes(t)) p.tl.push(t);
};
G.addLog = function (t) { t = G.fmt(t); if (!G.C.log.includes(t)) G.C.log.push(t); };
G.meet = function (who) { if (!G.C.ppl[who]) G.C.ppl[who] = { met: true, info: [], sus: [], tl: [] }; };

/* 証拠品画面: mode 'view' | 'present' */
UI.evidence = function (mode, onPick, onCancel, prompt) {
  const list = () => G.C.ev.slice();
  let sel = 0, combo = null, act = null;
  const cols = 4;
  const render = () => {
    const ids = list();
    if (sel >= ids.length) sel = Math.max(0, ids.length - 1);
    const id = ids[sel], e = id ? G.evData(id) : null, inf = id ? G.C.evInfo[id] || {} : {};
    const robo = id && G.C.robo[id];
    const html = `<div class="box evbox"><div class="ttl">${mode === 'present' ? esc(G.fmt(prompt || '見せる証拠品を選んでください')) : '持ち物・証拠品'}${combo ? `　<span class="cmb">組み合わせ：「${esc(G.evData(combo).name)}」と…？</span>` : ''}</div>
      <div class="evwrap"><div class="evgrid">${ids.length ? ids.map((x, i) => `<button class="evi${i === sel ? ' sel' : ''}${x === combo ? ' cm' : ''}" data-i="${i}" title="${esc(G.evData(x).name)}"><canvas width="16" height="16" data-ic="${x}"></canvas></button>`).join('') : '<p class="empty">まだ証拠品はない。</p>'}</div>
      <div class="evdet">${e ? `<div class="evh"><canvas width="16" height="16" class="bigic" data-ic="${id}"></canvas><b>${esc(e.name)}</b></div>
        <p>${esc(G.fmt(e.desc))}</p>${robo ? `<p class="robo">【${esc(G.asName('r'))}の分析】${esc(G.fmt(robo))}</p>` : ''}
        <dl><dt>入手した場所</dt><dd>${esc(inf.where || '―')}</dd><dt>入手した経緯</dt><dd>${esc(inf.how || '―')}</dd></dl>` : ''}</div></div>
      <div class="evkeys">${mode === 'present' ? '<button data-a="ok">Z：これを見せる</button>' : '<button data-a="ok">Z：使う／組み合わせる</button>'}<button data-a="combine">C：組み合わせる</button>${G.C.as === 'r' ? '<button data-a="robo">A：AIで分析</button>' : ''}<button data-a="back">X：閉じる</button></div></div>`;
    const p = P.open(html, 'full');
    p.querySelectorAll('canvas[data-ic]').forEach(c => { const ev = G.evData(c.dataset.ic); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.icon(ev.icon, ev.col), 0, 0); });
    p.onclick = ev => { const b = ev.target.closest('.evi'); if (b) { const i = +b.dataset.i; if (i === sel) key('ok'); else { sel = i; render(); } return; } const a = ev.target.closest('[data-a]'); if (a) key(a.dataset.a); };
  };
  const close = () => { UI.pop(layer); P.close(); };
  const tryCombine = (a, b) => {
    const ea = G.evData(a), eb = G.evData(b);
    let res = null;
    for (const [x, y, r] of G.CASE.combos || []) if ((x === a && y === b) || (x === b && y === a)) res = r;
    close();
    if (res && !G.has(res)) {
      G.audio.sfx('combine');
      G.run([{ big: '証拠品を組み合わせた！', cls: 'combo', ms: 900 }, ['me', 'surp', `「${ea.name}」と「${eb.name}」…そうか、つまり――！`], { ev: res, how: `「${ea.name}」と「${eb.name}」を組み合わせて導き出した。` }, { log: `証拠品の組み合わせ：「${ea.name}」＋「${eb.name}」→「${G.evData(res).name}」` }], () => UI.evidence(mode, onPick, onCancel, prompt));
    } else if (res) { G.run([['me', 'n', 'この組み合わせは、もう手帳にまとめてある。']], () => UI.evidence(mode, onPick, onCancel, prompt)); }
    else { G.audio.sfx('wrong'); G.run([['me', 'conf', `「${ea.name}」と「${eb.name}」…組み合わせても、特に何も分からないな。`]], () => UI.evidence(mode, onPick, onCancel, prompt)); }
  };
  const key = k => {
    const ids = list(); const id = ids[sel];
    if (k === 'left') { sel = Math.max(0, sel - 1); G.audio.sfx('move'); render(); }
    else if (k === 'right') { sel = Math.min(ids.length - 1, sel + 1); G.audio.sfx('move'); render(); }
    else if (k === 'up') { sel = Math.max(0, sel - cols); G.audio.sfx('move'); render(); }
    else if (k === 'down') { sel = Math.min(ids.length - 1, sel + cols); G.audio.sfx('move'); render(); }
    else if (k === 'back') { if (combo) { combo = null; render(); return; } G.audio.sfx('back'); close(); onCancel && onCancel(); }
    else if (k === 'combine' || k === 'consult') { if (!id) return; if (combo && combo !== id) return tryCombine(combo, id); combo = combo ? null : id; G.audio.sfx('ok'); render(); }
    else if (k === 'robo' || k === 'accuse_a') { if (G.C.as !== 'r' || !id) return; const e = G.evData(id); close(); G.run(e.robo ? [['as', 'analyze', '解析を開始します…'], { fn: () => { G.C.robo[id] = e.robo; } }, ['as', 'n', e.robo], ...(e.roboS || [])] : [['as', 'think', `「${e.name}」を解析しました。…これ以上の情報は検出できませんでした。`]], () => UI.evidence(mode, onPick, onCancel, prompt)); }
    else if (k === 'ok') {
      if (!id) return;
      if (combo) { if (combo === id) { combo = null; render(); return; } return tryCombine(combo, id); }
      if (mode === 'present') { close(); onPick && onPick(id); }
      else { combo = id; G.audio.sfx('ok'); render(); G.toast('組み合わせる相手を選んでください（X：やめる）'); }
    }
  };
  const layer = UI.push({ name: 'evidence', key });
  render();
};

/* ---------- 人物図鑑 ---------- */
UI.people = function (onClose) {
  const keys = () => { const c = G.CASE; return (c.cast || Object.keys(c.chars)).filter(k => G.C.ppl[k]); };
  let sel = 0;
  const render = () => {
    const ks = keys(); const k = ks[sel]; const ch = k ? G.charOf(k) : null, p = k ? G.C.ppl[k] : null;
    const cd = k && G.CASE.chars[k] ? G.CASE.chars[k] : (G.GCH[k] || {});
    const gated = (arr) => (arr || []).filter(x => G.cond(x.need)).map(x => G.fmt(x.t));
    const info = p ? gated(cd.info).concat(p.info) : [];
    const sus = p ? gated(cd.sus).concat(p.sus) : [];
    const robo = p && G.C.as === 'r' ? gated(cd.robo) : [];
    const age = cd.age && (G.cond(cd.ageNeed || 'talk_' + k) || G.C.as === 'r') ? cd.age : '？？';
    const html = `<div class="box pplbox"><div class="ttl">人物図鑑</div><div class="pwrap"><div class="plist">${ks.map((x, i) => `<button class="pi${i === sel ? ' sel' : ''}" data-i="${i}"><canvas width="16" height="16" data-sp="${x}"></canvas>${esc(G.charOf(x).name)}</button>`).join('')}</div>
      <div class="pdet">${ch ? `<div class="phead"><canvas width="48" height="56" class="pp" data-pt="${k}"></canvas><div><b>${esc(ch.name)}</b><table><tr><th>年齢</th><td>${esc(age)}</td></tr><tr><th>職業</th><td>${esc(G.fmt(cd.job || '？？'))}</td></tr><tr><th>関係</th><td>${esc(G.fmt(cd.rel || '？？'))}</td></tr></table></div></div>
      <h4>証言</h4>${p.tl.length ? '<ul>' + p.tl.map(t => `<li>${esc(t)}</li>`).join('') + '</ul>' : '<p class="empty">まだ証言を聞いていない。</p>'}
      <h4>怪しい点</h4>${sus.length ? '<ul>' + sus.map(t => `<li>${esc(t)}</li>`).join('') + '</ul>' : '<p class="empty">今のところ見当たらない。</p>'}
      <h4>分かった情報</h4>${info.length ? '<ul>' + info.map(t => `<li>${esc(t)}</li>`).join('') + '</ul>' : '<p class="empty">調査を進めよう。</p>'}
      ${robo.length ? `<h4>${esc(G.asName('r'))}の人物調査</h4><ul>` + robo.map(t => `<li class="robo">${esc(t)}</li>`).join('') + '</ul>' : ''}` : '<p class="empty">まだ誰にも会っていない。</p>'}</div></div><div class="evkeys"><button data-a="back">X：閉じる</button>　↑↓：人物を選ぶ</div></div>`;
    const pn = P.open(html, 'full');
    pn.querySelectorAll('canvas[data-sp]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.sprite(G.charOf(c.dataset.sp).look, 'down', 0), 0, 0); });
    pn.querySelectorAll('canvas[data-pt]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.portrait(G.charOf(c.dataset.pt).look, 'n'), 0, 0); });
    pn.onclick = e => { const b = e.target.closest('.pi'); if (b) { sel = +b.dataset.i; render(); } if (e.target.closest('[data-a="back"]')) key('back'); };
    const s = pn.querySelector('.pi.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
  };
  const close = () => { UI.pop(layer); P.close(); onClose && onClose(); };
  const key = k => { const n = keys().length; if (k === 'up' || k === 'left') { sel = (sel + n - 1) % Math.max(1, n); render(); } else if (k === 'down' || k === 'right') { sel = (sel + 1) % Math.max(1, n); render(); } else if (k === 'back' || k === 'ok') { G.audio.sfx('back'); close(); } };
  const layer = UI.push({ name: 'people', key });
  render();
};

/* ---------- 事件ファイル ---------- */
UI.caseFile = function (onClose, globalOnly) {
  const tabs = globalOnly ? ['記録'] : ['概要', '時系列', 'アリバイ', '証言', '矛盾点', '推理記録', '記録'];
  let tab = 0;
  const gated = arr => (arr || []).filter(x => G.cond(x.need));
  const body = () => {
    const c = G.CASE, C = G.C, name = tabs[tab];
    if (name === '概要') {
      const inc = c.incident;
      const t = inc && G.cond(inc.need) ? inc.t : '不明';
      const sum = gated(c.summary).map(s => `<li>${esc(G.fmt(s.t))}</li>`).join('');
      return `<h3>${esc(c.no)}「${esc(c.title)}」</h3><p class="dim">${esc(c.genre)}／舞台：${esc(c.place)}／難易度：${C.diff.toUpperCase()}／助手：${esc(G.asName())}（${G.ASSIST[C.as].title}）</p>
        <table class="ft"><tr><th>事件の発生時刻</th><td>${esc(t)}</td></tr><tr><th>証拠品</th><td>${C.ev.length} / ${Object.keys(c.evidence).length} 個</td></tr><tr><th>見つけた矛盾</th><td>${C.contra.length} 件</td></tr><tr><th>まちがった告発</th><td>${C.wacc} 回</td></tr></table>
        <h4>事件のあらまし</h4><ul>${sum}</ul>`;
    }
    if (name === '時系列') {
      const rows = (c.timeline || []).map(r => G.cond(r.need) ? `<tr><th>${esc(r.t)}</th><td>${esc(G.fmt(r.s))}</td></tr>` : `<tr class="unk"><th>${esc(r.tq || '不明')}</th><td>？？？（まだ分からない）</td></tr>`).join('');
      return `<h4>事件の時系列</h4><p class="dim">分かった順に自動で整理されます。分からない時刻は「不明」と表示されます。</p><table class="ft tl">${rows}</table>`;
    }
    if (name === 'アリバイ') {
      const rows = (c.alibi || []).filter(a => G.C.ppl[a.who]).map(a => { const st = (a.st || []).filter(s => G.cond(s.need)).pop(); return `<tr><th>${esc(G.charOf(a.who).name)}</th><td>${G.cond(a.need) ? esc(G.fmt(a.claim)) : '？？？'}</td><td class="${st ? st.cls || '' : ''}">${st ? esc(G.fmt(st.v)) : '未確認'}</td></tr>`; }).join('');
      return `<h4>関係者のアリバイ</h4><table class="ft"><tr><th>人物</th><th>本人の主張</th><th>確認状況</th></tr>${rows || '<tr><td colspan="3">まだ話を聞いていない。</td></tr>'}</table>`;
    }
    if (name === '証言') {
      const ks = (c.cast || Object.keys(c.chars)).filter(k => C.ppl[k] && C.ppl[k].tl.length);
      return `<h4>集めた証言</h4>${ks.map(k => `<p><b>${esc(G.charOf(k).name)}</b></p><ul>${C.ppl[k].tl.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`).join('') || '<p class="empty">まだ証言はない。</p>'}`;
    }
    if (name === '矛盾点') return `<h4>見つけた矛盾</h4>${C.contra.length ? '<ul>' + C.contra.map(t => `<li>${esc(t)}</li>`).join('') + '</ul>' : '<p class="empty">まだ矛盾は見つけていない。証言に証拠品を突きつけよう。</p>'}`;
    if (name === '推理記録') return `<h4>解決までの推理記録</h4>${C.log.length ? '<ol>' + C.log.map(t => `<li>${esc(t)}</li>`).join('') + '</ol>' : '<p class="empty">推理はこれからだ。</p>'}`;
    return G.story.recordHTML();
  };
  const render = () => {
    const html = `<div class="box cfbox"><div class="ttl">事件ファイル</div><div class="tabs">${tabs.map((t, i) => `<button class="tb${i === tab ? ' on' : ''}" data-t="${i}">${t}</button>`).join('')}</div><div class="cfbody" id="cfbody">${body()}</div><div class="evkeys">←→：タブ切替　↑↓：スクロール　<button data-a="back">X：閉じる</button></div></div>`;
    const p = P.open(html, 'full');
    p.onclick = e => { const b = e.target.closest('.tb'); if (b) { tab = +b.dataset.t; render(); } if (e.target.closest('[data-a="back"]')) key('back'); };
  };
  const close = () => { UI.pop(layer); P.close(); onClose && onClose(); };
  const key = k => { const b = $('cfbody'); if (k === 'left') { tab = (tab + tabs.length - 1) % tabs.length; G.audio.sfx('move'); render(); } else if (k === 'right') { tab = (tab + 1) % tabs.length; G.audio.sfx('move'); render(); } else if (k === 'up' && b) b.scrollTop -= 60; else if (k === 'down' && b) b.scrollTop += 60; else if (k === 'back' || k === 'ok') { G.audio.sfx('back'); close(); } };
  const layer = UI.push({ name: 'casefile', key });
  render();
};

/* ---------- 設定 ---------- */
UI.settings = function (onClose) {
  let sel = 0;
  const rows = [
    { t: 'BGM音量', get: () => Math.round(G.set.bgm * 10), adj: d => { G.set.bgm = G.clamp(Math.round(G.set.bgm * 10 + d) / 10, 0, 1); } },
    { t: '効果音音量', get: () => Math.round(G.set.sfx * 10), adj: d => { G.set.sfx = G.clamp(Math.round(G.set.sfx * 10 + d) / 10, 0, 1); G.audio.sfx('ok'); } },
    { t: 'ミュート', get: () => G.set.mute ? 'ON' : 'OFF', adj: () => { G.set.mute = !G.set.mute; } },
    { t: '文字の速さ', get: () => ['遅い', '普通', '速い'][G.set.speed], adj: d => { G.set.speed = G.clamp(G.set.speed + d, 0, 2); } },
    { t: '調べるマーク', get: () => G.set.marks ? '表示' : '非表示', adj: () => { G.set.marks = !G.set.marks; } },
  ];
  const render = () => {
    const html = `<div class="box menu"><div class="ttl">設定</div><div class="list">${rows.map((r, i) => `<div class="mi set${i === sel ? ' sel' : ''}" data-i="${i}"><span>${r.t}</span><span class="val"><button data-d="-1">◀</button> ${esc(String(r.get()))} <button data-d="1">▶</button></span></div>`).join('')}</div><div class="mfoot">↑↓：項目　←→：変更　X：もどる</div></div>`;
    const p = P.open(html, 'center');
    p.onclick = e => { const it = e.target.closest('.mi'); if (it) sel = +it.dataset.i; const b = e.target.closest('[data-d]'); if (b) change(+b.dataset.d); else render(); };
  };
  const change = d => { rows[sel].adj(d); G.audio.applyVol(); G.saveSettings(); render(); };
  const close = () => { UI.pop(layer); P.close(); onClose && onClose(); };
  const layer = UI.push({ name: 'settings', key: k => { if (k === 'up') { sel = (sel + rows.length - 1) % rows.length; render(); } else if (k === 'down') { sel = (sel + 1) % rows.length; render(); } else if (k === 'left') change(-1); else if (k === 'right' || k === 'ok') change(1); else if (k === 'back') { G.audio.sfx('back'); close(); } } });
  render();
};

/* ---------- 操作説明 ---------- */
UI.help = function (onClose) {
  const html = `<div class="box helpbox"><div class="ttl">操作説明</div><table class="ft">
    <tr><th>矢印キー／WASD</th><td>移動・カーソル移動</td></tr>
    <tr><th>Z／Enter／Space</th><td>決定・調べる・話す・会話を進める</td></tr>
    <tr><th>X／Esc</th><td>戻る・キャンセル</td></tr>
    <tr><th>I</th><td>持ち物・証拠品（証言中は「証拠を見せる」）</td></tr>
    <tr><th>M</th><td>メニュー（図鑑・事件ファイル・セーブ・設定）</td></tr>
    <tr><th>C</th><td>助手に相談（隠し場所の発見・ヒント）／証拠品画面では組み合わせ</td></tr>
    <tr><th>F</th><td>「あなたが犯人だ！」告発ボタン</td></tr>
    <tr><th>A</th><td>証拠品画面でAIロボットに分析させる（助手がロボットのとき）</td></tr></table>
    <h4>推理のコツ</h4><ul><li>✦マークは調べられる場所。人物の頭上の「！」は、まだ話していない人。</li><li>会話では「聞く」「詳しく聞く」「証拠を見せる」「推理する」が使えます。</li><li>証言では、怪しい発言を選んで「詳しく聞く（Z）」か「証拠を見せる（I）」。</li><li>証拠品画面で2つを選ぶと「組み合わせ」で新しい手がかりになることがあります。</li><li>犯人が分かったら「F：あなたが犯人だ！」。まちがえても何度でも挑戦できます。</li></ul>
    <div class="evkeys"><button data-a="back">X：閉じる</button></div></div>`;
  const p = P.open(html, 'center');
  const close = () => { UI.pop(layer); P.close(); onClose && onClose(); };
  p.onclick = e => { if (e.target.closest('[data-a="back"]')) close(); };
  const layer = UI.push({ name: 'help', key: k => { if (k === 'back' || k === 'ok') { G.audio.sfx('back'); close(); } } });
};

/* ---------- セーブ・ロード画面 ---------- */
UI.saveLoad = function (mode, onClose, onLoaded) {
  const slots = mode === 'save' ? ['1', '2', '3'] : G.SLOTS;
  const label = s => s === 'auto' ? 'オート' : 'スロット' + s;
  UI.menu({
    title: mode === 'save' ? 'セーブ（どこに保存しますか？）' : 'ロード（どのデータを読み込みますか？）',
    items: slots.map(s => { const d = G.readSave(s); return { t: label(s) + '：' + G.saveSummary(d), dis: mode === 'load' && (!d || d.bad), fn: () => {
      if (mode === 'save') { G.save(s); G.audio.sfx('success'); G.toast(label(s) + 'にセーブしました'); onClose && onClose(); }
      else { G.loadFrom(G.readSave(s)); onLoaded && onLoaded(); }
    } }; }),
    back: onClose, foot: mode === 'load' ? 'セーブデータが壊れている場合はバックアップから自動で復元を試みます。' : 'オートセーブは証拠入手や推理の成功時に自動で行われます。',
  });
};
})();
