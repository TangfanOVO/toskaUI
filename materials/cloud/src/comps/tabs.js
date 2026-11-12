/* ================= 标签页：下面那条线像水一样流过去 ================= */
(() => {
  const root = $('#tabs'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const tabs = [...root.querySelectorAll('[role=tab]')], panels = tabs.map(b => document.getElementById(b.getAttribute('aria-controls')));
  let cur = 0, hov = -1;
  const I = { a: spring(0), b: spring(0), dir: 0, vel: 0, acc: 0, pm: null, placed: false, y: 0, w0: 60 }, beads = makeBeads(3);
  function geom(i) { const r = tabs[i].getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left + 12, r.right - c.left - 12, r.bottom - c.top]; }
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
    if (e.repeat) I.repT = performance.now();   // 按住方向键连切：线照样流，不喷烟
    const n = tabs.length, m = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
    if (m === undefined) return;
    e.preventDefault(); select((m + n) % n, true);
  });
  comps.push({
    step(dt) {
      const [x0, x1, y] = geom(cur); I.y = y - .5; I.w0 = x1 - x0;
      if (!I.placed) { I.a.x = I.a.t = x0; I.b.x = I.b.t = x1; I.placed = true; }
      const reach = hov >= 0 && hov !== cur && !reduced ? (hov > cur ? 1 : -1) * 9 * (.3 + deformK()) : 0;   // 停在别的标签上：那头往那边探一点
      I.a.t = x0 + Math.min(0, reach); I.b.t = x1 + Math.max(0, reach);
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, lead = I.dir > 0 ? I.b : I.a, trail = I.dir > 0 ? I.a : I.b;
      for (let i = 0; i < sub; i++) {
        if (I.dir === 0 || reduced) { stepS(I.a, h, resp() * .7, Math.max(.45, zeta())); stepS(I.b, h, resp() * .7, Math.max(.45, zeta())); }
        else { stepS(lead, h, resp() * .55, zeta()); stepS(trail, h, resp() * 1.4, Math.min(1, zeta() + .1)); }   // 前头先到，后头被拖着跟上
      }
      if (reduced) { I.a.x = I.a.t; I.b.x = I.b.t; }
      if (I.dir && Math.abs(I.a.x - I.a.t) + Math.abs(I.b.x - I.b.t) < 1 && Math.abs(I.a.v) + Math.abs(I.b.v) < 8) I.dir = 0;
      const mid = (I.a.x + I.b.x) / 2, vNow = I.pm === null ? 0 : (mid - I.pm) / Math.max(dt, 1e-3); I.pm = mid;
      I.acc += ((vNow - I.vel) / Math.max(dt, 1e-3) - I.acc) * .35; I.vel = vNow;
      beadsStep(beads, I.acc, I.vel, dt);
      const n = smokeK();
      if (n && Math.abs(I.vel) > 260 && performance.now() - (I.repT || 0) > 250) {   // 流得快：后头那端往身后喷
        M.acc += Math.abs(I.vel) * .03 * n * dt;
        while (M.acc >= 1) { M.acc -= 1; const tx = I.vel > 0 ? Math.min(I.a.x, I.b.x) : Math.max(I.a.x, I.b.x); smokeEmit(M, 1, tx, I.y + J() * 2, { vx: -I.vel * .14, vy: J() * 10, jit: 10, r: 1.8, grow: 3.2, a: .28, life: .7, lift: 3 }); }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, a = Math.min(I.a.x, I.b.x), b = Math.max(I.a.x, I.b.x), L = Math.max(4, b - a);
      const th = clamp(3 * Math.sqrt(I.w0 / L), 1.7, 3.6);   // 拉长时变细（体积差不多不变）
      smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body); goo(ctx, k, true, 8);
      rrect(ctx, a, I.y - th / 2, L, th, th / 2); ctx.fill();
      beadsDraw(ctx, beads, a + 3, I.y, b - 3, I.y, th / 2, .5);
      goo(ctx, k, false);
    },
  });
})();
