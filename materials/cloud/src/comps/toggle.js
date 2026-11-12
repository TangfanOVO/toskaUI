/* ================= 切换按钮：按下时四周的云聚过来凝成实心底；再按散成小云飘走 ================= */
(() => {
  const wrap = $('#toggleWrap'), b = $('#tgl'), cv = setup(wrap.querySelector('canvas')), M = makeSmoke();
  const it = makeCondense(20, 3.4); let t = 0;
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true', [x, y] = centerIn(b, cv);
    b.setAttribute('aria-pressed', String(on));
    if (on) condenseOn(it, x, y, 26); else condenseOff(it, M, x, y);
  });
  comps.push({
    step(dt) { t += dt; const [x, y] = centerIn(b, cv); it.x = x; it.y = y; it.w = b.offsetWidth; it.h = b.offsetHeight; condenseStep(it, x, y, 12, t, dt); smokeStep(M, dt); },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k); fogDraw(ctx, k, it.ps, it.vis.x);
      if (it.c.x > .01) { const w = it.w * it.cs.x, h = it.h * (2 - it.cs.x); ctx.globalAlpha = it.c.x; rrect(ctx, it.x - w / 2, it.y - h / 2, w, h, 9); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; }
    },
  });
})();
