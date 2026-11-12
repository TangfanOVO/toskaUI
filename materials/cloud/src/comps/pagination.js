/* ================= 分页：当前页那块化开，贴着页码流过去 ================= */
(() => {
  const nav = $('#pager'), cv = setup(nav.querySelector('canvas')), nums = [...nav.querySelectorAll('.pgnum')], M = makeSmoke(), ps = makeFog(24, 3.4);
  const prev = nav.querySelector('[data-nav="-1"]'), next = nav.querySelector('[data-nav="1"]');
  let cur = 0, t = 0, placed = false;
  const S = { c: spring(1), cs: spring(1), travel: false };
  function go(i) {
    i = clamp(i, 0, nums.length - 1);
    if (i === cur) return;
    const dir = Math.sign(i - cur), n = smokeK();
    if (!reduced) {
      S.travel = true; S.c.t = 0; S.c.x = 0;
      for (const p of ps) { p.vx += dir * (20 + Math.random() * 80); p.vy += J() * 30; }
      if (n) { const [x, y] = centerIn(nums[cur], cv); smokeEmit(M, 2, x - dir * 12, y, { vx: -dir * 50, jit: 16, spreadY: 10, r: 3, grow: 3.4, a: .28, life: .9, lift: 6 }); }
    }
    cur = i;
    nums.forEach((b, j) => { if (j === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const a = document.activeElement;
    prev.disabled = cur === 0; next.disabled = cur === nums.length - 1;
    if ((a === prev && prev.disabled) || (a === next && next.disabled)) nums[cur].focus();
  }
  nums.forEach((b, j) => b.addEventListener('click', () => go(j)));
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  comps.push({
    step(dt) {
      t += dt;
      const [x, y] = centerIn(nums[cur], cv); S.x = x; S.y = y;
      if (!placed) { for (const p of ps) { p.x = x + p.u * 10; p.y = y + p.v * 10; } placed = true; }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(S.c, h, S.travel ? .12 : .14, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7)); }
      const d = fogStep(ps, x, y, 10, S.travel ? 6 : 10, S.travel, t, dt, true);
      if (S.travel) exhaustFrom(M, ps, dt, smokeK());
      if (S.travel && d < 2) { S.travel = false; S.c.t = 1; S.cs.x = .84; S.cs.v = 0; S.cs.t = 1; }
      if (reduced) { S.travel = false; S.c.x = S.c.t = 1; }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      fogDraw(ctx, k, ps, .1 + .9 * (1 - S.c.x));
      if (S.c.x > .01) { const w = 32 * S.cs.x, h = 32 * (2 - S.cs.x); ctx.globalAlpha = S.c.x; rrect(ctx, S.x - w / 2, S.y - h / 2, w, h, 9); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; }
    },
  });
})();
