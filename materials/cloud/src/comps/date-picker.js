/* ================= 日期选择：日历 q 弹鼓出来；点一天，那天化成一滴流回框里，框里的年月日一格一格 q 一下；框里改了日期，日历上的那滴跟着流过去 ================= */
(() => {
  const root = $('#datePicker'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), btn = $('#dpBtn'), pop = $('#dpPop');
  const els = [...$('#dpBox').querySelectorAll('span:not(.sl)')];
  let sel = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 3), mg = null;
  const f = segField({ box: $('#dpBox'), cv, M, segs: dateSegs(els, sel).map(s => ({ ...s, ph: s.label === '年' ? '––––' : '––' })),
    onChange: ss => { const d = segDate(ss); if (d) { sel = d; if (mg) { mg.show(d); sync(); } } } });
  const fx = gridFx({ cv, M, ink: 'bg', R: 15, cells: () => (mg ? mg.cells() : []) });
  const D = makeDrop(6, M); D.s.x = D.s.t = 0;
  const center = () => { const r = $('#dpBox').getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left + 150, r.bottom - c.top + 8 + 169]; };
  const bl = makeBloom({ w: 300, h: 338, r: 16, n: 140, M, el: pop, center, base: '' });
  const sync = () => { if (!mg) return; const i = mg.indexOf(sel); mg.cells().forEach((b, j) => { const on = j === i; b.parentElement.setAttribute('aria-selected', String(on)); b.setAttribute('aria-label', b.dataset.base + (on ? '，已选中' : '')); }); fx.single(bl.open ? i : -1); };
  mg = makeMonthGrid({ root: $('#dpGrid'), view: sel, focusOf: () => sel, onRender: () => sync(),
    onPick: d => {
      const i = mg.indexOf(d), cell = mg.cells()[i], cr = cell.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(), br = $('#dpBox').getBoundingClientRect();
      sel = d; f.setAll([d.getFullYear(), d.getMonth() + 1, d.getDate()], true); sync();
      if (!reduced) { dropTo(D, cr.left - c.left + cr.width / 2, cr.top - c.top + cr.height / 2, true); D.s.x = 1; D.s.t = 1; dropTo(D, br.left - c.left + br.width / 2, br.top - c.top + br.height / 2); }   // 选中的那天化成一滴，流回框里
      close(true);
    } });
  function open() { if (bl.open) return; mg.show(sel); bl.show(); btn.setAttribute('aria-expanded', 'true'); sync(); requestAnimationFrame(() => mg.focus()); }
  function close(refocus) { if (!bl.open) return; bl.hide(); fx.single(-1); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus({ preventScroll: true }); }
  btn.addEventListener('click', () => (bl.open ? close(false) : open()));
  pop.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(true); } });
  root.addEventListener('focusout', e => { if (bl.open && e.relatedTarget && !root.contains(e.relatedTarget)) close(false); });
  document.addEventListener('pointerdown', e => { if (bl.open && !root.contains(e.target)) close(false); });
  comps.push({
    step(dt) { f.step(dt); bl.step(dt); fx.step(dt); dropStep(D, dt); if (D.s.t === 1 && D.placed && !D.moving && D.popped) D.s.t = 0; smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k); f.draw(ctx, k); bl.draw(ctx, k); if (bl.B.sc.x > .6) fx.draw(ctx, k); dropDraw(ctx, k, D); },
  });
})();
