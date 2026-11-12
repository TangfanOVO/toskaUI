/* ================= 年份范围：点起点那年凝成一块；再点终点，中间一格一格灌满 ================= */
(() => {
  const root = $('#yearRange'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), out = $('#yrOut');
  const Y = TODAY.getFullYear(); let a = Y - 2, b = Y + 1, hov = null, picking = false, tg = null;
  const fx = gridFx({ cv, M, wide: true, bandH: .86, cells: () => (tg ? tg.cells() : []) });
  function sync() {
    if (!tg) return;
    const n = 12, ia = tg.indexOf(a), ib = b === null ? NaN : tg.indexOf(b);
    if (picking) fx.range(NaN, NaN, ia >= 0 && ia < n ? ia : NaN, hov === null ? NaN : tg.indexOf(hov));
    else if ((ia < 0 && ib < 0) || (ia >= n && ib >= n)) fx.range(NaN, NaN, NaN, NaN);
    else fx.range(clamp(ia, 0, n - 1), clamp(ib, 0, n - 1), NaN, NaN);
    tg.cells().forEach(btn => { const v = +btn.dataset.v, on = picking ? v === a : v >= a && v <= b; btn.setAttribute('aria-selected', String(on)); });
    out.textContent = picking ? `从 ${a} 年开始，再点一下结束那年` : `${a} – ${b} 年，共 ${b - a + 1} 年`;
  }
  const pick = v => { if (!picking) { a = v; b = null; picking = true; hov = v; } else { if (v < a) { b = a; a = v; } else b = v; picking = false; } sync(); };
  tg = makeTileGrid({ root: $('#yrGrid'), kind: 'year', base: Y - 4, focusV: a, onPick: pick, onHover: v => { hov = v; if (picking) sync(); }, onRender: () => sync() });
  sync();
  comps.push({ step(dt) { fx.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); fx.draw(cv.ctx, cv.k); } });
})();
