/* ================= 范围日历：点起点，起点凝成一滴；鼠标走到哪儿，从起点牵一根细线过去；再点终点，中间一格一格灌满 ================= */
(() => {
  const root = $('#rangeCal'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), out = $('#rcOut');
  let a = new Date(TODAY.getFullYear(), TODAY.getMonth(), Math.max(1, TODAY.getDate() - 2)), b = new Date(a.getFullYear(), a.getMonth(), Math.min(a.getDate() + 5, new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate())), hov = null, picking = false, mg = null;
  const fx = gridFx({ cv, M, R: 16, cells: () => (mg ? mg.cells() : []) });
  const fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`;
  function sync() {
    if (!mg) return;
    const n = mg.cells().length, ia = mg.indexOf(a), ib = b ? mg.indexOf(b) : NaN;
    if (picking) fx.range(NaN, NaN, ia >= 0 && ia < n ? ia : NaN, hov ? mg.indexOf(hov) : NaN);
    else if ((ia < 0 && ib < 0) || (ia >= n && ib >= n)) fx.range(NaN, NaN, NaN, NaN);
    else fx.range(clamp(ia, 0, n - 1), clamp(ib, 0, n - 1), NaN, NaN);
    mg.cells().forEach((btn, i) => {
      const d = mg.dateAt(i), on = picking ? sameDay(d, a) : (d >= a && d <= b);
      btn.parentElement.setAttribute('aria-selected', String(!!on)); btn.setAttribute('aria-label', btn.dataset.base + (on ? '，已选中' : ''));
    });
    out.textContent = picking ? `从 ${fmt(a)} 开始，再点一下结束那天` : `${fmt(a)} – ${fmt(b)}，共 ${Math.round((b - a) / 864e5) + 1} 天`;
  }
  function pick(d) {
    if (!picking) { a = d; b = null; picking = true; hov = d; }
    else { if (d < a) { b = a; a = d; } else b = d; picking = false; }
    sync();
  }
  mg = makeMonthGrid({ root: $('#rcGrid'), view: TODAY, focusOf: () => a, onPick: pick, onHover: d => { hov = d; if (picking) sync(); }, onRender: () => sync() });
  sync();
  comps.push({
    step(dt) { fx.step(dt); smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); fx.draw(cv.ctx, cv.k); },
  });
})();
