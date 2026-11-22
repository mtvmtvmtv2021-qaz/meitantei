/* =========================================================
   trial.js ― 証言・証拠提示・告発・とどめ・事件評価
   ========================================================= */
(function () {
const TR = G.trial = { inTrial: false };
const $ = G.$, esc = G.esc;

/* ---------- 自動イベント ---------- */
TR.checkEvents = function () {
  if (!G.CASE || !G.C || TR.inTrial || TR.evRunning) return;
  const ev = (G.CASE.events || []).find(e => !G.C.flags['evt_' + e.id] && G.cond(e.need));
  if (!ev) return;
  G.C.flags['evt_' + ev.id] = true;
  TR.evRunning = true;
  setTimeout(() => {
    const go = () => G.run(ev.s, () => { TR.evRunning = false; G.autosave(); G.explore.updateHud(); TR.checkEvents(); });
    if (G.ui.busy()) { const wait = () => G.ui.busy() ? setTimeout(wait, 100) : go(); wait(); } else go();
  }, G.auto ? 0 : 150);
};

/* ---------- 表情の手がかり（難易度で調整） ---------- */
function cueExpr(T, i) {
  const st = T.st[i], diff = G.C.diff;
  if (st.ex) return st.ex;
  const contra = !!st.contra;
  if (diff === 'easy') return contra ? 'lie' : 'n';
  if (diff === 'normal') { const decoy = (T.decoy != null ? T.decoy : (T.st.findIndex(s => !s.contra))); return contra ? 'sweat' : (i === decoy ? 'sweat' : 'n'); }
  // HARD：表情はほぼ当てにならない
  return (i % 2 === 0) ? 'n' : 'conf';
}

/* ---------- 証言 ---------- */
TR.testimony = function (id, done) {
  const T = G.CASE.testi[id];
  const solvedKey = 'solved_' + id;
  if (G.flag(solvedKey)) return done && done(true);
  TR.inTrial = true;
  G.audio.bgm('testimony');
  G.audio.sfx('start');
  G.explore.mode = G.explore.mode === 'play' ? 'pause' : G.explore.mode;
  T.st.forEach(s => G.addTl(T.who, s.t));
  const intro = [{ L: T.who, ex: 'n' }, { flash: '#fff' }, { big: '証言開始\n―' + T.title + '―', cls: 'testi', ms: 1400 }].concat(T.intro || [])
    .concat(T.st.map((s, i) => [T.who, cueExpr(T, i), s.t]));
  G.run(intro, () => TR.exam(id, done));
};
TR.exam = function (id, done) {
  const T = G.CASE.testi[id];
  TR.curT = id;
  let sel = 0;
  const pressed = G.C.flags['pressed_' + id] || (G.C.flags['pressed_' + id] = {});
  const box = $('testi');
  const render = () => {
    box.className = 'on';
    box.innerHTML = `<div class="tt">証言：${esc(T.title)}　<small>${esc(G.charOf(T.who).name)}</small></div><ol>${T.st.map((s, i) => `<li class="${i === sel ? 'sel' : ''}${pressed[i] ? ' pr' : ''}" data-i="${i}">${esc(G.fmt(s.t))}</li>`).join('')}</ol>
      <div class="tk"><button data-a="ok">Z：詳しく聞く</button><button data-a="inv">I：証拠を見せる</button><button data-a="consult">C：助手に相談</button><button data-a="file">M：手帳</button><button data-a="back">X：調査に戻る</button></div>`;
    G.ui.stageShow(true); G.ui.setL(T.who, cueExpr(T, sel)); G.ui.setR(null); G.ui.focus('L');
    // 選択中の発言を会話欄に
    const D = G.ui.dlg; D.open(); $('dname').textContent = G.charOf(T.who).name; $('dname').className = ''; $('dname').style.display = '';
    $('dtext').className = 'stmt'; $('dtext').textContent = G.fmt(T.st[sel].t); $('dnext').classList.remove('on');
  };
  const hide = () => { box.className = ''; box.innerHTML = ''; G.ui.dlg.close(); G.ui.clearStage(); };
  const back = () => { hide(); G.ui.pop(layer); };
  const resume = () => { G.ui.push(layer); render(); };
  const key = k => {
    if (k === 'up' || k === 'left') { sel = (sel + T.st.length - 1) % T.st.length; G.audio.sfx('move'); render(); }
    else if (k === 'down' || k === 'right') { sel = (sel + 1) % T.st.length; G.audio.sfx('move'); render(); }
    else if (k === 'ok') { // 詳しく聞く
      back(); pressed[sel] = true;
      const s = T.st[sel];
      G.run([['me', 'point', 'ちょっと待ってください！ 今の発言、詳しく聞かせてください。'], { shake: 1 }].concat(s.press || [[T.who, 'n', 'これ以上、言うことはありません。']]), resume);
    }
    else if (k === 'inv') { // 証拠を見せる
      back();
      G.ui.evidence('present', evId => TR.present(id, sel, evId, done, resume), resume, '「' + G.fmt(T.st[sel].t).slice(0, 18) + '…」に見せる証拠品は？');
    }
    else if (k === 'consult') { back(); G.run(TR.testiHint(T, sel), resume); }
    else if (k === 'menu' || k === 'file') { back(); G.story.menu(resume, true); }
    else if (k === 'back') {
      back();
      G.ui.confirm('証言をいったん中断して、調査に戻りますか？（あとで再開できます）', () => { TR.leave(T); done && done(false); }, resume);
    }
  };
  const layer = G.ui.push({ name: 'testimony', key });
  $('testi').onclick = e => { const li = e.target.closest('li'); if (li) { sel = +li.dataset.i; render(); return; } const b = e.target.closest('[data-a]'); if (b) key(b.dataset.a); };
  render();
};
TR.leave = function (T) {
  TR.inTrial = false;
  G.ui.clearStage();
  if (G.explore.mode === 'pause') G.explore.mode = 'play';
  G.audio.bgm(G.CASE.bgm || 'explore');
  if (T && T.final) G.toast('調査に戻った。準備ができたら、もう一度「あなたが犯人だ！」で追及しよう');
};
function accepts(st, evId) {
  if (!st.contra) return false;
  if ([].concat(st.contra).includes(evId)) return true;
  const alt = st.alt || {};
  const d = G.C.diff;
  if (Array.isArray(alt)) return d !== 'hard' && alt.includes(evId);
  return (alt[d] || []).includes(evId);
}
TR.present = function (id, i, evId, done, resume) {
  const T = G.CASE.testi[id], st = T.st[i], e = G.evData(evId);
  if (accepts(st, evId)) {
    G.C.flags['solved_' + id] = true;
    G.C.contra.push(`${G.charOf(T.who).name}「${G.fmt(st.t)}」⇔ 証拠品「${e.name}」`);
    if (st.log) G.addLog(st.log);
    G.addTl(T.who, G.fmt(st.t) + '（← 矛盾していた）');
    G.audio.sfx('contra');
    const seq = [{ flash: '#fff' }, { shake: 2 }, { R: 'me', ex: 'point' }, { big: '矛盾発見！', cls: 'contra', ms: 1100 }, ['me', 'point', `「${e.name}」…これが、あなたの証言の矛盾を示しています！`]]
      .concat(st.ok || []).concat([{ L: T.who, ex: 'shake' }]).concat(T.after || []);
    G.run(seq, () => { TR.inTrial = false; G.autosave(); if (!T.final) { G.ui.clearStage(); if (G.explore.mode === 'pause') G.explore.mode = 'play'; G.audio.bgm(G.CASE.bgm || 'explore'); } done && done(true); });
  } else {
    TR.penalty();
    const w = st.wrong || T.wrong || [[T.who, 'angry', `「${e.name}」？ それが今の話と何の関係があるんですか？`], ['as', { c: 'angry', d: 'sad', r: 'conf' }[G.C.as], { c: 'おいおい、今のはハズレだろ。落ち着いて証言と証拠をよく見比べろよ。', d: 'クゥン…（{d}が心配そうに見上げている）', r: 'その証拠品と発言の間に、矛盾は検出できませんでした。' }]];
    G.run([{ sfx: 'wrong' }, { shake: 1 }, { flash: '#ff6060' }].concat(w), resume);
  }
};
TR.penalty = function () {
  if (G.C.finalStarted && G.flag('jinnoBack') && !G.C.freeMiss) { G.C.freeMiss = 1; G.toast('神野警部補がフォローしてくれた（ミスとして数えない）'); return; }
  G.C.mis++;
};
TR.testiHint = function (T, sel) {
  const idx = T.st.findIndex(s => s.contra);
  const ev = idx >= 0 ? G.evData([].concat(T.st[idx].contra)[0]) : null;
  const num = '①②③④⑤⑥'[idx] || '';
  const d = G.C.diff, as = G.C.as;
  const decoy = '①②③④⑤⑥'[(idx + 1) % T.st.length];
  if (as === 'c') {
    if (d === 'easy') return [['as', 'n', `${num}の発言、あれ怪しいだろ。「${ev ? ev.name : '証拠'}」と見比べてみろよ。`]];
    if (d === 'normal') return [['as', 'conf', `${num}の発言、なんか引っかかるんだよな。オレのツッコミ芸人の勘がそう言ってる。`]];
    return [['as', 'n', 'どっかに嘘が混じってるぜ。時刻か、場所か、モノか…一個ずつ証拠と突き合わせろ。']];
  }
  if (as === 'r') {
    if (d === 'easy') return [['as', 'analyze', `解析結果：発言${num}と証拠品「${ev ? ev.name : ''}」の間に不一致を検出しました。`]];
    if (d === 'normal') return [['as', 'think', `解析結果：発言${num}に矛盾がある可能性が高いと推定されます。`]];
    return [['as', 'think', `解析結果：矛盾の候補は発言${num}と発言${decoy}の2つです。これ以上の絞り込みは、あなたの推理にお任せします。`]];
  }
  if (d === 'easy') return [['as', 'alert', 'ワン！'], ['nar', 'n', `（{d}が${num}の発言のところで耳をぴんと立てた。…そうだ、「${ev ? ev.name : '証拠'}」と比べてみよう）`]];
  if (d === 'normal') return [['as', 'n', 'クゥーン…'], ['nar', 'n', `（{d}がじっと見つめている。落ち着いて、もう一度証言を見直そう。…${num}の発言が気になる）`]];
  return [['as', 'smile', 'ワフッ'], ['nar', 'n', '（{d}がしっぽを振って励ましてくれている。自分の力で、証言と証拠を照らし合わせよう）']];
};

/* =================== 告発 =================== */
TR.accuseStart = function () {
  if (TR.inTrial || G.ui.busy()) return;
  const sus = Object.keys(G.CASE.chars).filter(k => G.CASE.chars[k].suspect && G.C.ppl[k]);
  if (!sus.length) return G.run([['me', 'conf', 'まだ容疑者から話を聞いていない。まずは調査だ。']]);
  let sel = 0;
  const render = () => {
    const html = `<div class="box accsel"><div class="ttl">あなたが犯人だ！ ― 告発する人物を選んでください</div><div class="sus">${sus.map((k, i) => `<button class="su${i === sel ? ' sel' : ''}" data-i="${i}"><canvas width="48" height="56" data-pt="${k}"></canvas><span>${esc(G.charOf(k).name)}</span></button>`).join('')}</div>
      <p class="dim">証拠が足りなくても告発できます。まちがえると評判と事件評価が下がりますが、何度でもやり直せます。</p><div class="evkeys"><button data-a="ok">Z：告発する</button><button data-a="back">X：やめる</button></div></div>`;
    const p = G.ui.panel.open(html, 'full');
    p.querySelectorAll('canvas[data-pt]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(G.art.portrait(G.charOf(c.dataset.pt).look, 'n'), 0, 0); });
    p.onclick = e => { const b = e.target.closest('.su'); if (b) { if (+b.dataset.i === sel) key('ok'); else { sel = +b.dataset.i; render(); } } const a = e.target.closest('[data-a]'); if (a) key(a.dataset.a); };
  };
  const close = () => { G.ui.pop(layer); G.ui.panel.close(); };
  const key = k => {
    if (k === 'left' || k === 'up') { sel = (sel + sus.length - 1) % sus.length; G.audio.sfx('move'); render(); }
    else if (k === 'right' || k === 'down') { sel = (sel + 1) % sus.length; G.audio.sfx('move'); render(); }
    else if (k === 'back') { G.audio.sfx('back'); close(); }
    else if (k === 'ok') { close(); const who = sus[sel]; G.ui.confirm(`${G.charOf(who).name}を犯人として告発しますか？`, () => TR.accuse(who), () => {}); }
  };
  const layer = G.ui.push({ name: 'accuse', key });
  render();
};
TR.accuseFx = function (who, cb) {
  const ov = $('acc');
  G.audio.bgm(null);
  const pc = $('accme'), sc = $('accsus');
  const draw = (c, img) => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0); };
  draw(pc, G.art.portrait(G.myLook(), 'point', 'point'));
  draw(sc, G.art.portrait(G.charOf(who).look, 'surp'));
  ov.className = 'on s1';
  if (G.auto) { ov.className = ''; return cb(); }
  G.audio.sfx('shock');
  setTimeout(() => { ov.className = 'on s2'; G.audio.sfx('accuse'); G.fx.shake(true); G.fx.flash('#fff'); }, 450);
  setTimeout(() => { ov.className = 'on s3'; G.fx.shake(true); }, 1500);
  setTimeout(() => { ov.className = 'on s4'; G.audio.sfx('shock'); G.fx.shake(); }, 2500);
  setTimeout(() => { ov.className = ''; cb(); }, 3600);
};
TR.accuse = function (who) {
  G.explore.mode = 'pause';
  TR.accuseFx(who, () => {
    const c = G.CASE;
    if (who === c.culprit) {
      const again = G.C.finalStarted;
      G.C.finalStarted = true;
      G.C.flags.accusedRight = true;
      G.addLog(`${G.charOf(who).name}を犯人として告発した。`);
      G.run((again ? [['me', 'point', `${G.charOf(who).name}さん。さっきの続きです。今度こそ、すべてを明らかにします！`]] : c.accuseOk).concat([{ L: who, ex: 'sweat' }]), () => TR.finalChain());
    } else {
      G.C.wacc++; G.C.accused[who] = true; G.addRep(-3);
      G.addLog(`${G.charOf(who).name}を告発したが、反論された。（まちがった告発）`);
      const w = (c.wrongAcc || {})[who] || [[who, 'angry', 'わ、私が犯人ですって！？ 冗談じゃない、証拠はあるんですか！']];
      G.run([{ L: who, ex: 'angry' }].concat(w).concat([{ sfx: 'wrong' }, { shake: 1 }, ['nar', 'n', 'まちがった告発をしてしまった…。探偵としての評判が下がった。（評判 −3）'],
        ['as', { c: 'angry', d: 'sad', r: 'conf' }[G.C.as], { c: 'バカ、早とちりしすぎだ！ …ま、次で取り返せばいいだろ。証拠を集め直そうぜ。', d: 'クゥーン…（{d}が鼻先を手のひらに押しつけてきた。まだ終わりじゃない）', r: '推理の前提に誤りがある可能性があります。証拠と時系列を、もう一度整理しましょう。' }]]),
        () => { G.explore.mode = 'play'; G.ui.clearStage(); G.audio.bgm(G.CASE.bgm || 'explore'); G.explore.updateHud(); G.autosave(); });
    }
  });
};
TR.finalChain = function () {
  const c = G.CASE, list = c.final;
  if (G.C.fin < list.length) {
    const id = list[G.C.fin];
    return TR.testimony(id, ok => {
      if (ok) { G.C.fin++; G.autosave(); TR.finalChain(); }
      else { G.explore.mode = 'play'; G.explore.updateHud(); }
    });
  }
  TR.finish();
};
TR.finish = function () {
  const f = G.CASE.finish;
  TR.inTrial = true;
  G.audio.bgm('testimony');
  G.run(f.pre || [], () => {
    G.ui.evidence('present', evId => {
      if (evId === f.ans || (f.alt && G.C.diff !== 'hard' && f.alt.includes(evId))) {
        G.audio.sfx('contra');
        G.addLog(`決め手：「${G.evData(evId).name}」`);
        G.run([{ flash: '#fff' }, { shake: 2 }, { big: '真相解明！', cls: 'truth', ms: 1400 }, { bgm: 'truth' }].concat(f.ok), () => TR.clear());
      } else {
        TR.penalty();
        G.run([{ sfx: 'wrong' }, { shake: 1 }].concat(f.ng || [[G.CASE.culprit, 'lie', 'ふん…それが何だというんです？ 話にならない。']]), () => TR.finish());
      }
    }, () => {
      G.ui.confirm('追及をいったん中断して、調査に戻りますか？', () => { TR.leave({ final: true }); G.explore.mode = 'play'; }, () => TR.finish());
    }, G.fmt(f.prompt));
  });
};

/* =================== 事件評価 =================== */
TR.rank = function () {
  const c = G.CASE, C = G.C;
  const allEv = Object.keys(c.evidence).filter(k => !c.evidence[k].noRank);
  const got = allEv.filter(k => C.ev.includes(k)).length;
  const evRate = got / allEv.length;
  const spots = c.spots.filter(s => !s.noRank);
  const seen = spots.filter(s => C.seen[s.id]).length;
  let topics = 0, read = 0;
  for (const k in c.talk || {}) ['ask', 'deep'].forEach(kind => (c.talk[k][kind] || []).forEach(it => { if (it.need && !G.cond(it.need)) return; topics++; if (C.read[it.id]) read++; }));
  const invRate = (seen + read) / Math.max(1, spots.length + topics);
  const bonus = c.bonus || [];
  const bonusSolved = bonus.filter(b => G.flag('solved_' + b)).length;
  let score = 100;
  const reasons = [];
  score -= C.wacc * 15; reasons.push(['まちがった告発', C.wacc + '回', C.wacc ? -C.wacc * 15 : 0]);
  const mp = Math.min(C.mis, 6) * 4; score -= mp; reasons.push(['推理の正確さ（証拠提示ミス）', C.mis + '回', -mp]);
  const ep = Math.round((1 - evRate) * 20); score -= ep; reasons.push(['証拠品の収集率', Math.round(evRate * 100) + '%', -ep]);
  const bp = (bonus.length - bonusSolved) * 8; score -= bp; reasons.push(['重要な矛盾の発見', `${bonusSolved}/${bonus.length}（任意の証言の矛盾）`, -bp]);
  const ip = Math.round((1 - invRate) * 12); score -= ip; reasons.push(['調査の達成度', Math.round(invRate * 100) + '%', -ip]);
  score = Math.max(0, score);
  const r = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';
  return { r, score, reasons };
};
const REPG = { S: 20, A: 15, B: 10, C: 6, D: 3 };
const ORD = ['D', 'C', 'B', 'A', 'S'];
TR.clear = function () {
  const c = G.CASE, rec = G.caseRec(c.id);
  const R = TR.rank();
  G.C.done = true; G.C.rank = R.r;
  const prev = rec.best;
  const gain = Math.max(0, REPG[R.r] - (prev ? REPG[prev] : 0));
  const first = !rec.cleared;
  rec.cleared = true; rec.runs++;
  if (!prev || ORD.indexOf(R.r) > ORD.indexOf(prev)) rec.best = R.r;
  G.addRep(gain);
  TR.inTrial = false;
  G.explore.stop(); G.ui.clearStage();
  TR.showRank(R, gain, () => {
    const ep = (c.epilogue || []).concat(R.r === 'S' || R.r === 'A' ? (c.epiHigh || []) : (R.r === 'C' || R.r === 'D' ? (c.epiLow || []) : []));
    G.audio.bgm('ending');
    G.story.scene(c.epScene || null);
    G.run(ep, () => { rec.run = null; G.CASE = null; G.C = null; G.story.afterCase(c.id, first); });
  });
};
TR.showRank = function (R, gain, cb) {
  G.audio.sfx('rank'); G.audio.bgm('truth');
  const html = `<div class="box rankbox"><div class="ttl">事件解決！ ― ${esc(G.CASE.no)}「${esc(G.CASE.title)}」</div>
    <div class="rk"><div class="letter r${R.r}">${R.r}</div><div><p>事件評価ランク</p><b>${R.score}点</b></div></div>
    <table class="ft">${R.reasons.map(([a, b, c]) => `<tr><th>${a}</th><td>${b}</td><td class="${c < 0 ? 'neg' : 'pos'}">${c ? c : '±0'}</td></tr>`).join('')}</table>
    <p>探偵としての評判：<b>+${gain}</b>（現在 ${G.S.rep}・${G.repTitle()}）${gain === 0 ? '<br><small>※ 再挑戦では、前回のランクを上回った分だけ評判が上がります。</small>' : ''}</p>
    <div class="evkeys"><button data-a="ok">Z：次へ</button></div></div>`;
  const p = G.ui.panel.open(html, 'full');
  const close = () => { G.ui.pop(layer); G.ui.panel.close(); cb(); };
  p.onclick = e => { if (e.target.closest('[data-a]')) close(); };
  const layer = G.ui.push({ name: 'rank', key: k => { if (k === 'ok') close(); } });
  if (G.auto) setTimeout(close, 0);
};
})();
