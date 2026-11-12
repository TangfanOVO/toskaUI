/* ================= 切换组 ================= */
(() => {
  const g = $('#tgroup'), cv = setup(g.querySelector('canvas')), M = makeSmoke();
  const items = [...g.querySelectorAll('button')].map(b => {
    const it = makeCondense(18, 3); it.b = b; it.on = b.getAttribute('aria-pressed') === 'true';
    it.c.x = it.c.t = it.on ? 1 : 0; it.vis.x = it.vis.t = it.on ? .1 : 0; return it;
  });
  let t = 0;
  items.forEach(it => it.b.addEventListener('click', () => {
    const [x, y] = centerIn(it.b, cv);
    it.on = !it.on; it.b.setAttribute('aria-pressed', String(it.on));
    if (it.on) condenseOn(it, x, y, 18); else condenseOff(it, M, x, y);
  }));
  comps.push({
    step(dt) { t += dt; for (const it of items) { const [x, y] = centerIn(it.b, cv); it.x = x; it.y = y; condenseStep(it, x, y, 10, t, dt); } smokeStep(M, dt); },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      for (const it of items) {
        fogDraw(ctx, k, it.ps, it.vis.x);
        if (it.c.x > .01) { const w = 36 * it.cs.x, h = 36 * (2 - it.cs.x); ctx.globalAlpha = it.c.x; rrect(ctx, it.x - w / 2, it.y - h / 2, w, h, 9); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; }
      }
    },
  });
})();
