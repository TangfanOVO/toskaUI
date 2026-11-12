/* ================= 弹出面板 ================= */
(() => {
  const trig = $('#trigger'), panel = $('#panel'), wrap = $('#popwrap'), cv = setup(wrap.querySelector('.popfx'));
  const PW = 300, PH = 104, cx = 230, cy = 140 + PH / 2;
  const B = softBody(PW, PH, 16, 128), M = makeSmoke(), hov = hovering(panel);
  B.sc.x = 0; B.sc.t = 0;
  const S = { open: false, t: 0, closing: false };
  function open() {
    S.open = true; S.closing = false; S.t = 0;
    trig.setAttribute('aria-expanded', 'true'); panel.hidden = false; requestAnimationFrame(() => panel.focus({ preventScroll: true }));
    B.sc.x = .3; B.sc.v = 0; B.sc.t = 1; B.halo.x = 1; B.halo.t = 0;   // 刚出来时边是晕开的，再慢慢收清楚
    const k = deformK(), n = smokeK();
    const P = B.pts, n0 = P.length, lumps = Array.from({ length: 7 }, () => [Math.random() * n0, (Math.random() < .7 ? 1 : -.6) * (160 + Math.random() * 200) * k]);
    P.forEach((p, i) => {
      p.d = 0; p.v = 40 * k;
      for (const [c, a] of lumps) { let di = Math.abs(i - c); di = Math.min(di, n0 - di); p.v += a * Math.exp(-((di / 4) ** 2)); }
    });
    if (n) {   // 一圈雾跟着涨开
      smokeFromBody(M, B, cx, cy, Math.round(18 + 22 * n), () => true, { speed: 70 + 50 * n, r: 6, grow: 4, a: .24, life: 1.5, lift: 16 });
      smokeFromBody(M, B, cx, cy, Math.round(20 * n), () => true, { kind: 'spore', speed: 90, r: .9, a: .35, life: 1.2, lift: 10 });
    }
  }
  function close(refocus) {
    if (!S.open) return;
    S.open = false; S.closing = true;
    trig.setAttribute('aria-expanded', 'false');
    B.sc.t = 0; B.halo.t = 1;
    const n = smokeK();
    if (n) {   // 关掉：整块化成烟往上散
      smokeFromBody(M, B, cx, cy, Math.round(24 + 26 * n), () => true, { speed: 40 + 30 * n, r: 7, grow: 4, a: .26, life: 1.8, lift: 30 });
      for (let i = 0; i < Math.round(26 * n) + 6; i++) smokeEmit(M, 1, cx + J() * PW * .8, cy + J() * PH * .7, { radial: 30, vy: -20, r: 8, grow: 3.5, a: .24, life: 1.8, lift: 34 });
    }
    if (refocus) trig.focus();
  }
  trig.addEventListener('click', () => (S.open ? close() : open()));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.open) close(true); });
  document.addEventListener('pointerdown', e => { if (S.open && !wrap.contains(e.target)) close(); });
  panel.addEventListener('pointerdown', e => {
    const r = cv.cv.getBoundingClientRect(), [lx, ly] = toLocal(B, cx, cy, e.clientX - r.left, e.clientY - r.top);
    forEachNear(B, lx, ly, 70, (p, f) => { p.v -= f * 120 * deformK(); });
    B.sc.v -= .6; B.halo.x = Math.max(B.halo.x, .5);
    const n = smokeK();
    if (n) smokeFromBody(M, B, cx, cy, 3 + Math.round(4 * n), p => Math.hypot(p.bx - lx, p.by - ly) < 80, { speed: 40, r: 5, grow: 4, a: .22, life: 1.4, lift: 22 });
  });

  comps.push({
    step(dt) {
      for (const p of B.pts) p.f = 0;
      if (S.open && ptr.on) {
        const r = cv.cv.getBoundingClientRect(), [lx, ly] = toLocal(B, cx, cy, ptr.x - r.left, ptr.y - r.top);
        forEachNear(B, lx, ly, 46, (p, f, out) => { p.f += f * 7 * deformK() * (out > 0 ? 1 : .4); });
      }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) {
        if (S.open) stepS(B.sc, h, .3 + (1 - F.speed) * .15, reduced ? 1 : Math.max(.25, .55 - F.bounce * .35));
        else stepS(B.sc, h, .2, 1);
        bodyStep(B, h);
      }
      if (B.sc.x < 0) { B.sc.x = 0; B.sc.v = 0; }
      if (S.open && B.sc.x > .9) bodySwipe(B, cx, cy, cv.cv, M, PW / 2, PH / 2, 16);
      const n = smokeK();
      if (S.open && n) {
        S.t += dt;
        // 刚打开的头一秒边上还在冒雾；之后顶上偶尔飘一缕（鼠标停在面板上会多一点）
        const rate = 9 * n * Math.exp(-S.t * 2.2) + (hov.on ? 2.4 : .9) * n;
        M.acc += rate * dt;
        while (M.acc >= 1) {
          M.acc -= 1;
          const early = S.t < 1;
          smokeFromBody(M, B, cx, cy, early ? 2 : 1, p => early || p.ny < -.6, early
            ? { speed: 18, r: 5, grow: 4, a: .2, life: 1.4, lift: 18 }
            : { speed: 6, vy: -12, r: 3.4, grow: 4.5, a: .15, life: 2.2, lift: 16 });
        }
      }
      const s = B.sc.x;
      panel.style.transform = `scale(${s.toFixed(4)})`;
      panel.style.opacity = clamp((s - .55) / .35, 0, 1).toFixed(3);
      if (S.closing && s < .03) { S.closing = false; panel.hidden = true; B.halo.t = 0; }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      smokeDraw(M, cv.ctx, cv.k);
      if (B.sc.x > .01) drawBody(cv.ctx, B, cx, cy, rgb(C.card), cv.k, cardLine());
    },
  });
})();
