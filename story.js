/* =========================================================
   story.js ― タイトル・主人公設定・事件の開始・幕間・エンディング
   ========================================================= */
(function () {
const ST = G.story = {};
const $ = G.$, esc = G.esc;

/* =================== 場面（幕間・エンディング用の背景） =================== */
ST.SCENES = {
  studio: { w: 24, h: 14, theme: 'studio', build(B) { B.room(0, 0, 24, 14, '.'); B.fill(1, 1, 22, 2, 'U'); B.fill(6, 5, 12, 4, ','); B.row(8, 6, 'S??S'); B.set(12, 6, 'T'); B.row(2, 10, 'Q'); B.row(21, 10, 'Q'); B.row(2, 4, 'L'); B.row(21, 4, 'L'); }, actors: [] },
  dressing: { w: 24, h: 14, theme: 'hotel', build(B) { B.room(0, 0, 24, 14, '.'); B.row(1, 1, 'mmm?mmm??hhh'); B.row(16, 1, 'P'); B.row(8, 8, 'SS'); B.set(10, 9, 'T'); B.row(20, 10, 'K'); B.door(12, 13); }, actors: [] },
  lobby: { w: 24, h: 14, theme: 'hotel', build(B) { B.room(0, 0, 24, 14, ':'); B.row(2, 2, 'RRRRR'); B.row(15, 3, 'S?S'); B.row(1, 1, 'P'); B.row(22, 1, 'P'); B.row(20, 10, 'p'); B.door(12, 13); }, actors: [] },
  night: { w: 24, h: 14, theme: 'tv', build(B) { B.fill(0, 0, 24, 14, '='); B.fill(0, 0, 24, 3, 'Y'); B.row(4, 6, 'l'); B.row(19, 6, 'l'); B.fill(0, 11, 24, 3, '_'); }, actors: [] },
  theater: { w: 24, h: 14, theme: 'studio', build(B) { B.room(0, 0, 24, 14, ','); B.fill(1, 1, 22, 3, 'U'); for (let y = 7; y < 12; y += 2) B.row(3, y, 'cccccc??cccccc'); }, actors: [] },
};
let SC = null;
ST.scene = function (name, actors) {
  if (!name) { SC = null; return; }
  const def = ST.SCENES[name]; const B = G.MB(def.w, def.h, def.theme); def.build(B);
  SC = { B, actors: actors || [] };
};
ST.drawScene = function (ctx) {
  if (!SC) return false;
  const B = SC.B, ox = Math.round((384 - B.w * 16) / 2), oy = Math.round((216 - B.h * 16) / 2);
  ctx.fillStyle = '#07080f'; ctx.fillRect(0, 0, 384, 216);
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) { let ch = B.m[y][x]; if (ch === ' ') continue; if (ch === '#') { const b = y < B.h - 1 ? B.m[y + 1][x] : '#'; ch = b !== '#' && b !== ' ' ? 'wf' : 'wt'; } ctx.drawImage(G.art.tile(ch, B.theme), ox + x * 16, oy + y * 16); }
  const f = G.explore.frame;
  SC.actors.forEach(a => { const ch = a.k ? G.charOf(a.k) : null; const L = a.look || (ch && ch.look); if (!L) return; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(ox + a.x * 16 + 3, oy + a.y * 16 + 14, 10, 2); ctx.drawImage(G.art.sprite(L, a.dir || 'down', (f >> 5) % 2 && a.walk ? 1 : 0), ox + a.x * 16, oy + a.y * 16 - ((f >> 5) % 2)); });
  return true;
};

/* =================== タイトル =================== */
ST.title = function () {
  G.explore.stop(); G.ui.clearStage(); ST.scene(null); G.CASE = null; G.C = null;
  G.ui.stack.length = 0; G.ui.panel.close(); G.ui.dlg.close(); $('testi').className = '';
  ST.mode = 'title';
  const last = G.latestSave();
  const nm = last ? last.d.S.name : '〇〇';
  $('tname').textContent = '名探偵' + nm;
  document.title = last ? '名探偵' + nm + '｜推理ミステリーゲーム' : G.SEO_TITLE;
  $('title').classList.add('on');
  G.audio.bgm('title');
  const items = [
    { t: 'はじめから', fn: () => ST.setup() },
    { t: 'つづきから', dis: !last, fn: () => G.ui.saveLoad('load', ST.titleMenu, () => {}) },
    { t: '事件ファイル', fn: () => ST.records() },
    { t: '設定', fn: () => G.ui.settings(ST.titleMenu) },
    { t: '操作説明', fn: () => G.ui.help(ST.titleMenu) },
  ];
  ST.titleItems = items;
  ST.titleMenu();
};
ST.titleMenu = function () {
  if (ST.mode !== 'title') return;
  $('title').classList.add('on');
  let sel = ST.titleSel || 0; const items = ST.titleItems;
  const box = $('tmenu');
  const render = () => { box.innerHTML = items.map((it, i) => `<button class="tm${i === sel ? ' sel' : ''}${it.dis ? ' dis' : ''}" data-i="${i}">${it.t}</button>`).join(''); };
  const go = () => { const it = items[sel]; if (it.dis) { G.audio.sfx('wrong'); return; } G.audio.init(); G.audio.sfx('ok'); ST.titleSel = sel; G.ui.pop(layer); box.innerHTML = ''; if (it.t !== '設定' && it.t !== '操作説明' && it.t !== 'つづきから' && it.t !== '事件ファイル') $('title').classList.remove('on'); it.fn(); };
  const layer = G.ui.push({ name: 'title', key: k => { if (k === 'up') { sel = (sel + items.length - 1) % items.length; G.audio.sfx('move'); render(); } else if (k === 'down') { sel = (sel + 1) % items.length; G.audio.sfx('move'); render(); } else if (k === 'ok') go(); } });
  box.onclick = e => { const b = e.target.closest('.tm'); if (b) { sel = +b.dataset.i; go(); } };
  render();
};
ST.drawTitle = function (ctx) {
  const f = G.explore.frame;
  const gr = ctx.createLinearGradient(0, 0, 0, 216); gr.addColorStop(0, '#0b1030'); gr.addColorStop(1, '#2a1838'); ctx.fillStyle = gr; ctx.fillRect(0, 0, 384, 216);
  for (let i = 0; i < 40; i++) { const x = (i * 97) % 384, y = (i * 53) % 110; if ((f + i * 13) % 90 < 70) { ctx.fillStyle = 'rgba(255,255,230,.8)'; ctx.fillRect(x, y, 1, 1); } }
  ctx.fillStyle = '#fff5cf'; ctx.beginPath(); ctx.arc(330, 40, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#0b1030'; ctx.beginPath(); ctx.arc(338, 35, 14, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1220'; ctx.fillRect(0, 150, 384, 66);
  ctx.fillStyle = '#5a2030'; ctx.fillRect(0, 150, 384, 4);
  for (let x = 0; x < 384; x += 16) { ctx.fillStyle = x % 32 ? '#2a1f30' : '#241a2a'; ctx.fillRect(x, 154, 16, 62); }
  const sp = ctx.createRadialGradient(192, 175, 10, 192, 175, 150); sp.addColorStop(0, 'rgba(255,240,190,.35)'); sp.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = sp; ctx.fillRect(0, 90, 384, 126);
  const last = ST.titleLook || null;
  const me = last || G.LOOKS.m[0];
  const people = [[G.ASSIST.c.look, 104], [me, 152], ['dog', 200], ['robot', 240]];
  people.forEach(([L, x], i) => {
    const bob = (f >> 5) % 2 && i % 2 ? 1 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 6, 194, 20, 4);
    let img = L === 'dog' ? G.art.dogSprite('down', 0) : L === 'robot' ? G.art.robotSprite((f >> 4) % 2) : G.art.sprite(L, 'down', 0);
    ctx.drawImage(img, x, 166 - bob, 32, 32);
  });
  ctx.drawImage(G.art.phoneIcon('n'), 272, 182, 16, 16);
};

/* =================== 主人公設定 =================== */
ST.setup = function () {
  ST.mode = 'setup';
  const o = { name: '', gender: 'm', look: 'm1' };
  let step = 0, sel = 0;
  const render = () => {
    let html = '<div class="box setup"><div class="ttl">主人公の設定</div>';
    if (step === 0) html += `<p>あなたの名前（ニックネーム）を入力してください。ゲーム中は「名探偵〇〇」と呼ばれます。</p><input id="nmin" maxlength="8" placeholder="例：タロウ" value="${esc(o.name)}" autocomplete="off"><p class="dim">8文字まで。入力したらEnter。</p><div class="evkeys"><button data-a="ok">決定（Enter）</button><button data-a="back">タイトルへ（Esc）</button></div>`;
    if (step === 1) html += `<p>名探偵${esc(o.name)}の性別を選んでください。</p><div class="opts">${['男性', '女性'].map((t, i) => `<button class="op${i === sel ? ' sel' : ''}" data-i="${i}">${t}</button>`).join('')}</div><div class="evkeys">←→：選ぶ　Z：決定　X：戻る</div>`;
    if (step === 2) { const L = G.LOOKS[o.gender]; html += `<p>見た目を選んでください。</p><div class="looks">${L.map((l, i) => `<button class="lk${i === sel ? ' sel' : ''}" data-i="${i}"><canvas width="48" height="56" data-lk="${i}"></canvas><canvas width="16" height="16" data-sp="${i}" class="mini"></canvas><span>${l.label}</span></button>`).join('')}</div><div class="evkeys">←→：選ぶ　Z：決定　X：戻る</div>`; }
    if (step === 3) { const l = G.LOOKS[o.gender].find(x => x.id === o.look); html += `<div class="conf"><canvas width="48" height="56" id="cfp"></canvas><div><p>名前：<b>名探偵${esc(o.name)}</b></p><p>性別：${o.gender === 'm' ? '男性' : '女性'}</p><p>見た目：${l.label}</p><p class="dim">ある程度名の知れた俳優。撮影や仕事先で、なぜか事件に巻き込まれてしまう――。</p></div></div><div class="opts">${['この設定で始める', 'やり直す'].map((t, i) => `<button class="op${i === sel ? ' sel' : ''}" data-i="${i}">${t}</button>`).join('')}</div>`; }
    html += '</div>';
    const p = G.ui.panel.open(html, 'full');
    p.querySelectorAll('canvas[data-lk]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.portrait(G.LOOKS[o.gender][+c.dataset.lk], 'smile'), 0, 0); });
    p.querySelectorAll('canvas[data-sp]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.sprite(G.LOOKS[o.gender][+c.dataset.sp], 'down', 0), 0, 0); });
    const cf = $('cfp'); if (cf) { const g = cf.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.portrait(G.LOOKS[o.gender].find(x => x.id === o.look), 'smile'), 0, 0); }
    const inp = $('nmin'); if (inp) { setTimeout(() => inp.focus(), 30); inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); key('ok'); } if (e.key === 'Escape') key('back'); }; }
    p.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { sel = +b.dataset.i; key('ok'); return; } const a = e.target.closest('[data-a]'); if (a) key(a.dataset.a); };
  };
  const n = () => step === 1 ? 2 : step === 2 ? 3 : 2;
  const key = k => {
    if (step === 0) {
      if (k === 'ok') { const v = ($('nmin') ? $('nmin').value : o.name).trim().slice(0, 8); if (!v) { G.toast('名前を入力してください'); return; } o.name = v; step = 1; sel = 0; G.audio.sfx('ok'); render(); }
      else if (k === 'back') { G.ui.pop(layer); G.ui.panel.close(); ST.title(); }
      return;
    }
    if (k === 'left' || k === 'up') { sel = (sel + n() - 1) % n(); G.audio.sfx('move'); render(); }
    else if (k === 'right' || k === 'down') { sel = (sel + 1) % n(); G.audio.sfx('move'); render(); }
    else if (k === 'back') { step--; sel = 0; G.audio.sfx('back'); render(); }
    else if (k === 'ok') {
      G.audio.sfx('ok');
      if (step === 1) { o.gender = sel ? 'f' : 'm'; step = 2; sel = 0; }
      else if (step === 2) { o.look = G.LOOKS[o.gender][sel].id; step = 3; sel = 0; }
      else if (step === 3) { if (sel === 0) { G.ui.pop(layer); G.ui.panel.close(); G.newGame(o); ST.titleLook = G.myLook(); document.title = '名探偵' + o.name; ST.prologue(); return; } step = 0; sel = 0; }
      render();
    }
  };
  const layer = G.ui.push({ name: 'setup', key });
  render();
};

/* =================== メニュー =================== */
ST.menu = function (onClose, fromTrial) {
  const back = () => { onClose && onClose(); };
  G.ui.menu({
    title: 'メニュー ― 名探偵' + G.S.name, head: `<p class="dim">評判：${G.S.rep}（${G.repTitle()}）</p>`,
    items: [
      { t: '持ち物・証拠品', sub: 'I', fn: () => G.ui.evidence('view', null, () => ST.menu(onClose, fromTrial)) },
      { t: '人物図鑑', fn: () => G.ui.people(() => ST.menu(onClose, fromTrial)) },
      { t: '事件ファイル', fn: () => G.ui.caseFile(() => ST.menu(onClose, fromTrial)) },
      { t: 'セーブ', dis: !!fromTrial, fn: () => G.ui.saveLoad('save', () => ST.menu(onClose, fromTrial)) },
      { t: 'ロード', fn: () => G.ui.saveLoad('load', () => ST.menu(onClose, fromTrial), () => {}) },
      { t: '設定', fn: () => G.ui.settings(() => ST.menu(onClose, fromTrial)) },
      { t: '操作説明', fn: () => G.ui.help(() => ST.menu(onClose, fromTrial)) },
      { t: 'タイトルへ戻る', fn: () => G.ui.confirm('タイトルへ戻りますか？（オートセーブから再開できます）', () => { G.autosave(); ST.title(); }, () => ST.menu(onClose, fromTrial)) },
    ],
    back,
  });
};

/* =================== ヒント =================== */
ST.hintScript = function () {
  const hs = G.CASE.hints || [];
  const h = hs.find(x => !G.cond(x.until)) || hs[hs.length - 1];
  const d = G.C.diff, as = G.C.as;
  let t = G.fmt(d === 'hard' && h.h ? h.h : h.t);
  const left = Object.keys(G.CASE.evidence).filter(k => !G.CASE.evidence[k].noRank && !G.has(k)).length;
  const extra = d === 'easy' ? `（まだ見つけていない証拠品は、あと${left}個あるようだ）` : '';
  if (as === 'c') return [['as', 'n', G.rand(['ったく、しょうがねえな。', 'ヒントな。一回しか言わねえぞ。', 'おい、ボーッとしてんなよ。']) + t + '。'], ...(extra ? [['as', 'n', extra]] : []), ['as', 'smile', G.rand(['犯人？ そこまで教えたらお前のためになんねえだろ。', '…ま、名探偵なら自分で気づけよ。', 'あとは自分の頭で考えな。'])]];
  if (as === 'r') return [['as', 'think', '現在の調査状況を分析しました。'], ['as', 'n', '推奨行動：' + t + '。' + extra], ['as', 'smile', '犯人の特定は、{name}さんご自身の推理にお任せします。']];
  return [{ sfx: 'bark' }, ['as', 'smile', 'ワン！'], ['nar', 'n', `（{d}の顔を見ていたら、考えがまとまってきた。…${t}）${extra}`]];
};

/* =================== 記録（全体の事件ファイル） =================== */
ST.hiddenConds = function () {
  const S = G.S;
  const cl = ['c1', 'c2', 'c3'].every(c => S.cases[c] && S.cases[c].cleared);
  const fr = ['c1', 'c2', 'c3'].filter(c => S.cases[c] && S.cases[c].frag).length;
  return [
    { ok: cl, t: '3つの事件をすべて解決する' },
    { ok: fr === 3, t: `3つの事件で「記憶のかけら」を見つける（${fr}/3）` },
    { ok: S.rep >= 50, t: `探偵としての評判を50以上にする（現在${S.rep}）` },
  ];
};
ST.hiddenReady = () => ST.hiddenConds().every(c => c.ok);
ST.recordHTML = function () {
  const S = G.S; if (!S) return '<p class="empty">記録はまだありません。</p>';
  const rows = G.ORDER.map(id => { const c = G.CASES[id], r = S.cases[id]; const hid = id === 'hidden' && !S.hiddenOpen; return `<tr><th>${hid ? '？？？' : esc(c.no + '「' + c.title + '」')}</th><td>${r && r.cleared ? '解決済み' : (S.next === id ? '次の事件' : (hid ? '未解放' : '未解決'))}</td><td>${r && r.best ? 'ランク ' + r.best : '―'}</td><td>${id !== 'hidden' ? (r && r.frag ? '記憶のかけら ✔' : '記憶のかけら ―') : ''}</td></tr>`; }).join('');
  const conds = ST.hiddenConds();
  return `<h4>名探偵${esc(S.name)}の記録</h4><p>探偵としての評判：<b>${S.rep}</b>（${G.repTitle()}）</p><table class="ft">${rows}</table>
    <h4>隠し事件の解放条件</h4><ul class="conds">${conds.map(c => `<li class="${c.ok ? 'ok' : ''}">${c.ok ? '✔' : '□'} ${c.t}</li>`).join('')}</ul>
    <p class="dim">ヒント：「記憶のかけら」は各事件のどこかに隠されています。助手に相談（C）すると、隠し場所を見つけてくれることがあります。条件を満たせなかった事件は、タイトルの「事件ファイル」から何度でも再挑戦できます。評判は、より高いランクで解決すると上がります。</p>
    ${S.endings.secret ? '<p>✔ 秘密のエンディングを見た</p>' : S.endings.normal ? '<p>✔ エンディングを見た</p>' : ''}`;
};
ST.records = function () {
  const last = G.latestSave();
  if (!last) { G.run([['sys', 'n', 'まだ記録がありません。「はじめから」で事件に挑みましょう。']], ST.titleMenu); return; }
  const keepS = G.S; G.S = last.d.S;
  const html = `<div class="box cfbox"><div class="ttl">事件ファイル（最新のセーブデータ）</div><div class="cfbody">${ST.recordHTML()}</div><div class="evkeys"><button data-a="sel">Z：この記録で事件を選ぶ</button><button data-a="back">X：戻る</button></div></div>`;
  const p = G.ui.panel.open(html, 'full');
  const close = () => { G.ui.pop(layer); G.ui.panel.close(); };
  const key = k => { if (k === 'back') { close(); G.S = keepS; ST.titleMenu(); } else if (k === 'ok' || k === 'sel') { close(); G.loadFrom(last.d, true); ST.caseSelect(); } };
  p.onclick = e => { const a = e.target.closest('[data-a]'); if (a) key(a.dataset.a); };
  const layer = G.ui.push({ name: 'records', key });
};
ST.caseSelect = function () {
  $('title').classList.remove('on');
  ST.mode = 'select';
  const S = G.S;
  if (ST.hiddenReady() && !S.hiddenOpen) { S.hiddenOpen = true; G.autosave(); }
  const items = G.ORDER.filter(id => id !== 'hidden' || S.hiddenOpen).map(id => {
    const c = G.CASES[id], r = S.cases[id];
    const mi = G.MAIN.indexOf(id), prevDone = mi > 0 && S.cases[G.MAIN[mi - 1]] && S.cases[G.MAIN[mi - 1]].cleared;
    const avail = (r && r.cleared) || S.next === id || (id === 'hidden' && S.hiddenOpen) || (r && r.run) || mi === 0 || prevDone;
    return { t: c.no + '「' + c.title + '」', sub: r && r.run ? '途中から再開できます' : (r && r.cleared ? 'ベストランク ' + r.best + '　（再挑戦）' : (avail ? '挑戦する' : '前の事件を解決すると解放')), dis: !avail, fn: () => {
      if (r && r.run) { G.ui.confirm('途中のデータがあります。続きから再開しますか？（いいえ：最初からやり直す）', () => ST.resume(id), () => ST.caseStart(id)); }
      else ST.caseStart(id);
    } };
  });
  G.ui.menu({ title: '事件を選ぶ ― 名探偵' + S.name, head: `<p class="dim">評判 ${S.rep}（${G.repTitle()}）</p>`, items, back: () => ST.title() });
};

/* =================== 事件の開始 =================== */
ST.caseStart = function (id) {
  const c = G.CASES[id];
  ST.mode = 'casestart';
  G.explore.stop(); ST.scene(null); G.ui.clearStage();
  G.audio.bgm('creepy');
  let step = 0, sel = 1; const o = { diff: 'normal', as: 'c' };
  const diffs = [['easy', 'EASY', '証拠品が見つけやすく、助手のヒントも多め。矛盾も分かりやすい。初心者向け。'], ['normal', 'NORMAL', '標準的な難易度。推理と探索のバランスを重視。'], ['hard', 'HARD', '証拠品が見つけにくく、ヒントも少なめ。証拠品の組み合わせが重要。自分で考える上級者向け。']];
  const asK = ['c', 'd', 'r'];
  const render = () => {
    let html = `<div class="box cstart"><div class="cno">${esc(c.no)}</div><div class="ctitle">「${esc(c.title)}」</div><p class="dim">${esc(c.genre)}／舞台：${esc(c.place)}</p>`;
    if (step === 0) html += `<h4>難易度を選んでください（この事件だけに適用）</h4><div class="diffs">${diffs.map((d, i) => `<button class="df${i === sel ? ' sel' : ''}" data-i="${i}"><b>${d[1]}</b><small>${d[2]}</small></button>`).join('')}</div>`;
    else html += `<h4>一緒に行動する助手を選んでください</h4><div class="asl">${asK.map((k, i) => { const a = G.ASSIST[k]; return `<button class="as${i === sel ? ' sel' : ''}" data-i="${i}"><canvas width="48" height="56" data-as="${k}"></canvas><b>${esc(G.asName(k))}</b><em>${a.title}</em><small>${a.desc}</small><small class="sk">得意：${a.skill}</small></button>`; }).join('')}</div>`;
    html += `<div class="evkeys">←→：選ぶ　Z：決定　X：${step ? '難易度に戻る' : 'やめる'}</div></div>`;
    const p = G.ui.panel.open(html, 'full');
    p.querySelectorAll('canvas[data-as]').forEach(cv => { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.portrait(G.ASSIST[cv.dataset.as].look, 'smile'), 0, 0); });
    p.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { sel = +b.dataset.i; key('ok'); } };
  };
  const key = k => {
    if (k === 'left' || k === 'up') { sel = (sel + 2) % 3; G.audio.sfx('move'); render(); }
    else if (k === 'right' || k === 'down') { sel = (sel + 1) % 3; G.audio.sfx('move'); render(); }
    else if (k === 'back') { G.audio.sfx('back'); if (step) { step = 0; sel = 1; render(); } else { G.ui.pop(layer); G.ui.panel.close(); ST.caseSelect(); } }
    else if (k === 'ok') {
      G.audio.sfx('ok');
      if (step === 0) { o.diff = diffs[sel][0]; step = 1; sel = 0; render(); }
      else { o.as = asK[sel]; G.ui.pop(layer); G.ui.panel.close(); ST.beginCase(id, o.diff, o.as); }
    }
  };
  const layer = G.ui.push({ name: 'casestart', key });
  render();
};
ST.beginCase = function (id, diff, as) {
  const c = G.CASES[id], rec = G.caseRec(id);
  G.CASE = c;
  rec.run = G.newRun(id, diff, as);
  G.C = rec.run;
  if (c.init) c.init();
  ST.mode = 'case';
  G.explore.load(c.map);
  G.explore.start(c.start);
  G.explore.mode = 'pause';
  G.audio.bgm(null);
  const intro = [{ dark: true }, { big: c.no + '\n「' + c.title + '」', cls: 'chapter', ms: 2200 }, { dark: false }].concat(c.intro).concat(c.join[as] || []);
  G.run(intro, () => { G.ui.clearStage(); G.explore.mode = 'play'; G.explore.checkArea(true); G.autosave(); G.trial.checkEvents(); });
};
ST.resume = function (id) {
  G.CASE = G.CASES[id]; G.C = G.caseRec(id).run; ST.mode = 'case';
  G.explore.start(G.C.pos);
  G.toast('調査を再開した');
};
G.loadFrom = function (d, noStart) {
  if (!d || d.bad) return;
  G.ui.stack.length = 0; G.ui.panel.close(); G.ui.dlg.close(); G.ui.clearStage(); $('testi').className = ''; G.trial.inTrial = false;
  G.S = d.S; if (d.set) { Object.assign(G.set, d.set); G.audio.applyVol(); }
  ST.titleLook = G.myLook();
  document.title = '名探偵' + G.S.name;
  $('title').classList.remove('on');
  G.audio.init();
  if (noStart) return;
  if (d.cur && G.S.cases[d.cur] && G.S.cases[d.cur].run) { ST.resume(d.cur); }
  else if (G.S.next && G.CASES[G.S.next] && !(G.S.cases[G.S.next] || {}).cleared) { ST.caseStart(G.S.next); }
  else ST.caseSelect();
  G.toast(d.fromBak ? 'セーブデータが壊れていたため、バックアップから読み込みました' : 'ロードしました');
};

/* =================== 事件後の流れ =================== */
ST.FLOW = { c1: [['inter1'], 'c2'], c2: [['inter2'], 'c3'], c3: [['endNormal', 'inter3'], 'c4'], c4: [['inter4'], 'c5'], c5: [['inter5'], 'c6'], c6: [['inter6'], 'c7'], c7: [['inter7'], 'c8'], c8: [['endSeason'], null], hidden: [['endSecret'], null] };
ST.afterCase = function (id, first) {
  const S = G.S, flow = ST.FLOW[id];
  G.autosave();
  if (!first) { ST.scene(null); return ST.checkHidden(() => ST.caseSelect()); }
  S.next = flow[1] || null;
  G.autosave();
  const scenes = flow[0].slice();
  const step = () => {
    if (scenes.length) return ST[scenes.shift()](step);
    if (flow[1]) ST.caseStart(flow[1]);
    else ST.checkHidden(() => ST.title());
  };
  step();
};
ST.checkHidden = function (cb) {
  if (G.S.hiddenOpen || !ST.hiddenReady()) return cb();
  G.S.hiddenOpen = true; G.autosave();
  G.run([{ sfx: 'reveal' }, { big: '隠し事件が解放された！', cls: 'chapter', ms: 1800 }, ['sys', 'n', 'タイトルの「事件ファイル」→「この記録で事件を選ぶ」から、隠し事件「最後のフィルム」に挑戦できます。']], cb);
};

/* =================== 幕間・エンディングの台本 =================== */
const me = (ex, t) => ['me', ex, t];
ST.prologue = function () {
  ST.mode = 'story';
  G.audio.bgm('inter');
  ST.scene('studio', [{ k: 'me', x: 11, y: 7 }, { k: 'mgr', x: 13, y: 7 }, { look: G.ASSIST.c.look, x: 9, y: 7 }, { look: { kind: 'dog' }, x: 15, y: 9 }]);
  G.run([
    { big: 'プロローグ\n「俳優、{name}」', cls: 'chapter', ms: 2000 },
    ['nar', 'n', 'テレビ局のトーク番組。収録を終えた{name}は、拍手に見送られてスタジオを出た。'],
    ['mgr', 'smile', '{name}さん、お疲れさまでした！ 今日のトーク、すごくウケてましたよ。'],
    me('smile', 'ありがとう、三好さん。子役時代の話は、いまだに照れるけどね。'),
    ['mgr', 'n', '8歳でデビューした映画『星降る劇場』…あの作品のおかげで、今の{name}さんがあるんですもんね。'],
    me('n', '…うん。鷹宮監督に拾ってもらわなかったら、{I}は俳優になっていなかった。'),
    ['nar', 'n', 'だが、その撮影の終わりには「事故」があった。照明の機材が落ち、スタッフが大けがをした。監督は責任をとって業界を去り、以来、行方が分からない――。'],
    me('conf', '（あの事故…{I}が立ち位置を間違えたせいだって、ずっと思ってきた）'),
    ['mgr', 'n', 'それで、次のお仕事です！ 山奥の古い洋館「霧ヶ峰館」で、映画『霧の館』の撮影。主演ですよ！'],
    ['nar', 'n', '――この頃、{name}にはもう一つの顔があった。行く先々で事件に巻き込まれ、それを解決してしまう「俳優探偵」としての顔だ。'],
    ['c', 'n', 'よう、{name}。また事件に首つっこむ気だろ？ オレも連れてけよ。ネタになるからな。'],
    ['nar', 'n', '毒舌ツッコミ芸人の{c}。バラエティ番組での共演以来の悪友だ。'],
    ['d', 'smile', 'ワン！'],
    ['nar', 'n', '愛犬の柴犬、{d}。どこにでもついてくる、賢い相棒だ。'],
    ['r', 'smile', '{name}さん。スケジュールは管理済みです。ロケ地の地図も、ダウンロードしておきました。'],
    ['nar', 'n', 'そしてスマートフォンに住むAIロボット、{r}。真面目で、何でも分析してくれる。'],
    me('smile', '頼もしい仲間たちだ。…さあ、行こう。'),
  ], () => { ST.scene(null); ST.caseStart('c1'); });
};
ST.inter1 = function (cb) {
  ST.mode = 'story'; G.audio.bgm('inter');
  ST.scene('studio', [{ k: 'me', x: 10, y: 7 }, { look: G.ASSIST.c.look, x: 13, y: 7 }, { k: 'mgr', x: 18, y: 10 }]);
  G.run([
    { big: '幕間\n「バラエティ収録」', cls: 'chapter', ms: 1800 },
    ['nar', 'n', '霧ヶ峰館の事件から一週間。{name}は、{c}がMCを務めるバラエティ番組にゲスト出演していた。'],
    ['c', 'smile', '今日のゲストは、なんと事件を解決しちまった俳優、{name}でーす！ …って、こいつ撮影より推理のほうがウケてんじゃねえか。'],
    me('smile', 'ひどいな。本業はちゃんと俳優だよ。'),
    { if: 'rep>=25', then: [['mgr', 'n', '{name}さん、事務所にファンの方から手紙が届いてます。「名探偵{name}さんへ。なくした祖母の形見の指輪を、一緒に探してほしい」…ですって。'],
      { choice: { q: 'ファンからの依頼を受けますか？', who: 'mgr', opts: [{ t: '時間を作って手伝う', s: [me('smile', 'もちろん。少しだけなら時間を作れるよ。'), ['nar', 'n', '――指輪は、ファンの祖母が通っていた劇場の、客席の下から見つかった。'], ['mgr', 'smile', 'お礼のメールが届いてます。「本物の名探偵でした！」って。'], { rep: 3 }, { fn: () => { G.S.requests.ring = true; } }] }, { t: '今回は断る', s: [me('n', '今は撮影が詰まってるから…ごめん、と返事をしておいて。')] }] } }],
      else: [['mgr', 'n', 'ファンレター、だんだん「探偵さん宛て」のが増えてきてますよ。評判が上がれば、依頼も来るかもしれませんね。']] },
    ['mgr', 'n', '次のお仕事は、古いホテル「ホテル・グランミラージュ」で連続ドラマの撮影です。子役の朝倉ひなたちゃんとの共演ですよ。'],
    me('n', '…ひなたちゃんか。会うのが楽しみだ。'),
    ['nar', 'n', '銀時計の中に隠されていた小さなメモ。「第3スタジオ 機材庫13」――その意味は、まだ分からない。'],
  ], () => { ST.scene(null); cb(); });
};
ST.inter2 = function (cb) {
  ST.mode = 'story'; G.audio.bgm('inter');
  ST.scene('dressing', [{ k: 'me', x: 9, y: 6 }, { k: 'mgr', x: 13, y: 6 }, { k: 'jinno', x: 12, y: 11 }]);
  G.run([
    { big: '幕間\n「雑誌のインタビュー」', cls: 'chapter', ms: 1800 },
    ['nar', 'n', '撮影所の楽屋。{name}は映画雑誌のインタビューを受けていた。'],
    ['nar', 'n', '「デビュー作『星降る劇場』の撮影は、東央テレビの第3スタジオでしたね。あの事故のことは覚えていますか？」'],
    me('conf', '…覚えています。大きな照明が落ちてきて…若い照明スタッフの方が、{I}を突き飛ばしてかばってくれた。'),
    me('sweat', '（そうだ。あのとき{I}は、立ち位置のバミリ（印）から一歩ずれていた…）'),
    ['mgr', 'n', '{name}さん、インタビューはここまでで。…それと、来週の特番の件です。東央テレビの旧局舎が取り壊されるので、お別れ特番に出てほしいって。'],
    me('surp', '東央テレビの旧局舎…第3スタジオ…！'),
    { if: 'rep>=40', then: [['jinno', 'n', '失礼。…{name}さん、例の特番の件で非公式にお願いがある。'], ['jinno', 'n', 'あの局で20年前に起きた事故について、最近になって妙なタレコミが続いていてね。探偵としての君の評判を見込んで、現場に目を配ってほしい。'], me('n', '…分かりました。{I}にとっても、あそこは他人事じゃない。'), { rep: 3 }],
      else: [['nar', 'n', '楽屋のドアの外で、トレンチコートの男がこちらをうかがっていた。目が合うと、男は黙って立ち去った。'], ['mgr', 'conf', '今の人…警察の方じゃないですか？']] },
    ['nar', 'n', 'ホテルで出会った老人・宮さんの言葉が、頭から離れない。「あの子は…あの事故の日も、立派に演じていたよ」'],
  ], () => { ST.scene(null); cb(); });
};
ST.credits = function (lines, cb) {
  const el = $('credits');
  el.innerHTML = '<div class="roll">' + lines.map(l => l === '' ? '<br>' : `<p>${esc(G.fmt(l))}</p>`).join('') + '</div>';
  el.className = 'on';
  const fin = () => { el.className = ''; G.ui.pop(layer); cb(); };
  const layer = G.ui.push({ name: 'credits', key: k => { if (k === 'ok' || k === 'back') fin(); } });
  if (G.auto) return fin();
  setTimeout(() => { if (el.className) fin(); }, 26000);
};
const CREDIT = s => ['名探偵{name}', '', s, '', '― キャスト ―', '名探偵{name}', '{c}（お笑い芸人）', '{d}（柴犬）', '{r}（AIロボット）', '三好さくら', '神野警部補', '', '― 事件 ―', '第1事件「消えた銀時計」', '第2事件「消えた子役」', '第3事件「最後の台本」', '第4事件「笑う楽屋の幽霊」', '第5事件「真夜中の霊安室」', '第6事件「消えた結婚指輪」', '第7事件「雪原に消えた足あと」', '第8事件「授賞式のラストシーン」', '', '企画・ドット絵・音楽・プログラム', 'すべてオリジナル', '', 'Thank you for playing!'];
ST.endNormal = function (cb) {
  ST.mode = 'story'; G.audio.bgm('ending'); G.S.endings.normal = true;
  ST.scene('lobby', [{ k: 'me', x: 12, y: 9, dir: 'up' }, { k: 'mgr', x: 14, y: 10, dir: 'up' }]);
  G.run([
    { big: 'エンディング\n「君のせいじゃない」', cls: 'chapter', ms: 2000 },
    ['nar', 'n', '事件から数日後。{name}は、ホテル・グランミラージュを訪れた。'],
    ['nar', 'n', 'だが旧館のB12号室は、もう空っぽだった。ピアノの上に、一通の封筒だけが残されていた。'],
    ['nar', 'n', '「{name}くんへ。20年間、名乗り出られずにすまなかった。君は、あの日も立派に演じていた。事故は、君のせいじゃない。……君の芝居を、これからも客席から見ている。鷹宮修司」'],
    me('cry', '…監督。やっぱり、宮さんがあなただったんですね。'),
    ['mgr', 'cry', '{name}さん…。'],
    me('smile', '大丈夫。{I}はもう、自分の芝居から逃げない。…いつかまた、監督に見てもらえるように。'),
    { if: () => !ST.hiddenReady(), then: [['sys', 'n', '――まだ明かされていない真実がある。3つの事件の「記憶のかけら」をすべて集め、探偵としての評判を高めれば、隠し事件「最後のフィルム」が解放される。（事件ファイルで条件を確認できます）']] },
  ], () => { ST.scene(null); ST.credits(CREDIT('― NORMAL END ―'), () => { G.autosave(); cb(); }); });
};
/* ---------- 第2章の幕間 ---------- */
const inter = (title, scene, actors, lines) => function (cb) {
  ST.mode = 'story'; G.audio.bgm('inter');
  ST.scene(scene, actors);
  G.run([{ big: title, cls: 'chapter', ms: 1800 }].concat(lines), () => { ST.scene(null); cb(); });
};
const C_LOOK = () => G.ASSIST.c.look;
ST.inter3 = inter('第2章\n「俳優探偵、ふたたび」', 'studio', [{ k: 'me', x: 11, y: 7 }, { k: 'mgr', x: 13, y: 7 }, { look: C_LOOK(), x: 9, y: 7 }], [
  ['nar', 'n', '東央テレビの事件から数か月。{name}の名前は「俳優探偵」として、すっかり世間に知れわたっていた。'],
  ['mgr', 'smile', '{name}さん、お仕事の依頼が山ほど来てますよ！ …半分は「事件を解決してほしい」っていう依頼ですけど。'],
  me('conf', '俳優の仕事が本業なんだけどな…。'),
  ['c', 'smile', 'おい{name}。今度、浅草の「ラフ座」でお笑いコンテストの決勝があるんだ。特別審査員、引き受けてくれよ。'],
  ['c', 'n', 'オレの後輩の「ポテトチップス」ってコンビも出るんだ。…ま、事件なんか起きねえだろ。たぶんな。'],
  me('smile', '分かった。楽しみにしてるよ。'),
  { if: 'rep>=50', then: [['mgr', 'n', 'それと…ファンクラブ会員が1万人を超えました！ 「名探偵{name}を応援する会」ですって。'], { rep: 2 }] },
]);
ST.inter4 = inter('幕間\n「ホラー映画のオファー」', 'dressing', [{ k: 'me', x: 9, y: 6 }, { k: 'mgr', x: 13, y: 6 }], [
  ['nar', 'n', 'ラフ座の事件のあと、ポテトチップスから御礼の手紙が届いた。「うさぎのコンソメ」は、今やテレビでも大人気だ。'],
  ['mgr', 'n', '次のお仕事は、ホラー映画『霧島医院』。廃病院での夜間撮影です。医師の役ですね。'],
  me('sweat', '…廃病院か。'),
  ['mgr', 'conf', '地元では「0時に霊安室から悲鳴が聞こえる」って有名な場所らしいですよ。'],
  me('n', '幽霊なんていないよ。…たぶん。'),
]);
ST.inter5 = inter('幕間\n「マネージャーの報告」', 'dressing', [{ k: 'me', x: 9, y: 6 }, { k: 'mgr', x: 12, y: 6 }], [
  ['nar', 'n', '霧島医院の撮影が終わった日。楽屋で、マネージャーの三好さくらが、もじもじしていた。'],
  ['mgr', 'sweat', 'あの…{name}さん。じつは私…結婚することになりまして。'],
  me('surp', 'えっ！ おめでとう、三好さん！'),
  ['mgr', 'smile', '海辺の教会で式を挙げるんです。{name}さんに、スピーチをお願いしたくて。'],
  me('smile', 'もちろん。喜んで。'),
  ['mgr', 'conf', '…弟のケンタも来てくれるんです。父は…呼んでいませんけど。'],
  me('n', '（三好さんのお父さん…。何か事情があるみたいだ）'),
]);
ST.inter6 = inter('幕間\n「雪山からの依頼」', 'studio', [{ k: 'me', x: 11, y: 7 }, { k: 'mgr', x: 13, y: 7 }], [
  ['nar', 'n', '結婚式から一週間。新婚の三好さくらは、何事もなかったように仕事に復帰していた。'],
  ['mgr', 'smile', 'お父さんとは、あれからときどき電話してるんです。…{name}さんのおかげです。'],
  ['mgr', 'n', 'さて、次のお仕事！ 雪山のスキー場のCMです。ロッジ「銀嶺荘」に泊まりこみですよ。'],
  me('smile', '雪山か。寒そうだな。'),
  { if: 'rep>=60', then: [['jinno', 'n', '（電話）神野だ。…雪山に行くそうだな。最近、あちこちで君の名前を聞く。何かあったら、遠慮なく連絡してくれ。']] },
]);
ST.inter7 = inter('幕間\n「金鯱賞ノミネート」', 'studio', [{ k: 'me', x: 11, y: 7 }, { k: 'mgr', x: 13, y: 7 }, { look: C_LOOK(), x: 9, y: 7 }], [
  ['mgr', 'surp', '{name}さん！！ 大ニュースです！'],
  ['mgr', 'cry', '映画祭「金鯱賞」の主演賞に…ノミネートされました！'],
  me('surp', '…本当に！？'),
  ['c', 'smile', 'へっ、やるじゃねえか。ライバルは誰だ？'],
  ['mgr', 'n', '九条レオさんです。ホテル・グランミラージュで共演した。'],
  me('smile', 'レオさんか。手ごわいな。'),
  ['nar', 'n', '授賞式の夜。それが、{name}の「第2章」の最後の舞台になる。'],
]);
ST.endSeason = function (cb) {
  ST.mode = 'story'; G.audio.bgm('ending'); G.S.endings.season2 = true;
  ST.scene('theater', [{ k: 'me', x: 11, y: 5, dir: 'up' }, { k: 'mgr', x: 13, y: 9, dir: 'up' }, { look: G.ASSIST.c.look, x: 8, y: 9, dir: 'up' }, { look: { kind: 'dog' }, x: 10, y: 9, dir: 'up' }, { k: 'jinno', x: 16, y: 9, dir: 'up' }]);
  G.run([
    { big: '第2章 エンディング\n「カーテンコール」', cls: 'chapter', ms: 2200 },
    ['nar', 'n', '授賞式のあと。誰もいなくなった客席で、{name}は舞台を見上げていた。'],
    ['mgr', 'smile', '{name}さん。トロフィー、重いでしょう？'],
    me('smile', 'うん。…でも、一人で取ったものじゃないから、ちょうどいい重さだよ。'),
    ['c', 'smile', 'へっ。湿っぽいこと言ってんじゃねえよ。打ち上げ行くぞ、打ち上げ。'],
    ['d', 'smile', 'ワン！'],
    ['r', 'smile', 'お店の予約は済ませてあります。8名様、個室です。'],
    ['jinno', 'n', '…{name}さん。また、何かあったら頼む。'],
    me('smile', 'はい。俳優の仕事が、休みのときなら。'),
    ['nar', 'n', '――名探偵{name}の物語は、まだまだ続く。'],
    { if: () => !G.S.cases.hidden || !G.S.cases.hidden.cleared, then: [['sys', 'n', '※ まだ明かされていない真実があります。「記憶のかけら」を3つ集め、評判を50以上にすると、隠し事件「最後のフィルム」が解放されます。（事件ファイルで条件を確認できます）']] },
  ], () => { ST.scene(null); ST.credits(CREDIT('― SEASON 2 END ―'), () => { G.autosave(); cb(); }); });
};
ST.endSecret = function (cb) {
  ST.mode = 'story'; G.audio.bgm('ending'); G.S.endings.secret = true;
  ST.scene('theater', [{ k: 'me', x: 11, y: 5, dir: 'up' }, { k: 'takamiya', x: 13, y: 5, dir: 'up' }, { look: G.ASSIST.c.look, x: 6, y: 9, dir: 'up' }, { look: { kind: 'dog' }, x: 9, y: 9, dir: 'up' }, { k: 'mgr', x: 16, y: 9, dir: 'up' }, { k: 'jinno', x: 18, y: 11, dir: 'up' }]);
  G.run([
    { big: '秘密のエンディング\n「星降る劇場」', cls: 'chapter', ms: 2200 },
    ['nar', 'n', '小さな試写室。スクリーンに、20年前のフィルムNo.13が映し出された。'],
    ['nar', 'n', '幼い{name}が、ちゃんと立ち位置の印の上に立っている。その頭上で――細いワイヤーが、ぷつりと切れた。'],
    me('surp', '{I}は…ずれていなかった。'),
    ['takamiya', 'smile', 'そうだよ。君は一歩も間違えていなかった。'],
    ['nar', 'n', '暗がりから現れたのは、宮さん――いや、映画監督・鷹宮修司だった。'],
    ['takamiya', 'n', '黒川は「子役の立ち位置ミス」を言いふらすと脅した。まだ8歳の君の未来を、そんな嘘で汚させるわけにはいかなかった。だから私が責任をかぶった。'],
    me('cry', '監督…20年も、ひとりで…。'),
    ['takamiya', 'smile', 'ひとりじゃなかったさ。君がテレビに出るたび、私は客席にいるつもりで見ていた。…佐伯くんの親子も、岩瀬も、真実を守ろうとしてくれた。'],
    ['jinno', 'n', '野々村さんの証言で、20年前の事故は再調査になる。佐伯誠さんの名誉も回復されるだろう。'],
    ['c', 'smile', 'おいおい、湿っぽいのはナシだぜ。…監督、こいつ主演でもう一本撮ってくださいよ。オレ、脇役でいいんで。'],
    ['d', 'smile', 'ワンワン！'],
    ['r', 'smile', 'スケジュールの確保は、私にお任せください。'],
    ['takamiya', 'smile', 'ははは。…いいだろう。タイトルはもう決めてある。'],
    ['takamiya', 'n', '『名探偵{name}』。'],
    me('smile', '…はい！ よろしくお願いします、監督！'),
  ], () => { ST.scene(null); ST.credits(CREDIT('― TRUE END ―'), () => { G.autosave(); cb(); }); });
};
})();
