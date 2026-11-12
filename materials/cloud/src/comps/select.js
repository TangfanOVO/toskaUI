/* ================= 选择框：列表 q 弹鼓出来，高亮块在选项之间流；选中的那一项化成一滴，流回按钮里，按钮上的字 q 一下 ================= */
(() => {
  const root = $('#select'), btn = $('#selBtn'), list = $('#selList'), valEl = $('#selVal'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const opts = [...list.querySelectorAll('[role=option]')], W = 200;
  let sel = -1;
  valEl.classList.add('ph');
  const place = () => { const r = btn.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left, r.bottom - c.top + 6]; };
  const pl = popList({ el: list, w: W, M, items: () => opts, h: () => opts.length * 32 + 8, center: () => { const [l, t] = place(); return [l + W / 2, t + pl.bl.B.h / 2]; },
    onIdx: i => { if (i >= 0) list.setAttribute('aria-activedescendant', opts[i].id); else list.removeAttribute('aria-activedescendant'); } });
  const D = makeDrop(5, M); D.s.x = D.s.t = 0; const pop = spring(1), ring = focusRing(btn, cv, { visibleOnly: true, r: 10, M });
  function open(at) {
    if (pl.bl.open) return;
    pl.show(); btn.setAttribute('aria-expanded', 'true');
    pl.setIdx(at === 'last' ? opts.length - 1 : sel >= 0 ? sel : 0); list.focus({ preventScroll: true });
  }
  function close(refocus) { if (!pl.bl.open) return; pl.hide(); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus({ preventScroll: true }); }
  function pick(i) {
    const [ox, oy] = pl.optionPoint(i);
    sel = i; opts.forEach((o, j) => o.setAttribute('aria-selected', String(j === i)));
    valEl.textContent = opts[i].firstChild.textContent; valEl.classList.remove('ph');
    close(true);
    const r = valEl.getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
    if (!reduced) { dropTo(D, ox, oy, true); D.s.x = 1; D.s.t = 1; dropTo(D, r.left - c.left + 10, r.top - c.top + r.height / 2); D.arrive = () => { pop.x = .8; pop.v = 0; }; }
  }
  btn.addEventListener('click', () => (pl.bl.open ? close(false) : open()));
  btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(e.key === 'ArrowUp' ? 'last' : null); } });
  list.addEventListener('keydown', e => {
    const n = opts.length, i = pl.H.idx;
    if (e.key === 'ArrowDown') { e.preventDefault(); pl.setIdx(Math.min(n - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); pl.setIdx(Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); pl.setIdx(0); }
    else if (e.key === 'End') { e.preventDefault(); pl.setIdx(n - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) pick(i); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  });
  opts.forEach((o, i) => { o.addEventListener('pointermove', () => { if (pl.H.idx !== i) pl.setIdx(i); }); o.addEventListener('click', () => pick(i)); });
  document.addEventListener('pointerdown', e => { if (pl.bl.open && !root.contains(e.target)) close(false); });
  comps.push({
    step(dt) {
      pl.step(dt); dropStep(D, dt); ring.step(dt);
      if (D.s.t === 1 && D.placed && !D.moving && D.popped) { D.s.t = 0; if (D.arrive) { D.arrive(); D.arrive = null; } }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) stepS(pop, h, .22, Math.max(.25, zeta() * .6));
      const s = reduced ? 1 : pop.x; valEl.style.transform = Math.abs(s - 1) > .002 ? `scale(${s.toFixed(4)})` : '';
      smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k); ring.draw(ctx, k); pl.draw(ctx, k); dropDraw(ctx, k, D); },
  });
})();
