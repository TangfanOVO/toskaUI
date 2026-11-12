/* ================= 月份选择：选中的那个月是一块实心，换月份时整块流过去，前头先到、后头跟上 ================= */
(() => {
  const root = $('#monthPicker'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), out = $('#mpOut');
  let sel = TODAY.getFullYear() * 12 + TODAY.getMonth(), tg = null;
  const fx = gridFx({ cv, M, wide: true, cells: () => (tg ? tg.cells() : []) });
  const sync = () => { if (!tg) return; tg.cells().forEach(b => { const on = +b.dataset.v === sel; b.setAttribute('aria-selected', String(on)); }); fx.single(tg.indexOf(sel)); out.textContent = `选了 ${tg.labelOf(sel)}`; };
  tg = makeTileGrid({ root: $('#mpGrid'), kind: 'month', base: TODAY.getFullYear(), focusV: sel, onPick: v => { sel = v; sync(); }, onRender: () => sync() });
  sync();
  comps.push({ step(dt) { fx.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); fx.draw(cv.ctx, cv.k); } });
})();
