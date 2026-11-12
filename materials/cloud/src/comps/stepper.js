/* ================= 步骤条：连线像水往前流，流到了下一颗点凝起来 ================= */
(() => {
  const root = $('#stepper'), cv = setup(root.querySelector('canvas')), lis = [...root.querySelectorAll('.steps li')], dots = lis.map(li => li.querySelector('.sdot'));
  const prevB = $('#stepPrev'), nextB = $('#stepNext'), M = makeSmoke();
  let cur = 0, t = 0;
  const D = dots.map((d, i) => { const it = makeCondense(16, 2.8); it.c.x = it.c.t = i <= cur ? 1 : 0; it.vis.x = it.vis.t = i <= cur ? .1 : 0; it.mark = 0; return it; });
  const L = [0, 1].map(() => ({ f: spring(0), beads: makeBeads(3), prev: 0, vel: 0, acc: 0 }));
  function render() {
    dots.forEach((d, i) => { d.dataset.state = i < cur ? 'done' : i === cur ? 'current' : 'todo'; });
    lis.forEach((li, i) => { if (i === cur) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    const a = document.activeElement;
    prevB.disabled = cur === 0; nextB.disabled = cur === dots.length - 1;
    if (a === prevB && prevB.disabled) nextB.focus();
    if (a === nextB && nextB.disabled) prevB.focus();
  }
  nextB.addEventListener('click', () => {
    if (cur >= dots.length - 1) return;
    L[cur].f.t = 1;
    cur++; render();
    if (reduced) { L[cur - 1].f.x = 1; D[cur].c.x = D[cur].c.t = 1; }
  });
  prevB.addEventListener('click', () => {
    if (cur <= 0) return;
    const [x, y] = centerIn(dots[cur], cv);
    condenseOff(D[cur], M, x, y);
    L[cur - 1].f.t = 0; D[cur - 1].mark = 0;
    cur--; render();
  });
  comps.push({
    step(dt) {
      t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, P = dots.map(d => centerIn(d, cv));
      for (let i = 0; i < L.length; i++) {
        const l = L[i];
        for (let j = 0; j < sub; j++) stepS(l.f, h, resp() * 1.3, Math.max(.5, zeta()));
        const len = Math.max(0, (P[i + 1][0] - 18) - (P[i][0] + 18)) * clamp(l.f.x, 0, 1);
        const v = (len - l.prev) / Math.max(dt, 1e-3); l.prev = len; l.len = len;
        l.acc += ((v - l.vel) / Math.max(dt, 1e-3) - l.acc) * .35; l.vel = v;
        beadsStep(l.beads, l.acc, l.vel, dt);
      }
      for (let i = 1; i <= cur; i++) {   // 线流到了：那颗点从线头那边凝起来（连点几次也不会漏）
        const it = D[i];
        if (L[i - 1].f.x > .9 && it.c.t === 0 && !it.travel) { const [x, y] = P[i]; condenseOn(it, x - 10, y, 12); }
      }
      D.forEach((it, i) => {
        const [x, y] = P[i]; it.x = x; it.y = y;
        condenseStep(it, x, y, 8, t, dt);
        it.mark = i < cur ? Math.min(1, it.mark + dt / .22) : 0;
      });
      smokeStep(M, dt);
      this.P = P;
    },
    draw() {
      if (!clear(cv) || !this.P) return;
      const ctx = cv.ctx, k = cv.k, P = this.P;
      smokeDraw(M, ctx, k);
      for (let i = 0; i < L.length; i++) {
        const x0 = P[i][0] + 18, x1 = P[i + 1][0] - 18, y = P[i][1];
        rrect(ctx, x0, y - 1.5, x1 - x0, 3, 1.5); ctx.fillStyle = rgb(C.track); ctx.fill();
        if (L[i].len > .5) { goo(ctx, k, true); rrect(ctx, x0, y - 1.5, Math.max(3, L[i].len), 3, 1.5); ctx.fillStyle = rgb(C.body); ctx.fill(); beadsDraw(ctx, L[i].beads, x0, y, x0 + L[i].len, y, 1.5, .7); goo(ctx, k, false); }
      }
      D.forEach(it => {
        fogDraw(ctx, k, it.ps, it.vis.x);
        if (it.c.x > .01) {
          ctx.globalAlpha = it.c.x; ctx.beginPath(); ctx.ellipse(it.x, it.y, 14 * it.cs.x, 14 * (2 - it.cs.x), 0, 0, TAU); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1;
          if (it.mark > 0) {   // 做完的那几步：画一个对勾（用底色）
            const Q = [[-5, .3], [-1.6, 3.8], [5.2, -3.6]], l1 = Math.hypot(3.4, 3.5), l2 = Math.hypot(6.8, 7.4); let len = it.mark * (l1 + l2);
            ctx.beginPath(); ctx.moveTo(it.x + Q[0][0], it.y + Q[0][1]);
            if (len <= l1) ctx.lineTo(it.x + Q[0][0] + 3.4 * len / l1, it.y + Q[0][1] + 3.5 * len / l1);
            else { ctx.lineTo(it.x + Q[1][0], it.y + Q[1][1]); const f = (len - l1) / l2; ctx.lineTo(it.x + Q[1][0] + 6.8 * f, it.y + Q[1][1] - 7.4 * f); }
            ctx.strokeStyle = rgb(C.bodyInk); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
          }
        }
      });
    },
  });
  render();
})();
