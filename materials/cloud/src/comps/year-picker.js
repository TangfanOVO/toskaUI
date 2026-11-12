/* ================= 年份选择：十二年一页，选中的那年是一块实心，换年份时整块流过去 ================= */
(() => {
  const root = $('#yearPicker'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), out = $('#ypOut');
  let sel = TODAY.getFullYear(), tg = null;
  const fx = gridFx({ cv, M, wide: true, cells: () => (tg ? tg.cells() : []) });
  const sync = () => { if (!tg) return; tg.cells().forEach(b => b.setAttribute('aria-selected', String(+b.dataset.v === sel))); fx.single(tg.indexOf(sel)); out.textContent = `选了 ${sel} 年`; };
  tg = makeTileGrid({ root: $('#ypGrid'), kind: 'year', base: sel - 4, focusV: sel, onPick: v => { sel = v; sync(); }, onRender: () => sync() });
  sync();
  comps.push({ step(dt) { fx.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); fx.draw(cv.ctx, cv.k); } });
})();
