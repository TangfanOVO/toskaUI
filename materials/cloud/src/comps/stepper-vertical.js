/* ================= 步骤条 · 竖着：走到下一步，水顺着竖线往下灌，灌到下一颗圆点，那颗凝成实心、q 一下；往回退，水往上收 ================= */
(() => {
  const root = $('#stepperV'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), prev = $('#svPrev'), next = $('#svNext');
  const lis = [...root.querySelectorAll('.stepsv li')], dots = lis.map(l => l.querySelector('.sdv')), N = lis.length;
  let cur = 0;
  const P = spring(0), pops = dots.map(() => spring(1)), beads = makeBeads(3);
  let vel = 0, acc = 0, pv = 0, last = 0;
  const pos = () => { const c = cv.cv.getBoundingClientRect(); return dots.map(d => { const r = d.getBoundingClientRect(); return [r.left - c.left + r.width / 2, r.top - c.top + r.height / 2]; }); };
  function go(i) {
    i = clamp(i, 0, N - 1); if (i === cur) return;
    cur = i;
    lis.forEach((l, j) => { if (j === i) l.setAttribute('aria-current', 'step'); else l.removeAttribute('aria-current'); dots[j].dataset.state = j < i ? 'done' : j === i ? 'current' : 'todo'; });
    P.t = i; if (reduced) P.x = i;
    prev.disabled = i === 0; next.disabled = i === N - 1;
    if (document.activeElement && document.activeElement.disabled) (i === 0 ? next : prev).focus();
  }
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(P, h, resp() * 1.6, Math.max(.6, zeta() + .1)); for (const p of pops) stepS(p, h, .24, Math.max(.25, zeta() * .6)); }
      const reach = Math.floor(P.x + .02);
      if (reach !== last) { if (reach > last && !reduced) { pops[reach].x = .55; pops[reach].v = 0; const n = smokeK(); if (n) { const [x, y] = pos()[reach]; smokeEmit(M, 3, x, y, { radial: 40, jit: 8, r: 2.4, grow: 3, a: .3, life: .8, lift: 8 }); } } last = reach; }   // 灌到了一颗：凝实、q 一下
      const v = (P.x - pv) / Math.max(dt, 1e-3); pv = P.x; acc += ((v - vel) / Math.max(dt, 1e-3) - acc) * .35; vel = v;
      beadsStep(beads, acc * 40, vel * 40, dt);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, ps = pos(); smokeDraw(M, ctx, k);
      ctx.strokeStyle = rgb(C.track); ctx.lineWidth = 2;
      for (let i = 0; i < N - 1; i++) { ctx.beginPath(); ctx.moveTo(ps[i][0], ps[i][1] + 17); ctx.lineTo(ps[i + 1][0], ps[i + 1][1] - 17); ctx.stroke(); }   // 还没灌到的竖线
      ctx.fillStyle = rgb(C.body); goo(ctx, k, true, 8);
      const p = clamp(P.x, 0, N - 1), i0 = Math.floor(p), u = p - i0, x = ps[0][0];
      const yEnd = i0 >= N - 1 ? ps[N - 1][1] : ps[i0][1] + (ps[i0 + 1][1] - ps[i0][1]) * u;
      if (yEnd > ps[0][1] + 1) { rrect(ctx, x - 2, ps[0][1], 4, yEnd - ps[0][1], 2); ctx.fill(); beadsDraw(ctx, beads, x, ps[0][1] + 4, x, yEnd, 2); }   // 灌下去的水
      dots.forEach((d, j) => { if (j > p + .02) return; const s = pops[j].x; ctx.beginPath(); ctx.arc(ps[j][0], ps[j][1], 14 * clamp(s, .2, 1.4), 0, TAU); ctx.fill(); });
      if (u > .05 && i0 < N - 1) { ctx.beginPath(); ctx.arc(x, yEnd, 4 + 2 * Math.min(1, Math.abs(vel)), 0, TAU); ctx.fill(); }   // 水头
      goo(ctx, k, false);
    },
  });
})();

