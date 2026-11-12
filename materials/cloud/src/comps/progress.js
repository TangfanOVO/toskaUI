/* ================= 进度条：前沿一直往上冒小云；到 100% 整条噗一下 ================= */
(() => {
  const el = $('#prog'), cv = setup(el.querySelector('canvas')), btn = $('#progBtn'), label = $('#plabel'), M = makeSmoke();
  const X0 = 20, W = 220, H = 10, CY = 50 + H / 2;
  const S = { v: 0, fill: spring(0), running: false, prev: 0, vel: 0, acc: 0 }, beads = makeBeads(4);
  btn.addEventListener('click', () => {
    if (S.running) return;
    S.v = 0; S.fill.x = 0; S.fill.v = 0; S.running = true; btn.textContent = '上传中…'; btn.setAttribute('aria-disabled', 'true');
  });
  comps.push({
    step(dt) {
      const n = smokeK();
      if (S.running) {
        S.v = Math.min(100, S.v + dt * (10 + Math.random() * 40) * (S.v > 85 ? .45 : 1));
        if (S.v >= 100) {
          S.running = false; btn.textContent = '再传一次'; btn.removeAttribute('aria-disabled'); label.textContent = '完成';
          if (n) for (let i = 0; i < 10 + Math.round(10 * n); i++) smokeEmit(M, 1, X0 + Math.random() * W, CY, { vy: -40 - Math.random() * 40, jit: 30, r: 2.8, grow: 3.5, a: .32, life: 1.1, lift: 26 });
        } else label.textContent = `上传中 ${Math.floor(S.v)}%`;
        if (el.getAttribute('aria-valuenow') !== String(Math.floor(S.v))) el.setAttribute('aria-valuenow', String(Math.floor(S.v)));
      }
      S.fill.t = S.v / 100 * W;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) stepS(S.fill, h, .25, .9);
      const vNow = (S.fill.x - S.prev) / Math.max(dt, 1e-3); S.prev = S.fill.x;   // 走得快的那几下，条上的水珠鼓起来
      S.acc += ((vNow - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = vNow;
      beadsStep(beads, S.acc, S.vel * 1.3, dt);
      if (S.running && n) {   // 前沿翻滚
        M.acc += 16 * n * dt;
        while (M.acc >= 1) { M.acc -= 1; smokeEmit(M, 1, X0 + S.fill.x - 2, CY + J() * 4, { vx: 8 + Math.random() * 20, vy: -14 - Math.random() * 20, r: 2.2, grow: 3.4, a: .3, life: .9, lift: 16 }); }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx;
      smokeDraw(M, ctx, cv.k);
      if (S.fill.x > .5) { goo(ctx, cv.k, true); rrect(ctx, X0, CY - H / 2, Math.max(H, S.fill.x), H, H / 2); ctx.fillStyle = rgb(C.body); ctx.fill(); beadsDraw(ctx, beads, X0 + 4, CY, X0 + S.fill.x - 6, CY, H / 2); goo(ctx, cv.k, false); }
    },
  });
})();
