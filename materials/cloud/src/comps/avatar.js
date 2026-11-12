/* ================= 头像：加载时一团雾在圈里转，加载好了凝成实心；鼠标停上去，那颗往上浮一点、顶上冒一小团 ================= */
(() => {
  const root = $('#avatars'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), btn = $('#avReload');
  const avs = [...root.querySelectorAll('.av')].map(el => { const it = makeCondense(14, 3); it.el = el; it.c.x = it.c.t = 1; it.vis.x = it.vis.t = .1; it.lift = spring(0); it.on = true; return it; });
  let t = 0, timers = [];
  avs.forEach(it => {
    it.el.addEventListener('pointerenter', () => { it.lift.t = -5; const n = smokeK(); if (n && it.on) smokeEmit(M, 2, it.x, it.y - 24, { vy: -30, jit: 12, r: 2.6, grow: 3, a: .3, life: .9, lift: 18 }); });
    it.el.addEventListener('pointerleave', () => { it.lift.t = 0; });
  });
  btn.addEventListener('click', () => {   // 重新加载：先散掉，再一颗一颗凝回来
    timers.forEach(clearTimeout); timers = [];
    avs.forEach((it, i) => {
      if (it.on) { it.on = false; condenseOff(it, M, it.x, it.y, i > 0); }
      timers.push(setTimeout(() => { it.on = true; condenseOn(it, it.x, it.y, 26); }, reduced ? 0 : 520 + i * 180));
    });
  });
  comps.push({
    step(dt) {
      t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (const it of avs) {
        for (let i = 0; i < sub; i++) stepS(it.lift, h, .3, Math.max(.35, zeta()));
        const ty = reduced ? 0 : it.lift.x; it.el.style.transform = Math.abs(ty) > .05 ? `translateY(${ty.toFixed(2)}px)` : '';
        const [x, y] = centerIn(it.el, cv); it.x = x; it.y = y;
        condenseStep(it, x, y, 14, t, dt);
        it.el.style.opacity = clamp(it.c.x * 1.4 - .2, 0, 1).toFixed(3);
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      for (const it of avs) {
        fogDraw(ctx, k, it.ps, it.vis.x);
        if (it.c.x > .01) {
          const r = 23 * Math.max(.2, it.c.x), rx = r * it.cs.x, ry = r * (2 - it.cs.x);
          ctx.beginPath(); ctx.ellipse(it.x, it.y, rx + 3, ry + 3, 0, 0, TAU); ctx.fillStyle = rgb(C.bg); ctx.fill();   // 一圈底色，把叠在下面那颗分开
          ctx.beginPath(); ctx.ellipse(it.x, it.y, rx, ry, 0, 0, TAU); ctx.fillStyle = rgb(C.body); ctx.fill();
        }
      }
    },
  });
})();
