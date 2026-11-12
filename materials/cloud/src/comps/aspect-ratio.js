/* ================= 宽高比：框里几朵云慢慢飘；换比例时框的高度带一点回弹，云跟着上下晃 ================= */
(() => {
  const box = $('#arbox'), cv = setup(box.querySelector('canvas')), btns = [...document.querySelectorAll('#aspect .arbtns button')];
  const H = spring(0); let ratio = 1.7778, placed = false, t = 0;
  const R = rng(7), BUMP = [.55, .85, 1.1, .95, .7, .5];   // 一朵云：上面一排鼓包，中间高两头低，底下平
  const clouds = Array.from({ length: 4 }, (_, i) => ({ x: (i + R() * .6) / 4, y: .28 + R() * .45, s: .6 + R() * .5, v: .01 + R() * .016,
    puffs: [...BUMP.map((r, j) => ({ dx: (j - 2.5) * .62, dy: -r * .38, r, k: (R() * 3) | 0, ph: R() * TAU })), ...[-1.1, 0, 1.1].map(dx => ({ dx, dy: .22, r: .62, k: (R() * 3) | 0, ph: R() * TAU }))] }));
  btns.forEach(b => b.addEventListener('click', () => { ratio = +b.dataset.r; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  comps.push({
    step(dt) {
      t += dt;
      const w = box.clientWidth; H.t = w / ratio;
      if (!placed && w) { H.x = H.t; placed = true; box.style.aspectRatio = 'auto'; }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) stepS(H, h, resp() * 1.2, Math.max(.35, zeta()));
      if (reduced) H.x = H.t;
      box.style.height = Math.max(20, H.x).toFixed(1) + 'px';
      for (const c of clouds) { c.x += c.v * dt * (reduced ? 0 : 1); if (c.x > 1.25) c.x = -.25; }
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, W = cv.W, Hh = cv.H, u = Math.min(W, Hh) * .075;
      ctx.fillStyle = rgb(C.body); goo(ctx, k, true, 10);
      for (const c of clouds) {   // 每朵云是几个圆鼓包，软边把它们连成一整朵实心云，边缘慢慢起伏
        ctx.beginPath();
        for (const p of c.puffs) {
          const r = u * c.s * p.r * 1.05 * (1 + Math.sin(t * .8 + p.ph) * .06);
          const x = c.x * W + p.dx * u * c.s * 1.6, y = c.y * Hh + p.dy * u * c.s * 1.6 + Math.sin(t * .5 + c.v * 300) * u * .15;
          ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
        }
        ctx.fill();
      }
      goo(ctx, k, false);
    },
  });
})();
