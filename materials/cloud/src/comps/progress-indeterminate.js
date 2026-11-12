/* ================= 进度条 · 不确定：不知道要多久的时候，一滴水在轨道里来回流——头先到、尾巴被拖着，到头 q 一下再折回去；
   连上了：那滴摊开，铺满整条，噗一下 ================= */
(() => {
  const el = $('#progInd'), cv = setup(el.querySelector('canvas')), btn = $('#piBtn'), label = $('#piLabel'), M = makeSmoke();
  const X0 = 20, W = 220, CY = 50 + 5, R = 6;
  const D = makeDrop(R, M); D.s.x = D.s.t = 1;
  const S = { dir: 1, done: false, fill: spring(0), t: 0 };
  dropTo(D, X0 + R, CY, true);
  btn.addEventListener('click', () => {
    if (S.done) { S.done = false; S.fill.t = 0; el.setAttribute('aria-busy', 'true'); el.removeAttribute('aria-valuenow'); label.textContent = '正在连接…'; btn.textContent = '连上了'; D.s.t = 1; return; }
    S.done = true; S.fill.t = 1; el.setAttribute('aria-busy', 'false'); el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', '100'); label.textContent = '已连接'; btn.textContent = '再来一次';
    D.s.t = 0;
    const n = smokeK(); if (n) for (let i = 0; i < 8 + Math.round(8 * n); i++) smokeEmit(M, 1, X0 + Math.random() * W, CY, { vy: -40 - Math.random() * 40, jit: 30, r: 2.8, grow: 3.5, a: .32, life: 1.1, lift: 26 });
  });
  comps.push({
    step(dt) {
      S.t += dt;
      if (!S.done && !D.moving) { S.dir *= -1; dropTo(D, S.dir > 0 ? X0 + W - R : X0 + R, CY); }   // 到头了：折回去
      if (reduced && !S.done) { const u = (Math.sin(S.t * 2) + 1) / 2; dropTo(D, X0 + R + (W - 2 * R) * u, CY, true); }
      dropStep(D, dt);
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) stepS(S.fill, h, .4, reduced ? 1 : .7);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      dropDraw(ctx, k, D);
      const f = clamp(S.fill.x, 0, 1.05);
      if (f > .01) { goo(ctx, k, true); ctx.fillStyle = rgb(C.body); rrect(ctx, X0, CY - 5, W * Math.min(1, f), 10, 5); ctx.fill(); goo(ctx, k, false); }
    },
  });
})();
