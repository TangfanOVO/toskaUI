/* ================= 色块：每块都是那个颜色的实心云。鼠标停在上面，它鼓一点，顶上慢慢冒同色的小云；划过去，云被带着甩出去一点 ================= */
(() => {
  const root = $('#colorSwatch'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const S = [...root.querySelectorAll('.swb')].map(el => {
    const s = { el, col: hex(el.dataset.c), sc: spring(1), hov: false, idle: .1, kick: spring(0) };
    el.addEventListener('pointerenter', e => { s.hov = e.pointerType !== 'touch'; s.idle = .05; if (!reduced) s.kick.v += 2.2; });
    el.addEventListener('pointerleave', () => { s.hov = false; });
    return s;
  });
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }; };
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, n = smokeK();
      for (const s of S) {
        s.sc.t = s.hov ? 1.06 : 1;
        for (let i = 0; i < sub; i++) { stepS(s.sc, h, .32, Math.max(.3, zeta() * .7)); stepS(s.kick, h, .3, Math.max(.25, zeta() * .6)); }
        if (reduced) s.sc.x = s.sc.t;
        if (n && s.hov) { s.idle -= dt; if (s.idle <= 0) { s.idle = (.5 + Math.random() * .6) / (.45 + n); const r = rectOf(s.el); cloudlet(M, r.x + r.w / 2 + J() * r.w * .4, r.y + r.h * (1 - s.sc.x) / 2 + 2, { r: 2.4, grow: 3.4, a: .28, life: 1.5, lift: 15, vy: -14, col: s.col }); } }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      for (const s of S) {
        const r = rectOf(s.el), sx = s.sc.x * (1 + s.kick.x * .03), sy = s.sc.x * (1 - s.kick.x * .03), w = r.w * sx, hh = r.h * sy;
        goo(ctx, k, true, 9, s.col); rrect(ctx, r.x + (r.w - w) / 2, r.y + (r.h - hh) / 2, w, hh, 14 * s.sc.x); ctx.fillStyle = rgb(s.col); ctx.fill(); goo(ctx, k, false);
      }
    },
  });
})();

