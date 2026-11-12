/* ================= 评分：选中的星星像被水灌满，水面从左往右流过去；鼠标停在后面的星星上，那几颗里先飘进一点雾 ================= */
(() => {
  const root = $('#rating'), cv = setup(root.querySelector('canvas')), out = $('#rateOut'), M = makeSmoke();
  const stars = [...root.querySelectorAll('[role=radio]')], N = stars.length;
  let val = 3, hov = 0, t = 0;
  const Fr = spring(0), fogs = stars.map(() => ({ ps: makeFog(7, 2.4), vis: spring(0), placed: false }));
  let placed = false, geo = [];
  function set(v, focus) {
    v = clamp(v, 1, N); if (v === val) { if (focus) stars[v - 1].focus(); return; }
    val = v; out.textContent = `${v} 星`;
    stars.forEach((b, i) => { b.setAttribute('aria-checked', String(i === v - 1)); b.tabIndex = i === v - 1 ? 0 : -1; });
    if (focus) stars[v - 1].focus();
  }
  stars.forEach((b, i) => {
    b.addEventListener('click', () => set(i + 1, false));
    b.addEventListener('pointerenter', () => { hov = i + 1; });
    b.addEventListener('pointerleave', () => { if (hov === i + 1) hov = 0; });
  });
  root.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (d !== undefined) { e.preventDefault(); set(val + d, true); }
    if (e.key === 'Home') { e.preventDefault(); set(1, true); }
    if (e.key === 'End') { e.preventDefault(); set(N, true); }
  });
  function starPath(ctx, cx, cy, R) {
    ctx.moveTo(cx, cy - R);
    for (let i = 1; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .47 : R; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath();
  }
  comps.push({
    step(dt) {
      t += dt;
      const c = cv.cv.getBoundingClientRect();
      geo = stars.map(b => { const r = b.getBoundingClientRect(); return [r.left - c.left + r.width / 2, r.top - c.top + r.height / 2 + .6]; });
      const R = 12.6, edge = i => geo[i][0] + R;
      Fr.t = edge(val - 1) + 1;
      if (!placed) { Fr.x = Fr.t; placed = true; }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) stepS(Fr, h, resp() * 1.1, Math.max(.4, zeta()));
      if (reduced) { Fr.x = Fr.t; Fr.v = 0; }
      fogs.forEach((f, i) => {   // 停在后面的星星上：那几颗里先飘进一点雾（雾＝还没定）
        f.vis.t = hov > val && i >= val && i < hov ? 1 : 0;
        for (let j = 0; j < sub; j++) stepS(f.vis, h, .3, 1);
        if (!f.placed) { for (const p of f.ps) { p.x = geo[i][0] + p.u * 6; p.y = geo[i][1] + p.v * 6; } f.placed = true; }
        fogStep(f.ps, geo[i][0], geo[i][1] + 2, 6, 5, false, t, dt);
      });
      const n = smokeK();
      if (n && Math.abs(Fr.v) > 160) { M.acc += Math.abs(Fr.v) * .02 * n * dt; while (M.acc >= 1) { M.acc -= 1; smokeEmit(M, 1, Fr.x, geo[0][1] - 12, { vx: -Fr.v * .05, vy: -20 - Math.random() * 16, jit: 10, r: 2, grow: 3.2, a: .3, life: .8, lift: 14 }); } }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv) || !geo.length) return;
      const ctx = cv.ctx, k = cv.k, R = 12.6, top = geo[0][1] - R - 2, bot = geo[0][1] + R + 2, x0 = geo[0][0] - R - 4;
      smokeDraw(M, ctx, k);
      ctx.save(); ctx.beginPath(); for (const [x, y] of geo) starPath(ctx, x, y, R); ctx.clip();
      const tilt = reduced ? 0 : clamp(Fr.v * .014 * (.3 + deformK()), -9, 9), wv = Math.sin(t * 10) * Math.min(1.5, Math.abs(Fr.v) / 120);
      ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(Fr.x + tilt, top); ctx.quadraticCurveTo(Fr.x + wv * 3, (top + bot) / 2, Fr.x - tilt, bot); ctx.lineTo(x0, bot); ctx.closePath();
      ctx.fillStyle = rgb(C.body); ctx.fill();   // 水面跑起来会往后斜，停下晃两下
      fogs.forEach(f => { if (f.vis.x > .02) fogDraw(ctx, k, f.ps, f.vis.x); });
      ctx.restore();
    },
  });
})();
