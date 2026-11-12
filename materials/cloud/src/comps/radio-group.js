/* ================= 单选组：选中的圆点是一团雾，换选项时飘过去 ================= */
(() => {
  const group = $('#radios'), cv = setup(group.querySelector('canvas')), radios = [...group.querySelectorAll('[role=radio]')];
  const M = makeSmoke(), ps = makeFog(22, 2.3);
  let sel = Math.max(0, radios.findIndex(r => r.getAttribute('aria-checked') === 'true')), hover = -1, placed = false;
  const S = { c: spring(1), cs: spring(1), travel: false, t: 0, dir: 1, y0: 0 };
  function select(i, focus) {
    if (focus) radios[i].focus();
    if (i === sel) return;
    S.dir = i > sel ? 1 : -1;
    const n = smokeK(), [ox, oy] = centerIn(radios[sel], cv);
    if (!reduced) {
      S.travel = true; S.c.t = 0; S.c.x = 0; S.y0 = oy;
      for (const p of ps) { p.vy += S.dir * (15 + Math.random() * 60); p.vx -= 10 + Math.random() * 30; }
      if (n) smokeEmit(M, 2 + Math.round(2 * n), ox, oy, { vy: -S.dir * 50, jit: 20, spread: 6, r: 2.2, grow: 3.5, a: .28, life: .9, lift: 4 });
    }
    sel = i;
    radios.forEach((r, j) => { r.setAttribute('aria-checked', String(j === i)); r.tabIndex = j === i ? 0 : -1; });
  }
  radios.forEach((r, i) => {
    r.addEventListener('click', () => select(i));
    r.addEventListener('keydown', e => {
      const n = radios.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
    });
    const row = r.closest('label');
    row.addEventListener('pointerenter', () => { hover = i; });
    row.addEventListener('pointerleave', () => { if (hover === i) hover = -1; });
  });
  comps.push({
    step(dt) {
      S.t += dt;
      const [tx, ty] = centerIn(radios[sel], cv);
      if (!placed) { for (const p of ps) { p.x = tx + p.u * 3.6; p.y = ty + p.v * 3.6; } placed = true; }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(S.c, h, S.travel ? .12 : .16, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7)); }
      // 飘的路上往左绕开，不压在中间那个空心圈上
      let ax = 0;
      if (S.travel) {   // 按竖直方向走了多少，决定往左绕多远：两头是 0，中间最远
        let my = 0; for (const p of ps) my += p.y; my /= ps.length;
        const prog = clamp(1 - Math.abs(my - ty) / Math.max(1, Math.abs(S.y0 - ty)), 0, 1);
        ax = -16 * Math.sin(Math.PI * prog);
      }
      const d = fogStep(ps, tx + ax, ty, 3.6, 3.6, S.travel, S.t, dt);
      const n = smokeK();
      if (S.travel) exhaustFrom(M, ps, dt, n);
      if (S.travel && d < 1.5) { S.travel = false; S.c.t = 1; S.cs.x = .8; S.cs.v = 0; S.cs.t = 1; }
      if (reduced) { S.travel = false; S.c.x = S.c.t = 1; }
      smokeStep(M, dt);
      S.x = tx; S.y = ty;
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      fogDraw(ctx, k, ps, .1 + .9 * (1 - S.c.x));
      if (S.c.x > .01) {
        ctx.globalAlpha = S.c.x;
        ctx.beginPath(); ctx.ellipse(S.x, S.y, 5 * S.cs.x, 5 * (2 - S.cs.x), 0, 0, TAU); ctx.fillStyle = rgb(C.body); ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
  });
})();
