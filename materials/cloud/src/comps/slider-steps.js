/* ================= 滑块 · 带刻度：只能停在几个刻度上。拖的时候紧跟手；松手吸到最近的刻度，q 一下；
   轨道上没被盖住的刻度是几颗小水珠，圆头一路吃过去，每经过一个刻度，那颗珠子鼓一下 ================= */
(() => {
  const el = $('#sslider'), cv = setup(el.querySelector('canvas')), prev = $('#ssPrev'), M = makeSmoke(), ps = makeFog(24, 2.8);
  const NAMES = ['很小', '小', '中', '大', '很大'], SIZES = [12, 14, 16, 20, 24], N = 5;
  const PADX = 30, W = 240, R = 10, X0 = PADX + R, X1 = PADX + W - R, CY = 50 + 12;
  let value = 2;
  const toX = v => X0 + (X1 - X0) * v / (N - 1), toV = x => Math.round(clamp((x - X0) / (X1 - X0), 0, 1) * (N - 1));
  const S = { X: spring(toX(value)), c: spring(1), cs: spring(1), travel: false, drag: null, t: 0, prevX: toX(value), vel: 0, acc: 0, mx: toX(value), repT: 0, st: 0 };
  const ticks = Array.from({ length: N }, () => spring(1)), beads = makeBeads(4);
  for (const p of ps) { p.x = S.X.x + p.u * 7; p.y = CY + p.v * 7; }
  function setValue(v) {
    const nv = clamp(Math.round(v), 0, N - 1); if (nv === value) return;
    value = nv; el.setAttribute('aria-valuenow', String(value)); el.setAttribute('aria-valuetext', NAMES[value]);
    prev.style.fontSize = SIZES[value] + 'px';
    if (!reduced) { ticks[value].x = 1.9; ticks[value].v = 0; }   // 到了一个刻度：那颗珠子鼓一下
    const n = smokeK(); if (n && performance.now() - S.repT > 250) smokeEmit(M, 2, toX(value), CY - 4, { vy: -26, jit: 10, r: 2, grow: 3.2, a: .28, life: .8, lift: 14 });
  }
  prev.style.fontSize = SIZES[value] + 'px';
  const localX = e => e.clientX - cv.cv.getBoundingClientRect().left;
  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    const x = localX(e);
    S.drag = { id: e.pointerId, grab: 0, samples: [], x0: x, active: false };
    if (Math.abs(x - S.X.x) <= R + 6) { S.drag.grab = S.X.x - x; S.drag.active = true; }
    else {
      setValue(toV(x)); S.X.t = toX(value);
      if (!reduced) { S.travel = true; S.c.t = 0; const dir = Math.sign(S.X.t - S.X.x); for (const p of ps) { p.vx += dir * (20 + Math.random() * 80); p.vy += J() * 50; } }
      else S.X.x = S.X.t;
    }
    pushSample(S.drag.samples, x);
  });
  el.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const x = localX(e);
    if (!d.active) { if (Math.abs(x - d.x0) < 4) return; d.active = true; d.grab = 0; S.travel = false; S.c.t = 1; }
    S.X.x = rubber(x + d.grab, X0, X1, 10); pushSample(d.samples, x); S.X.v = vel(d.samples);
    setValue(toV(S.X.x));
  });
  const up = e => { const d = S.drag; if (!d || e.pointerId !== d.id) return; if (d.active) { S.X.t = toX(value); S.X.v = 0; S.cs.x = .82; S.cs.v = 0; } S.drag = null; };   // 松手吸到刻度上，q 一下
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', e => {
    const st = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    const nv = st !== undefined ? value + st : e.key === 'Home' ? 0 : e.key === 'End' ? N - 1 : null;
    if (nv === null) return;
    e.preventDefault(); if (e.repeat) S.repT = performance.now(); setValue(nv); S.X.t = toX(value);
  });
  comps.push({
    step(dt) {
      S.t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, dragging = S.drag && S.drag.active;
      for (let i = 0; i < sub; i++) {
        if (!dragging && !S.travel) stepS(S.X, h, resp() * .8, Math.max(.45, zeta()));
        stepS(S.c, h, S.travel ? .12 : .1, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7));
        for (const t of ticks) stepS(t, h, .26, Math.max(.25, zeta() * .6));
      }
      if (dragging && performance.now() - S.drag.samples[S.drag.samples.length - 1].t > 70) S.X.v = 0;
      const n = smokeK(), d = fogStep(ps, S.travel ? S.X.t : S.X.x, CY, 7, S.travel ? 2.5 : 7, S.travel, S.t, dt, true);
      let mx = 0; for (const p of ps) mx += p.x; S.mx = mx / ps.length;
      if (S.travel) exhaustFrom(M, ps, dt, n);
      if (S.travel && d < 2) { S.travel = false; S.X.x = S.X.t; S.X.v = 0; S.c.t = 1; S.cs.x = .8; S.cs.v = 0; S.cs.t = 1; }
      const endX = S.travel ? S.mx : S.X.x, vNow = (endX - S.prevX) / Math.max(dt, 1e-3);
      S.prevX = endX; S.acc += ((vNow - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = vNow;
      beadsStep(beads, S.acc, S.vel, dt);
      S.st = clamp(Math.abs(S.travel ? 0 : S.X.v) * .001 * deformK() * 1.5, 0, .45);
      stirFog(ps, cv.cv, M); smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, end = S.travel ? S.mx : S.X.x;
      smokeDraw(M, ctx, k);
      goo(ctx, k, true); ctx.fillStyle = rgb(C.body);
      rrect(ctx, PADX, CY - 2, Math.max(4, end - PADX), 4, 2); ctx.fill();
      beadsDraw(ctx, beads, PADX + 3, CY, end - R * .6, CY, 2);
      ticks.forEach((t, i) => { const x = toX(i), r = 2.6 * clamp(t.x, .2, 2.2); ctx.beginPath(); ctx.arc(x, CY, r, 0, TAU); ctx.fill(); });   // 刻度：几颗小水珠
      goo(ctx, k, false);
      fogDraw(ctx, k, ps, .1 + .9 * (1 - S.c.x));
      if (S.c.x > .01) {
        const st = S.st, rx = R * (1 + st) * S.cs.x, ry = R * (1 - st * .3) * (2 - S.cs.x);
        goo(ctx, k, true); ctx.globalAlpha = S.c.x; ctx.beginPath(); ctx.ellipse(S.X.x - Math.sign(S.X.v) * R * st * .5, CY, rx, ry, 0, 0, TAU); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; goo(ctx, k, false);
      }
    },
  });
})();

