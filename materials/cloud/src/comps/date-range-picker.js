/* ================= 日期范围选择：日历 q 弹鼓出来；点入住那天凝成一滴，鼠标走到哪儿牵一根细线；再点离开那天，中间一格一格灌满，日历收起，框里的数一格一格 q 一下 ================= */
(() => {
  const root = $('#dateRangePicker'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), btn = $('#drpBtn'), pop = $('#drpPop');
  const els = [...$('#drpBox').querySelectorAll('span:not(.sl):not(.dash)')];
  const Y = TODAY.getFullYear();
  let a = new Date(Y, TODAY.getMonth(), TODAY.getDate() + 5), b = new Date(Y, TODAY.getMonth(), TODAY.getDate() + 8), hov = null, picking = false, mg = null, closeT = 0, prev = null;
  const md = (el, lab, d, isM) => ({ el, label: lab, ph: '––', min: 1, pad: 2, val: isM ? d.getMonth() + 1 : d.getDate(), max: isM ? 12 : 31 });
  const segs = [md(els[0], '入住月', a, true), md(els[1], '入住日', a, false), md(els[2], '离开月', b, true), md(els[3], '离开日', b, false)];
  segs[1].max = ss => new Date(Y, (ss[0].val ?? 1), 0).getDate(); segs[3].max = ss => new Date(Y, (ss[2].val ?? 1), 0).getDate();
  const f = segField({ box: $('#drpBox'), cv, M, segs, onChange: ss => {
    if (ss.some(s => s.val === null) || picking) return;
    a = new Date(Y, ss[0].val - 1, ss[1].val); b = new Date(Y, ss[2].val - 1, ss[3].val); if (b < a) [a, b] = [b, a]; if (mg) sync();
  } });
  const fx = gridFx({ cv, M, ink: 'bg', R: 15, cells: () => (mg ? mg.cells() : []) });
  const center = () => { const r = $('#drpBox').getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left + 150, r.bottom - c.top + 8 + 169]; };
  const bl = makeBloom({ w: 300, h: 338, r: 16, n: 140, M, el: pop, center, base: '' });
  function sync() {
    if (!mg) return;
    const n = mg.cells().length, ia = mg.indexOf(a), ib = b ? mg.indexOf(b) : NaN;
    if (!bl.open) fx.range(NaN, NaN, NaN, NaN);
    else if (picking) fx.range(NaN, NaN, ia >= 0 && ia < n ? ia : NaN, hov ? mg.indexOf(hov) : NaN);
    else if ((ia < 0 && ib < 0) || (ia >= n && ib >= n)) fx.range(NaN, NaN, NaN, NaN);
    else fx.range(clamp(ia, 0, n - 1), clamp(ib, 0, n - 1), NaN, NaN);
    mg.cells().forEach((btn2, i) => { const d = mg.dateAt(i), on = picking ? sameDay(d, a) : (d >= a && d <= b); btn2.parentElement.setAttribute('aria-selected', String(!!on)); btn2.setAttribute('aria-label', btn2.dataset.base + (on ? '，已选中' : '')); });
  }
  function pick(d) {
    if (!picking) { prev = [a, b]; a = d; b = null; picking = true; hov = d; sync(); return; }
    if (d < a) { b = a; a = d; } else b = d; picking = false; sync();
    f.setAll([a.getMonth() + 1, a.getDate(), b.getMonth() + 1, b.getDate()], true);
    clearTimeout(closeT); closeT = setTimeout(() => close(true), reduced ? 0 : 650);   // 先看它灌满，再收起
  }
  mg = makeMonthGrid({ root: $('#drpGrid'), view: a, focusOf: () => a, onPick: pick, onHover: d => { hov = d; if (picking) sync(); }, onRender: () => sync() });
  function open() { if (bl.open) return; picking = false; mg.show(a); bl.show(); btn.setAttribute('aria-expanded', 'true'); sync(); requestAnimationFrame(() => mg.focus()); }
  function close(refocus) { clearTimeout(closeT); if (!bl.open) return; if (picking) { picking = false; if (prev) [a, b] = prev; } bl.hide(); sync(); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus({ preventScroll: true }); }
  btn.addEventListener('click', () => (bl.open ? close(false) : open()));
  pop.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(true); } });
  root.addEventListener('focusout', e => { if (bl.open && e.relatedTarget && !root.contains(e.relatedTarget)) close(false); });
  document.addEventListener('pointerdown', e => { if (bl.open && !root.contains(e.target)) close(false); });
  comps.push({
    step(dt) { f.step(dt); bl.step(dt); fx.step(dt); smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k); f.draw(ctx, k); bl.draw(ctx, k); if (bl.B.sc.x > .6) fx.draw(ctx, k); },
  });
})();
