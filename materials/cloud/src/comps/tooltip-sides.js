/* ================= 提示框 · 四个方向：一小团云从按钮朝那一边飞出去，鼓成提示；挪开就化成小云散掉 ================= */
(() => {
  const root = $('#tipx'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), TW = 112, TH = 32, GAP = 12;
  const DIR = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  const items = [...root.querySelectorAll('button[data-side]')].map(trig => {
    const side = trig.dataset.side, pop = document.getElementById(trig.getAttribute('aria-describedby'));
    const it = { trig, pop, side, d: DIR[side], B: softBody(TW, TH, 10, 56), open: false, closing: false, timer: 0 };
    it.B.sc.x = it.B.sc.t = 0;
    const show = () => {
      if (it.open) return;
      for (const o of items) if (o !== it) hide(o);
      it.open = true; it.closing = false; pop.hidden = false;
      it.B.sc.x = .25; it.B.sc.v = 0; it.B.sc.t = 1;
      const n = smokeK(), k = deformK(), [ex, ey] = edge(it);
      for (const p of it.B.pts) { p.d = 0; p.v = (Math.random() - .3) * 120 * k; }
      if (n) smokeEmit(M, 3, ex, ey, { vx: it.d[0] * 110, vy: it.d[1] * 110, jit: 20, spread: 6, r: 3.2, grow: 2.5, a: .32, life: .45, lift: 6 });
    };
    trig.addEventListener('pointerenter', () => { clearTimeout(it.timer); it.timer = setTimeout(show, 300); });
    trig.addEventListener('pointerleave', () => hide(it));
    trig.addEventListener('focus', () => { if (trig.matches(':focus-visible')) show(); });
    trig.addEventListener('blur', () => hide(it));
    trig.addEventListener('keydown', e => { if (e.key === 'Escape') hide(it); });
    return it;
  });
  function hide(it) {
    clearTimeout(it.timer); if (!it.open) return;
    it.open = false; it.closing = true; it.B.sc.t = 0;
    const n = smokeK(), [x, y] = center(it);
    if (n) smokeFromBody(M, it.B, x, y, 4 + Math.round(4 * n), () => true, { speed: 14, vx: it.d[0] * 20, vy: -26, r: 5.5, grow: 2.4, a: .32, life: 1, lift: 26 });
  }
  const local = it => { const r = it.trig.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left + r.width / 2, r.top - c.top + r.height / 2, r.width / 2]; };
  const edge = it => { const [x, y, R] = local(it); return [x + it.d[0] * R, y + it.d[1] * R]; };
  const center = it => { const [x, y, R] = local(it); return [x + it.d[0] * (R + GAP + TW / 2), y + it.d[1] * (R + GAP + TH / 2)]; };
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, c = cv.cv.getBoundingClientRect(), rr = root.getBoundingClientRect();
      for (const it of items) {
        const B = it.B; for (const p of B.pts) p.f = 0;
        for (let i = 0; i < sub; i++) { if (it.open) stepS(B.sc, h, .26 + (1 - F.speed) * .12, reduced ? 1 : Math.max(.3, .55 - F.bounce * .3)); else stepS(B.sc, h, .14, 1); bodyStep(B, h); }
        if (B.sc.x < 0) { B.sc.x = 0; B.sc.v = 0; }
        const s = B.sc.x, [x, y] = center(it), [ex, ey] = edge(it);
        const px = ex + (x - ex) * s, py = ey + (y - ey) * s;   // 从按钮边上飞到位置，边飞边鼓
        it.pop.style.transform = `translate(${(px - TW / 2 + c.left - rr.left).toFixed(1)}px,${(py - TH / 2 + c.top - rr.top).toFixed(1)}px) scale(${s.toFixed(4)})`;
        it.pop.style.opacity = clamp((s - .55) / .35, 0, 1).toFixed(3);
        it.px = px; it.py = py;
        if (it.closing && s < .03) { it.closing = false; it.pop.hidden = true; }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k);
      for (const it of items) if (it.B.sc.x > .01) drawBody(cv.ctx, it.B, it.px, it.py, rgb(C.card), cv.k, cardLine());
    },
  });
})();

