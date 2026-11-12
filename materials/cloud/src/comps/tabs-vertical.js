/* ================= 标签页 · 竖着：右边那条线像水一样上下流——前头先到、后头被拖着；拉长时变细，停在别的标签上那头往那边探一点 ================= */
(() => {
  const root = $('#tabsV'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const tabs = [...root.querySelectorAll('[role=tab]')], panels = tabs.map(b => document.getElementById(b.getAttribute('aria-controls')));
  let cur = 0, hov = -1;
  const I = { a: spring(0), b: spring(0), dir: 0, vel: 0, acc: 0, pm: null, placed: false, x: 0, h0: 30, repT: 0 }, beads = makeBeads(3);
  function geom(i) { const r = tabs[i].getBoundingClientRect(), c = cv.cv.getBoundingClientRect(), l = root.querySelector('.tlistv').getBoundingClientRect(); return [r.top - c.top + 8, r.bottom - c.top - 8, l.right - c.left]; }
  function select(i, focus) {
    if (i !== cur) {
      I.dir = i > cur ? 1 : -1; cur = i;
      tabs.forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      panels.forEach((p, j) => { p.hidden = j !== i; });
    }
    if (focus) tabs[i].focus();
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(i, false));
    b.addEventListener('pointerenter', () => { hov = i; });
    b.addEventListener('pointerleave', () => { if (hov === i) hov = -1; });
  });
  root.querySelector('[role=tablist]').addEventListener('keydown', e => {
    if (e.repeat) I.repT = performance.now();
    const n = tabs.length, m = { ArrowDown: cur + 1, ArrowUp: cur - 1, Home: 0, End: n - 1 }[e.key];
    if (m === undefined) return;
    e.preventDefault(); select((m + n) % n, true);
  });
  comps.push({
    step(dt) {
      const [y0, y1, x] = geom(cur); I.x = x - .5; I.h0 = y1 - y0;
      if (!I.placed) { I.a.x = I.a.t = y0; I.b.x = I.b.t = y1; I.placed = true; }
      const reach = hov >= 0 && hov !== cur && !reduced ? (hov > cur ? 1 : -1) * 8 * (.3 + deformK()) : 0;
      I.a.t = y0 + Math.min(0, reach); I.b.t = y1 + Math.max(0, reach);
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, lead = I.dir > 0 ? I.b : I.a, trail = I.dir > 0 ? I.a : I.b;
      for (let i = 0; i < sub; i++) {
        if (I.dir === 0 || reduced) { stepS(I.a, h, resp() * .7, Math.max(.45, zeta())); stepS(I.b, h, resp() * .7, Math.max(.45, zeta())); }
        else { stepS(lead, h, resp() * .55, zeta()); stepS(trail, h, resp() * 1.4, Math.min(1, zeta() + .1)); }
      }
      if (reduced) { I.a.x = I.a.t; I.b.x = I.b.t; }
      if (I.dir && Math.abs(I.a.x - I.a.t) + Math.abs(I.b.x - I.b.t) < 1 && Math.abs(I.a.v) + Math.abs(I.b.v) < 8) I.dir = 0;
      const mid = (I.a.x + I.b.x) / 2, vNow = I.pm === null ? 0 : (mid - I.pm) / Math.max(dt, 1e-3); I.pm = mid;
      I.acc += ((vNow - I.vel) / Math.max(dt, 1e-3) - I.acc) * .35; I.vel = vNow;
      beadsStep(beads, I.acc, I.vel, dt);
      const n = smokeK();
      if (n && Math.abs(I.vel) > 220 && performance.now() - I.repT > 250) {   // 流得快：后头那端往身后喷
        M.acc += Math.abs(I.vel) * .03 * n * dt;
        while (M.acc >= 1) { M.acc -= 1; const ty = I.vel > 0 ? Math.min(I.a.x, I.b.x) : Math.max(I.a.x, I.b.x); smokeEmit(M, 1, I.x + J() * 2, ty, { vy: -I.vel * .14, vx: J() * 10, jit: 10, r: 1.8, grow: 3.2, a: .28, life: .7, lift: 3 }); }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, a = Math.min(I.a.x, I.b.x), b = Math.max(I.a.x, I.b.x), L = Math.max(4, b - a);
      const th = clamp(3 * Math.sqrt(I.h0 / L), 1.7, 3.6);
      smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body); goo(ctx, k, true, 8);
      rrect(ctx, I.x - th / 2, a, th, L, th / 2); ctx.fill();
      beadsDraw(ctx, beads, I.x, a + 3, I.x, b - 3, th / 2, .5);
      goo(ctx, k, false);
    },
  });
})();
