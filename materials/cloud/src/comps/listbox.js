/* ================= 列表框：选中的那一项是一块实心，换选项时上下流过去，前头先到、后头跟上 ================= */
(() => {
  const ul = $('#listbox'), cv = setup($('#listboxWrap').querySelector('canvas')), opts = [...ul.querySelectorAll('[role=option]')], M = makeSmoke();
  const S = makeSlab(); let sel = opts.findIndex(o => o.getAttribute('aria-selected') === 'true');
  function pick(i) {
    i = clamp(i, 0, opts.length - 1); sel = i;
    opts.forEach((o, j) => o.setAttribute('aria-selected', String(j === i)));
    ul.setAttribute('aria-activedescendant', opts[i].id);
  }
  opts.forEach((o, i) => o.addEventListener('click', () => { pick(i); ul.focus(); }));
  ul.addEventListener('keydown', e => {
    const m = { ArrowDown: sel + 1, ArrowUp: sel - 1, Home: 0, End: opts.length - 1 }[e.key];
    if (m === undefined) return; e.preventDefault(); if (!e.repeat || m !== sel) pick(m);
  });
  comps.push({
    step(dt) {
      const r = opts[sel].getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
      slabAim(S, r.top - c.top, r.bottom - c.top); S.x0 = r.left - c.left; S.x1 = r.right - c.left; slabStep(S, dt);
      const n = smokeK(), v = (S.a.v + S.b.v) / 2;
      if (n && Math.abs(v) > 420) { M.acc += Math.abs(v) * .012 * n * dt; while (M.acc >= 1) { M.acc -= 1; const y = v > 0 ? Math.min(S.a.x, S.b.x) : Math.max(S.a.x, S.b.x); smokeEmit(M, 1, S.x1 + 4, y, { vx: 20, vy: -v * .1, jit: 10, r: 2, grow: 3, a: .28, life: .7, lift: 6 }); } }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      const a = Math.min(S.a.x, S.b.x), b = Math.max(S.a.x, S.b.x), L = Math.max(6, b - a), w = (S.x1 - S.x0) * clamp(Math.sqrt(32 / L), .82, 1);
      goo(ctx, k, true, 8); rrect(ctx, S.x0 + (S.x1 - S.x0 - w) / 2, a, w, L, 8); ctx.fillStyle = rgb(C.body); ctx.fill(); goo(ctx, k, false);
    },
  });
})();
