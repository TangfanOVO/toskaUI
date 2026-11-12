/* ================= 提示框：一小团云从按钮顶上升起来，鼓成提示 ================= */
(() => {
  const trig = $('#tipBtn'), pop = $('#tipPop'), wrap = $('#tipwrap'), cv = setup(wrap.querySelector('canvas')), M = makeSmoke();
  const TW = 128, TH = 34, cx = 130, by = 150, cy = by - 18 - 12 - TH / 2;   // 按钮中心在画布 (130,150)
  const B = softBody(TW, TH, 10, 56);
  B.sc.x = 0; B.sc.t = 0;
  const S = { open: false, timer: 0, closing: false };
  function show() {
    if (S.open) return;
    S.open = true; S.closing = false; pop.hidden = false;
    B.sc.x = .25; B.sc.v = 0; B.sc.t = 1;
    const n = smokeK(), k = deformK();
    for (const p of B.pts) { p.d = 0; p.v = (Math.random() - .3) * 120 * k; }
    if (n) smokeEmit(M, 3, cx, by - 18, { vy: -110, jit: 20, spread: 6, r: 3.2, grow: 2.5, a: .32, life: .45, lift: 20 });
  }
  function hide() {
    clearTimeout(S.timer);
    if (!S.open) return;
    S.open = false; S.closing = true; B.sc.t = 0;
    const n = smokeK();
    if (n) smokeFromBody(M, B, cx, cy, 4 + Math.round(4 * n), () => true, { speed: 14, vy: -26, r: 5.5, grow: 2.4, a: .32, life: 1, lift: 26 });
  }
  trig.addEventListener('pointerenter', () => { clearTimeout(S.timer); S.timer = setTimeout(show, 350); });
  trig.addEventListener('pointerleave', hide);
  trig.addEventListener('focus', () => { if (trig.matches(':focus-visible')) show(); });
  trig.addEventListener('blur', hide);
  trig.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  trig.addEventListener('click', hide);
  comps.push({
    step(dt) {
      for (const p of B.pts) p.f = 0;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) {
        if (S.open) stepS(B.sc, h, .26 + (1 - F.speed) * .12, reduced ? 1 : Math.max(.3, .55 - F.bounce * .3));
        else stepS(B.sc, h, .14, 1);
        bodyStep(B, h);
      }
      if (B.sc.x < 0) { B.sc.x = 0; B.sc.v = 0; }
      const s = B.sc.x;
      pop.style.transform = `scale(${s.toFixed(4)})`;
      pop.style.opacity = clamp((s - .55) / .35, 0, 1).toFixed(3);
      if (S.closing && s < .03) { S.closing = false; pop.hidden = true; }
      smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); if (B.sc.x > .01) drawBody(cv.ctx, B, cx, cy, rgb(C.card), cv.k, cardLine()); },
  });
})();
