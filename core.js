/* =========================================================
   名探偵〇〇  core.js  ― 共通データ・状態・条件・セーブ
   ========================================================= */
window.G = window.G || {};
G.VERSION = 2;
G.CASES = {};
G.ORDER = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'hidden'];
G.MAIN = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
G.S = null;          // セーブ対象の全体状態
G.C = null;          // 現在の事件の進行（G.S.cases[id].run）
G.CASE = null;       // 現在の事件データ
G.auto = false;      // 自動テスト用（会話を即時送り）
G.set = { bgm: 0.5, sfx: 0.7, mute: false, speed: 1, marks: true };

G.rand = a => a[Math.floor(Math.random() * a.length)];
G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- 共通キャラクター（事件をまたいで登場） ---------- */
G.GCH = {
  mgr:   { name: '三好さくら', v: 900, look: { skin:'#f3cfac', hair:'#6b3a22', style:'bob', cloth:'#3d3d4f', cloth2:'#f0f0f0', outfit:'suit', female:true, acc:['earring'] },
           age:'32歳', job:'マネージャー', rel:'担当マネージャー' },
  jinno: { name: '神野警部補', v: 260, look: { skin:'#e2b48c', hair:'#262222', style:'short', cloth:'#6b5d48', cloth2:'#d8d8d8', outfit:'coat', acc:['stubble'] },
           age:'44歳', job:'警視庁 捜査一課', rel:'ときどき非公式に協力を頼んでくる刑事' },
  miya:  { name: '宮さん', v: 220, look: { skin:'#e6c09c', hair:'#d8d8d8', style:'short', cloth:'#7a6a4a', cloth2:'#e8e0cc', outfit:'knit', acc:['glasses','old'] },
           age:'70代', job:'ピアノ調律師', rel:'ホテルの旧館に住む老人' },
  takamiya:{ name: '鷹宮修司', v: 220, look: { skin:'#e6c09c', hair:'#d8d8d8', style:'short', cloth:'#3a3a44', cloth2:'#e8e0cc', outfit:'coat', acc:['glasses','old'] },
           age:'74歳', job:'元映画監督', rel:'子役時代の恩人' },
};
/* 主人公の見た目プリセット */
G.LOOKS = {
  m: [
    { id:'m1', label:'さわやか短髪・ネイビージャケット', skin:'#f2c9a0', hair:'#2b1e14', style:'short', cloth:'#2d3a5a', cloth2:'#ececec', pants:'#2a2a33', outfit:'suit', acc:[] },
    { id:'m2', label:'金髪ツンツン・レザージャケット', skin:'#f0c49a', hair:'#d8b050', style:'spiky', cloth:'#7a2626', cloth2:'#222', pants:'#1e2a44', outfit:'coat', acc:[] },
    { id:'m3', label:'オールバック・トレンチコート', skin:'#e9bd92', hair:'#33303a', style:'slick', cloth:'#8a7550', cloth2:'#eee', pants:'#2a2622', outfit:'coat', acc:['tie'] },
  ],
  f: [
    { id:'f1', label:'黒髪ロング・白ブラウス', skin:'#f6d2b0', hair:'#20160f', style:'long', cloth:'#efeae0', cloth2:'#3a5a8a', pants:'#3a5a8a', outfit:'shirt', female:true, skirt:true, acc:[] },
    { id:'f2', label:'赤茶ボブ・グリーンコート', skin:'#f3cfac', hair:'#a4472c', style:'bob', cloth:'#2f6a58', cloth2:'#f2eadc', pants:'#2a2a33', outfit:'coat', female:true, acc:[] },
    { id:'f3', label:'金髪ポニーテール・パープルジャケット', skin:'#f6d2b0', hair:'#e0c060', style:'ponytail', cloth:'#5a3a72', cloth2:'#f4f4f4', pants:'#262636', outfit:'suit', female:true, acc:['earring'] },
  ],
};
/* 助手 */
G.ASSIST = {
  c: { key:'c', kind:'芸人', title:'お笑い芸人', v: 330,
       look: { skin:'#e9bf98', hair:'#e9bf98', style:'bald', cloth:'#4a6fa5', cloth2:'#e8e8e8', pants:'#2a2a33', outfit:'denim', acc:['glasses'] },
       desc:'毒舌で口が悪い関東弁のツッコミ芸人。頭の回転が速く、証言の不自然さや矛盾を鋭く突く。行き詰まったらヒントもくれる（犯人は教えない）。',
       skill:'会話の矛盾を見抜く／鋭い質問／ヒント' },
  d: { key:'d', kind:'柴犬', title:'柴犬', v: 700, look: { kind:'dog' },
       desc:'主人公になついている賢くて忠実な柴犬。言葉は話せないが、隠された場所・隠し引き出し・家具の中の証拠を見つけて知らせてくれる。',
       skill:'隠し場所・隠し通路・家具の中の証拠を発見' },
  r: { key:'r', kind:'AIロボット', title:'AIロボット', v: 1200, look: { kind:'robot' },
       desc:'スマートフォンの中に住む、小さくてかわいいAIロボット。真面目で丁寧。証拠品や写真の分析、人物の経歴調査、建物の構造分析が得意。',
       skill:'証拠・写真の分析／人物調査／構造分析／矛盾の検出' },
};
G.genNames = function () {
  const sur = ['毒島','鬼塚','黒岩','剛田','辛島','荒巻','鉄谷','雷電'];
  const giv = ['ゴロー','ツヨシ','マサル','タケシ','ケンジ','リュウジ','テツ','ガク'];
  const dog = ['コタロウ','ハチ','マメ','きなこ','ゴン','チャチャ','あずき','ムサシ'];
  const rob = ['ピコ','ルル','ノア','ポコ','ミル','テト'];
  return { c: G.rand(sur) + G.rand(giv), d: G.rand(dog), r: G.rand(rob) };
};

/* ---------- 新規ゲーム ---------- */
G.newGame = function (o) {
  G.S = {
    v: G.VERSION, name: o.name, gender: o.gender, look: o.look,
    asNames: G.genNames(), rep: 10, cases: {}, next: 'c1',
    hiddenOpen: false, endings: {}, requests: {}, created: Date.now(), playMin: 0,
  };
  G.C = null; G.CASE = null;
};
G.myLook = function () {
  const list = G.LOOKS[G.S ? G.S.gender : 'm'] || G.LOOKS.m;
  return list.find(l => l.id === (G.S && G.S.look)) || list[0];
};
G.asName = k => (G.S && G.S.asNames ? G.S.asNames[k || (G.C && G.C.as)] : '') || '';

/* ---------- 事件の進行データ ---------- */
G.newRun = function (id, diff, as) {
  return { id, diff, as, ev: [], evInfo: {}, flags: {}, seen: {}, read: {}, ppl: {}, tlog: {},
           contra: [], log: [], mis: 0, wacc: 0, accused: {}, fin: 0, rev: {}, pos: null, done: false,
           robo: {}, finalStarted: false, freeMiss: 0 };
};
G.caseRec = function (id) {
  if (!G.S.cases[id]) G.S.cases[id] = { best: null, cleared: false, frag: false, runs: 0, repGot: 0, run: null };
  return G.S.cases[id];
};

/* ---------- 条件判定 ---------- */
G.has = id => !!(G.C && G.C.ev.includes(id));
G.flag = f => !!(G.C && G.C.flags[f]);
G.cond = function (c) {
  if (c == null || c === '') return true;
  if (typeof c === 'function') return !!c();
  if (Array.isArray(c)) return c.every(G.cond);
  if (typeof c === 'object' && c.any) return c.any.some(G.cond);
  if (c[0] === '!') return !G.cond(c.slice(1));
  if (c.startsWith('ev:')) return G.has(c.slice(3));
  if (c.startsWith('rep>=')) return (G.S ? G.S.rep : 0) >= +c.slice(5);
  if (c.startsWith('as:')) return G.C && G.C.as === c.slice(3);
  if (c.startsWith('diff:')) return G.C && G.C.diff === c.slice(5);
  if (c.startsWith('seen:')) return !!(G.C && G.C.seen[c.slice(5)]);
  if (c.startsWith('read:')) return !!(G.C && G.C.read[c.slice(5)]);
  if (c.startsWith('solved:')) return !!(G.C && G.C.flags['solved_' + c.slice(7)]);
  if (c.startsWith('cleared:')) return !!(G.S && G.S.cases[c.slice(8)] && G.S.cases[c.slice(8)].cleared);
  return G.flag(c);
};

/* ---------- テキスト整形 ---------- */
G.pick = function (t) {           // {c,d,r} → 助手別のテキスト
  if (t && typeof t === 'object' && !Array.isArray(t)) {
    const k = G.C ? G.C.as : 'c';
    if (t[k] != null) return t[k];
    if (t.all != null) return t.all;
    if (t.easy != null) return t[G.C ? G.C.diff : 'normal'] || t.normal || t.easy;
    return '';
  }
  return t;
};
G.fmt = function (t) {
  t = G.pick(t);
  if (typeof t !== 'string') return '';
  const S = G.S || {};
  const male = S.gender !== 'f';
  return t
    .replace(/\{name\}/g, S.name || '〇〇')
    .replace(/\{I\}/g, male ? '僕' : '私')
    .replace(/\{as\}/g, G.asName())
    .replace(/\{c\}/g, G.asName('c'))
    .replace(/\{d\}/g, G.asName('d'))
    .replace(/\{r\}/g, G.asName('r'))
    .replace(/\{kun\}/g, male ? 'くん' : 'ちゃん');
};

/* ---------- 評判 ---------- */
G.repTitle = function (r) {
  r = r == null ? G.S.rep : r;
  if (r >= 60) return '伝説の名探偵';
  if (r >= 40) return '評判の名探偵';
  if (r >= 20) return '話題の俳優探偵';
  return '駆け出しの俳優探偵';
};
G.addRep = function (n) { G.S.rep = G.clamp(G.S.rep + n, 0, 100); };

/* ---------- 設定 ---------- */
G.loadSettings = function () {
  try { const s = JSON.parse(localStorage.getItem('mt2_set') || 'null'); if (s && typeof s === 'object') Object.assign(G.set, s); } catch (e) {}
};
G.saveSettings = function () { try { localStorage.setItem('mt2_set', JSON.stringify(G.set)); } catch (e) {} };

/* ---------- セーブ・ロード ---------- */
G.memStore = {};
G.store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return G.memStore[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { G.memStore[k] = v; return false; } },
};
G.SLOTS = ['auto', '1', '2', '3'];
G.snapshot = function () {
  if (G.C && G.explore && G.explore.player) G.C.pos = { x: G.explore.player.x, y: G.explore.player.y, d: G.explore.player.dir };
  return JSON.stringify({ v: G.VERSION, when: Date.now(), S: G.S, cur: G.CASE ? G.CASE.id : null, set: G.set });
};
G.save = function (slot) {
  if (!G.S) return false;
  const data = G.snapshot();
  G.store.set('mt2_save_' + slot, data);
  if (slot !== 'auto') G.store.set('mt2_save_' + slot + '_bak', data);
  return true;
};
G.autosave = function () { if (G.S && !G.auto) G.save('auto'); };
G.validSave = function (d) {
  if (!d || typeof d !== 'object' || d.v !== G.VERSION) return false;
  const S = d.S;
  if (!S || typeof S.name !== 'string' || !S.cases || typeof S.cases !== 'object') return false;
  if (!['m', 'f'].includes(S.gender) || typeof S.rep !== 'number') return false;
  for (const k in S.cases) {
    const r = S.cases[k].run;
    if (r && (!Array.isArray(r.ev) || typeof r.flags !== 'object')) return false;
  }
  if (d.cur && !G.CASES[d.cur]) return false;
  return true;
};
G.readSave = function (slot) {
  const raw = G.store.get('mt2_save_' + slot);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (G.validSave(d)) return d;
  } catch (e) {}
  // 壊れていたらバックアップを試す
  const bak = G.store.get('mt2_save_' + slot + '_bak');
  if (bak) { try { const d = JSON.parse(bak); if (G.validSave(d)) return Object.assign(d, { fromBak: true }); } catch (e) {} }
  return { bad: true };
};
G.latestSave = function () {
  let best = null, bestSlot = null;
  for (const s of G.SLOTS) { const d = G.readSave(s); if (d && !d.bad && (!best || d.when > best.when)) { best = d; bestSlot = s; } }
  return best ? { d: best, slot: bestSlot } : null;
};
G.saveSummary = function (d) {
  if (!d) return '（空き）';
  if (d.bad) return '（データが壊れています）';
  const S = d.S, t = new Date(d.when);
  const when = `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  const where = d.cur && G.CASES[d.cur] ? G.CASES[d.cur].title : (S.next && G.CASES[S.next] ? '次：' + G.CASES[S.next].title : '幕間');
  return `${when}　名探偵${S.name}　${where}　評判${S.rep}`;
};
