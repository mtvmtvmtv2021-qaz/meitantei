/* =========================================================
   explore.js ― 見下ろし型マップ探索・カメラ・調査・会話メニュー
   ========================================================= */
(function () {
const T = 16, VW = 384, VH = 216;
const E = G.explore = { map: null, player: null, follower: null, cam: { x: 0, y: 0 }, mode: 'off', frame: 0, held: {}, trail: [] };
const A = G.art;

/* ---------- マップ構築 ---------- */
G.MB = function (w, h, theme) {
  const m = []; for (let y = 0; y < h; y++) m.push(new Array(w).fill(' '));
  const B = { w, h, m, theme, areas: [], locks: [], decor: [],
    set(x, y, ch) { if (x >= 0 && y >= 0 && x < w && y < h) m[y][x] = ch; },
    get(x, y) { return (x >= 0 && y >= 0 && x < w && y < h) ? m[y][x] : ' '; },
    fill(x, y, ww, hh, ch) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) B.set(x + i, y + j, ch); },
    room(x, y, ww, hh, fl, name, o) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const edge = i === 0 || j === 0 || i === ww - 1 || j === hh - 1; if (edge) { if (B.get(x + i, y + j) !== 'D') B.set(x + i, y + j, '#'); } else B.set(x + i, y + j, fl); } if (name) B.areas.push(Object.assign({ x: x + 1, y: y + 1, w: ww - 2, h: hh - 2, name }, o || {})); },
    door(x, y) { B.set(x, y, 'D'); },
    row(x, y, str) { [...str].forEach((c, i) => { if (c !== '?') B.set(x + i, y, c); }); },
    lock(x, y, need, msg) { B.locks.push({ x, y, need, msg }); },
  };
  return B;
};
G.build6 = function (B, R, cor) {
  const top = [[0, 0, 11, 10], [10, 0, 10, 10], [19, 0, 11, 10]], bot = [[0, 13, 11, 8], [10, 13, 10, 8], [19, 13, 11, 8]];
  top.forEach((r, i) => { const o = R[i]; B.room(r[0], r[1], r[2], r[3], o.fl || '.', o.name, o.o); });
  B.room(0, 9, 30, 5, cor.fl || '.', cor.name, cor.o);
  bot.forEach((r, i) => { const o = R[i + 3]; B.room(r[0], r[1], r[2], r[3], o.fl || '.', o.name, o.o); });
  [5, 14, 24].forEach(x => { B.door(x, 9); B.door(x, 13); });
};
E.load = function (def) {
  const B = G.MB(def.w, def.h, def.theme);
  def.build(B);
  E.map = B;
};
E.areaAt = function (x, y) { if (!E.map) return null; for (const a of E.map.areas) if (x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h) return a; return null; };

/* ---------- 実体 ---------- */
E.npcs = function () {
  const out = [];
  if (!G.CASE) return out;
  for (const k in G.CASE.chars) {
    const ch = G.CASE.chars[k]; if (!ch.at) continue;
    const ats = Array.isArray(ch.at) ? ch.at : [ch.at];
    const at = ats.find(a => G.cond(a.need));
    if (at) out.push({ key: k, x: at.x, y: at.y, dir: at.dir || 'down', ch });
  }
  return out;
};
E.spots = function () {
  if (!G.CASE) return [];
  return G.CASE.spots.filter(s => G.cond(s.need) && (!s.hidden || G.C.rev[s.id] || G.C.diff === 'easy'));
};
E.hiddenSpots = function () { return G.CASE ? G.CASE.spots.filter(s => s.hidden && !G.C.rev[s.id] && G.C.diff !== 'easy' && G.cond(s.need)) : []; };
E.lockAt = function (x, y) { return E.map.locks.find(l => l.x === x && l.y === y && !G.cond(l.need)); };
E.solid = function (x, y) {
  const ch = E.map.get(x, y);
  if (A.SOLID.has(ch)) return true;
  if (E.lockAt(x, y)) return true;
  if (E.npcs().some(n => n.x === x && n.y === y)) return true;
  if (E.spots().some(s => s.solid && s.x === x && s.y === y)) return true;
  return false;
};

/* ---------- 開始 ---------- */
E.start = function (pos) {
  E.load(G.CASE.map);
  const p = pos || G.C.pos || G.CASE.start;
  E.player = { x: p.x, y: p.y, px: p.x * T, py: p.y * T, dir: p.d || p.dir || 'down', moving: false, tx: 0, ty: 0, step: 0 };
  E.trail = [];
  E.follower = (G.C.as === 'c' || G.C.as === 'd') ? { x: p.x, y: p.y + 1, px: p.x * T, py: (p.y + 1) * T, dir: 'down', step: 0, look: G.ASSIST[G.C.as].look } : null;
  if (E.follower && E.solid(E.follower.x, E.follower.y)) { E.follower.x = p.x; E.follower.y = p.y; E.follower.px = p.x * T; E.follower.py = p.y * T; }
  E.mode = 'play';
  E.lastArea = null;
  G.$('hud').classList.add('on');
  G.$('phone').classList.toggle('on', G.C.as === 'r');
  { const pc = G.$('phonecv').getContext('2d'); pc.imageSmoothingEnabled = false; pc.clearRect(0, 0, 16, 16); pc.drawImage(G.art.phoneIcon('n'), 0, 0); }
  E.updateHud();
  E.checkArea(true);
};
E.stop = function () { E.mode = 'off'; G.$('hud').classList.remove('on'); G.$('phone').classList.remove('on'); G.$('hint').classList.remove('on'); };
E.updateHud = function () {
  const a = E.areaAt(E.player.x, E.player.y);
  G.$('harea').textContent = a ? a.name : '';
  G.$('hcase').textContent = G.CASE ? G.CASE.no + '「' + G.CASE.title + '」' : '';
  G.$('hrep').textContent = '評判 ' + G.S.rep + '（' + G.repTitle() + '）';
};

/* ---------- 入力 ---------- */
E.key = function (k) {
  if (E.mode !== 'play') return;
  if (k === 'ok') return E.interact();
  if (k === 'inv') { G.audio.sfx('ok'); return G.ui.evidence('view'); }
  if (k === 'menu' || k === 'back') { G.audio.sfx('ok'); return G.story.menu(); }
  if (k === 'consult') return E.consult();
  if (k === 'accuse') return G.trial.accuseStart();
};
E.facing = function () { const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[E.player.dir]; return { x: E.player.x + d[0], y: E.player.y + d[1] }; };
E.targetAt = function (x, y) {
  const n = E.npcs().find(n => n.x === x && n.y === y); if (n) return { type: 'npc', n };
  const s = E.spots().find(s => s.x === x && s.y === y); if (s) return { type: 'spot', s };
  return null;
};
E.target = function () {
  const f = E.facing();
  return E.targetAt(f.x, f.y) || (() => { const s = E.spots().find(s => !s.solid && s.x === E.player.x && s.y === E.player.y); return s ? { type: 'spot', s } : null; })();
};
E.interact = function () {
  if (E.player.moving) return;
  const t = E.target();
  if (t && t.type === 'npc') return G.talk.open(t.n.key);
  if (t && t.type === 'spot') return E.examine(t.s);
  const f = E.facing(), l = E.lockAt(f.x, f.y);
  if (l) return G.run([['me', 'conf', l.msg || 'カギがかかっていて開かない。']]);
  const ch = E.map.get(f.x, f.y), look = (G.CASE.look || {})[ch] || G.LOOK[ch];
  if (look) G.run([['me', 'n', look]]);
};
G.LOOK = { B: '本がぎっしり並んでいる。', T: 'テーブルだ。', t: 'クロスのかかったテーブル。', c: '椅子だ。', S: 'ソファだ。', A: 'ひじ掛け椅子。', b: 'ベッドだ。', P: '観葉植物。', L: '撮影用の照明だ。', C: '機材ケースだ。', K: '引き出しのついた棚。', d: '机だ。', M: 'パソコンが置かれた机。', R: 'カウンターだ。', v: 'エレベーターだ。', p: 'ピアノだ。', F: 'フェンスだ。', G: '展示台だ。', H: 'ガラスの展示ケース。', Y: '木だ。', y: 'しげみだ。', Z: 'ロッカーだ。', X: '棚に箱や缶が並んでいる。', Q: '撮影用のカメラだ。', U: 'モニターがいくつも並んでいる。', J: 'セットの舞台だ。', O: '噴水だ。', V: '自動販売機だ。', n: 'プリンターだ。', h: '衣装がかかったハンガーラック。', m: '鏡台だ。', g: '振り子の大時計だ。', f: '暖炉だ。', q: '古いテレビだ。', i: 'ゴミ箱だ。', w: 'ホワイトボードだ。', l: 'フロアランプ。', k: '機械の操作盤だ。', W: '窓の外は暗い。', E: '配電盤だ。', '#': '壁だ。' };

E.examine = function (s) {
  const first = !G.C.seen[s.id];
  G.C.seen[s.id] = true;
  G.audio.sfx('ok');
  let script;
  if (first || !s.again) script = (s.s || []).slice();
  else script = s.again.slice();
  if (!first && !s.again) script = s.ev && G.has(s.ev) ? [['me', 'n', (s.name || 'ここ') + 'は、もう調べた。']] : (s.s || []).slice();
  if (s.ev && !G.has(s.ev) && (first || !s.again)) script.push({ ev: s.ev, how: s.how });
  if (s.set && first) script.push({ flag: s.set });
  G.run(script, () => E.afterAction());
};
E.afterAction = function () { E.updateHud(); G.trial.checkEvents(); };

/* ---------- 助手に相談 ---------- */
E.consult = function () {
  if (E.player.moving) return;
  const as = G.C.as, p = E.player;
  // 専用イベント
  const ev = (G.CASE.asEvents || []).find(e => e.as === as && !G.C.flags['asev_' + e.id] && G.cond(e.need) && (!e.area || (E.areaAt(p.x, p.y) || {}).name === e.area) && (!e.near || Math.abs(e.near.x - p.x) + Math.abs(e.near.y - p.y) <= (e.r || 3)));
  if (ev) { G.C.flags['asev_' + ev.id] = true; return G.run(ev.s.concat([{ log: ev.log || null }].filter(x => x.log)), () => E.afterAction()); }
  // 隠し場所の発見
  const range = as === 'r' ? 6 : as === 'd' ? 4 : 3;
  const hs = E.hiddenSpots().filter(s => Math.abs(s.x - p.x) + Math.abs(s.y - p.y) <= range);
  if (hs.length) return E.revealSpots(hs);
  // ヒント
  G.run(G.story.hintScript(), () => E.afterAction());
};
E.revealSpots = function (hs) {
  const as = G.C.as, s = hs[0];
  hs.forEach(h => G.C.rev[h.id] = true);
  const R = s.reveal && s.reveal[as];
  const base = {
    c: [['as', 'conf', `おい{name}、ちょっと待て。${s.name || 'そこ'}、なんか変じゃねえか？ 素人目にも不自然だろ。`], ['me', 'surp', 'たしかに…何か隠されているみたいだ！']],
    d: [{ sfx: 'bark' }, ['as', 'alert', 'ワン！ ワンワン！'], ['nar', 'n', `（{d}が${s.name || 'そこ'}の前で前足をそろえ、こちらを振り返っている…何かを見つけたと言っているようだ）`]],
    r: [['as', 'analyze', 'この部屋の構造を解析します…'], ['as', 'alert', `検出しました。${s.name || 'そこ'}に、通常とは異なる空間があります。調べてみてください。`]],
  }[as];
  G.audio.sfx('reveal');
  G.run((R || base).concat([{ fn: () => G.toast('隠された調査ポイントを発見した！') }]), () => E.afterAction());
};
E.dogScan = function () {
  if (G.C.as !== 'd' || E.mode !== 'play' || G.ui.busy()) return;
  const p = E.player;
  const hs = E.hiddenSpots().filter(s => Math.abs(s.x - p.x) + Math.abs(s.y - p.y) <= 2);
  if (hs.length) E.revealSpots(hs);
};

/* ---------- エリア移動 ---------- */
E.checkArea = function (force) {
  const a = E.areaAt(E.player.x, E.player.y);
  const name = a ? a.name : null;
  if (name !== E.lastArea || force) {
    E.lastArea = name;
    if (a && !force) G.toast(a.name, 1200);
    const bgm = (a && a.bgm) || G.CASE.bgm || 'explore';
    if (!G.trial.inTrial) G.audio.bgm(bgm);
    E.updateHud();
    if (a) { G.C.flags['area_' + a.name] = true; }
    if (!force) G.trial.checkEvents();
  }
};

/* ---------- 更新 ---------- */
E.update = function () {
  E.frame++;
  if (E.mode !== 'play' || !E.map) return;
  const p = E.player;
  if (!p.moving && !G.ui.busy()) {
    let d = null; for (const k of ['up', 'down', 'left', 'right']) if (E.held[k]) { d = k; break; }
    if (d) {
      p.dir = d; const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
      const nx = p.x + v[0], ny = p.y + v[1];
      if (!E.solid(nx, ny)) { p.moving = true; p.tx = nx; p.ty = ny; E.trail.unshift({ x: p.x, y: p.y }); E.trail.length = 3; }
      else { const l = E.lockAt(nx, ny); if (l && !E.bumped) { E.bumped = true; G.toast(l.msg || 'カギがかかっている'); setTimeout(() => E.bumped = false, 1500); } }
    }
  }
  if (p.moving) {
    const sp = 2, gx = p.tx * T, gy = p.ty * T;
    p.px += Math.sign(gx - p.px) * Math.min(sp, Math.abs(gx - p.px)); p.py += Math.sign(gy - p.py) * Math.min(sp, Math.abs(gy - p.py)); p.step++;
    if (p.px === gx && p.py === gy) {
      p.moving = false; p.x = p.tx; p.y = p.ty;
      if (p.step % 16 === 0) G.audio.sfx('step');
      E.checkArea(); E.dogScan();
      if (E.follower && E.trail[0]) { const f = E.follower; f.tx = E.trail[0].x; f.ty = E.trail[0].y; f.moving = true; }
    }
  }
  const f = E.follower;
  if (f && f.moving) {
    const gx = f.tx * T, gy = f.ty * T;
    if (gx < f.px) f.dir = 'left'; else if (gx > f.px) f.dir = 'right'; else if (gy < f.py) f.dir = 'up'; else if (gy > f.py) f.dir = 'down';
    f.px += Math.sign(gx - f.px) * Math.min(2, Math.abs(gx - f.px)); f.py += Math.sign(gy - f.py) * Math.min(2, Math.abs(gy - f.py)); f.step++;
    if (f.px === gx && f.py === gy) { f.moving = false; f.x = f.tx; f.y = f.ty; }
  }
  // カメラ追従
  const mw = E.map.w * T, mh = E.map.h * T;
  let cx = p.px + 8 - VW / 2, cy = p.py + 8 - VH / 2;
  cx = mw <= VW ? (mw - VW) / 2 : G.clamp(cx, 0, mw - VW);
  cy = mh <= VH ? (mh - VH) / 2 : G.clamp(cy, 0, mh - VH);
  E.cam.x += (cx - E.cam.x) * 0.25; E.cam.y += (cy - E.cam.y) * 0.25;
  if (Math.abs(cx - E.cam.x) < 0.5) E.cam.x = cx; if (Math.abs(cy - E.cam.y) < 0.5) E.cam.y = cy;
  // 調べるヒント
  const t = !G.ui.busy() ? E.target() : null;
  const hint = G.$('hint');
  if (t) { hint.textContent = t.type === 'npc' ? 'Z：話す（' + t.n.ch.name + '）' : 'Z：調べる（' + (t.s.name || '調査') + '）'; hint.classList.add('on'); }
  else hint.classList.remove('on');
};

/* ---------- 描画 ---------- */
E.draw = function (ctx) {
  if (!E.map) return;
  const M = E.map, cx = Math.round(E.cam.x), cy = Math.round(E.cam.y);
  ctx.fillStyle = '#07080f'; ctx.fillRect(0, 0, VW, VH);
  const x0 = Math.max(0, Math.floor(cx / T)), y0 = Math.max(0, Math.floor(cy / T));
  const x1 = Math.min(M.w, x0 + VW / T + 2), y1 = Math.min(M.h, y0 + VH / T + 2);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    let ch = M.m[y][x]; if (ch === ' ') continue;
    let key = ch;
    if (ch === '#') { const b = y < M.h - 1 ? M.m[y + 1][x] : '#'; key = (b !== '#' && b !== ' ' && b !== 'W' && b !== 'E' && b !== 'w') ? 'wf' : 'wt'; }
    const a = E.areaAt(x, y); const th = (a && a.theme) || M.theme;
    ctx.drawImage(A.tile(key, th), x * T - cx, y * T - cy);
    if (E.lockAt(x, y)) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x * T - cx, y * T - cy, T, T); ctx.fillStyle = '#c9a227'; ctx.fillRect(x * T - cx + 6, y * T - cy + 6, 4, 5); }
  }
  // 床の上の小物
  E.spots().forEach(s => { if (s.over) A.overlay(ctx, s.over, s.x * T - cx, s.y * T - cy); });
  (M.decor || []).forEach(d => { if (G.cond(d.need)) A.overlay(ctx, d.k, d.x * T - cx, d.y * T - cy); });
  // キャラ
  const ents = E.npcs().map(n => ({ look: n.ch.look, x: n.x * T, y: n.y * T, dir: n.dir, key: n.key, bob: (E.frame >> 5) % 2 }));
  if (E.follower) ents.push({ look: E.follower.look, x: E.follower.px, y: E.follower.py, dir: E.follower.dir, fr: E.follower.moving && (E.follower.step >> 2) % 2, me: 2 });
  ents.push({ look: G.myLook(), x: E.player.px, y: E.player.py, dir: E.player.dir, fr: E.player.moving && (E.player.step >> 2) % 2, me: 1 });
  ents.sort((a, b) => a.y - b.y).forEach(e => {
    const X = Math.round(e.x - cx), Y = Math.round(e.y - cy);
    if (X < -16 || Y < -24 || X > VW || Y > VH) return;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 3, Y + 14, 10, 2);
    ctx.drawImage(A.sprite(e.look, e.dir, e.fr ? 1 : 0), X, Y - (e.bob ? 1 : 0));
    if (e.key && !G.flag('talk_' + e.key) && G.set.marks) { const b = (E.frame >> 4) % 2; ctx.fillStyle = '#fff'; ctx.fillRect(X + 7, Y - 9 + b, 2, 5); ctx.fillRect(X + 7, Y - 3 + b, 2, 2); }
  });
  // 調べるマーク
  if (G.set.marks) {
    const p = E.player;
    E.spots().forEach(s => {
      const X = s.x * T - cx, Y = s.y * T - cy;
      const dist = Math.abs(s.x - p.x) + Math.abs(s.y - p.y);
      const seen = G.C.seen[s.id];
      const sparkle = !seen && (G.C.diff !== 'hard' || dist <= 2);
      if (sparkle) { const t = (E.frame + s.x * 7 + s.y * 3) % 60; if (t < 40) { const al = t < 20 ? t / 20 : (40 - t) / 20; ctx.fillStyle = `rgba(255,240,150,${al})`; ctx.fillRect(X + 7, Y - 1, 2, 6); ctx.fillRect(X + 5, Y + 1, 6, 2); } }
      if (dist <= 2) { // 虫めがねマーク
        const b = (E.frame >> 4) % 2;
        ctx.fillStyle = seen ? 'rgba(200,200,220,0.7)' : '#ffe14a'; ctx.fillRect(X + 4, Y - 10 + b, 6, 6); ctx.fillStyle = '#1a2350'; ctx.fillRect(X + 5, Y - 9 + b, 4, 4); ctx.fillStyle = seen ? 'rgba(200,200,220,0.7)' : '#ffe14a'; ctx.fillRect(X + 10, Y - 5 + b, 2, 2); ctx.fillRect(X + 11, Y - 4 + b, 2, 2);
      }
    });
  }
  // 暗い場所
  const a = E.areaAt(E.player.x, E.player.y);
  if (a && a.dark) { const gx = E.player.px + 8 - cx, gy = E.player.py + 8 - cy; const gr = ctx.createRadialGradient(gx, gy, 20, gx, gy, 140); gr.addColorStop(0, 'rgba(0,0,10,0)'); gr.addColorStop(1, 'rgba(0,0,10,0.75)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH); }
};

/* =================== 会話メニュー（4つの行動） =================== */
const TK = G.talk = {};
TK.data = k => (G.CASE.talk || {})[k] || {};
TK.open = function (k) {
  const d = TK.data(k), first = !G.C.flags['talk_' + k];
  G.meet(k);
  const ch = G.charOf(k);
  // 話しかけた人の方を向く
  E.player.dir = E.player.dir;
  let greet;
  if (G.C.accused[k] && d.accused) greet = d.accused;
  else if (first && d.first) greet = d.first;
  else if (d.greet) { greet = Array.isArray(d.greet[0]) && typeof d.greet[0][0] === 'number' ? (d.greet.filter(([r]) => G.S.rep >= r).pop() || d.greet[0])[1] : d.greet; }
  else greet = [[k, 'n', '…何か？']];
  G.C.flags['talk_' + k] = true;
  G.audio.bgm(G.CASE.talkBgm || 'talk');
  G.run(greet, () => { G.trial.checkEvents(); TK.menu(k); });
};
TK.items = function (k, kind) { return (TK.data(k)[kind] || []).filter(it => G.cond(it.need)); };
TK.menu = function (k) {
  const ch = G.charOf(k);
  G.ui.clearStage();
  const unread = kind => TK.items(k, kind).some(it => !G.C.read[it.id]);
  const ded = TK.items(k, 'deduce');
  G.ui.menu({
    title: ch.name + 'と話す', cls: 'talk',
    items: [
      { t: '聞く', badge: unread('ask') ? 'NEW' : '', fn: () => TK.list(k, 'ask', '聞く') },
      { t: '詳しく聞く', badge: unread('deep') ? 'NEW' : '', fn: () => TK.list(k, 'deep', '詳しく聞く') },
      { t: '証拠を見せる', fn: () => TK.show(k) },
      { t: '推理する', badge: ded.some(it => !G.C.read[it.id] || it.testi && !G.flag('solved_' + it.testi)) ? '！' : '', fn: () => TK.list(k, 'deduce', '推理する') },
      { t: '話を終える', fn: () => TK.end() },
    ],
    back: () => TK.end(),
  });
};
TK.end = function () { G.ui.clearStage(); G.audio.bgm(((E.areaAt(E.player.x, E.player.y) || {}).bgm) || G.CASE.bgm || 'explore'); E.afterAction(); };
TK.list = function (k, kind, label) {
  const items = TK.items(k, kind);
  if (!items.length) {
    const none = { ask: [['me', 'n', '（今は、これ以上聞けることはなさそうだ）']], deep: [['me', 'conf', '（今はまだ、詳しく聞けるような話題がない。証拠や証言を集めよう）']], deduce: [['me', 'conf', '（この人について推理できることは、まだない。手がかりを集めよう）']] }[kind];
    return G.run(none, () => TK.menu(k));
  }
  G.ui.menu({
    title: G.charOf(k).name + '：' + label, cls: 'talk',
    items: items.map(it => ({ t: (it.actor ? '★演技力を使う：' : '') + it.t, badge: !G.C.read[it.id] ? 'NEW' : (it.testi && !G.flag('solved_' + it.testi) ? '！' : ''), fn: () => TK.say(k, it, kind) })),
    back: () => TK.menu(k),
  });
};
TK.say = function (k, it, kind) {
  const first = !G.C.read[it.id];
  G.C.read[it.id] = true;
  let s = (first || !it.again ? it.s : it.again).slice();
  if (it.log && first) [].concat(it.log).forEach(l => G.addTl(k, l));
  if (it.set && first) s.push({ flag: it.set });
  if (it.testi && G.flag('solved_' + it.testi)) s = it.after ? it.after.slice() : [[k, 'n', 'その話は、もう済んだはずだ。']];
  else if (it.testi) s.push({ testi: it.testi });
  G.run(s, () => { G.trial.checkEvents(); TK.list(k, kind, { ask: '聞く', deep: '詳しく聞く', deduce: '推理する' }[kind]); });
};
TK.show = function (k) {
  G.ui.evidence('present', id => {
    const d = TK.data(k), e = G.evData(id);
    const sp = (d.show || {})[id];
    const key = 'show_' + k + '_' + id, first = !G.C.read[key];
    G.C.read[key] = true;
    let s;
    if (sp) s = (first || !sp.again ? (sp.s || sp) : sp.again).slice();
    else {
      const gen = d.showDef || [[k, 'conf', '「{ev}」？ それが何か？'], [k, 'n', '…{ev}ですか。特に心当たりはありませんね。'], [k, 'conf', 'また{ev}？ さっきも見ましたよ。']];
      const n = (G.C.flags['gen_' + k] = (G.C.flags['gen_' + k] || 0) + 1);
      const pickLine = gen[first ? (n - 1) % Math.max(1, gen.length - 1) : gen.length - 1];
      s = [[pickLine[0], pickLine[1], pickLine[2].replace(/\{ev\}/g, e.name)]];
    }
    if (sp && sp.set && first) s.push({ flag: sp.set });
    if (sp && sp.log && first) G.addTl(k, sp.log);
    G.run([['me', 'n', `この「${e.name}」を見てください。`]].concat(s), () => { G.trial.checkEvents(); TK.menu(k); });
  }, () => TK.menu(k), G.charOf(k).name + 'に見せる証拠品を選んでください');
};
})();
