/* ================= 选择框 · 分组：跟普通选择框一样鼓出来、高亮块在选项之间流；分组的小标题和分隔线不算选项，
   卖完了的那一项高亮块会跳过去，点了也不选 ================= */
(() => {
  const root = $('#selectG'), btn = $('#sgBtn'), list = $('#sgList'), valEl = $('#sgVal'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const opts = [...list.querySelectorAll('[role=option]')], W = 200, ok = i => opts[i] && opts[i].getAttribute('aria-disabled') !== 'true';
  const H = () => opts.length * 32 + list.querySelectorAll('.selgl').length * 28 + list.querySelectorAll('.selsep').length * 9 + 8;
  let sel = -1;
  valEl.classList.add('ph');
  const place = () => { const r = btn.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left, r.bottom - c.top + 6]; };
  const pl = popList({ el: list, w: W, M, items: () => opts, h: H, center: () => { const [l, t] = place(); return [l + W / 2, t + pl.bl.B.h / 2]; },
    onIdx: i => { if (i >= 0) list.setAttribute('aria-activedescendant', opts[i].id); else list.removeAttribute('aria-activedescendant'); } });
  const D = makeDrop(5, M); D.s.x = D.s.t = 0; const pop = spring(1), ring = focusRing(btn, cv, { visibleOnly: true, r: 10, M });
  const next = (i, d) => { for (let j = i + d; j >= 0 && j < opts.length; j += d) if (ok(j)) return j; return i; };   // 跳过不能选的
  const first = () => next(-1, 1), last = () => next(opts.length, -1);
  function open(at) {
    if (pl.bl.open) return;
    pl.show(); btn.setAttribute('aria-expanded', 'true');
    pl.setIdx(at === 'last' ? last() : sel >= 0 ? sel : first()); list.focus({ preventScroll: true });
  }
  function close(refocus) { if (!pl.bl.open) return; pl.hide(); btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus({ preventScroll: true }); }
  function pick(i) {
    if (!ok(i)) return;
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
    const i = pl.H.idx;
    if (e.key === 'ArrowDown') { e.preventDefault(); pl.setIdx(next(i, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); pl.setIdx(next(i, -1)); }
    else if (e.key === 'Home') { e.preventDefault(); pl.setIdx(first()); }
    else if (e.key === 'End') { e.preventDefault(); pl.setIdx(last()); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) pick(i); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  });
  opts.forEach((o, i) => { o.addEventListener('pointermove', () => { if (ok(i) && pl.H.idx !== i) pl.setIdx(i); }); o.addEventListener('click', () => pick(i)); });
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

