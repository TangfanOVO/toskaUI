/* ================= 滑块 =================
   拖圆头：紧跟手（不变成雾），跑快了往身后喷。点轨道：圆头散开飘过去再凝回来。 */
(() => {
  const el = $('#slider'), cv = setup(el.querySelector('canvas')), out = $('#sval'), M = makeSmoke(), hov = hovering(el), ps = makeFog(24, 2.8);
  const PADX = 30, W = 220, R = 10, X0 = PADX + R, X1 = PADX + W - R, CY = 50 + 12;
  let value = 50;
  const toX = v => X0 + (X1 - X0) * v / 100, toV = x => Math.round(clamp((x - X0) / (X1 - X0), 0, 1) * 100);
  const S = { X: spring(toX(value)), c: spring(1), cs: spring(1), travel: false, drag: null, t: 0, prevX: toX(value), vel: 0, acc: 0, mx: toX(value) };
  const beads = makeBeads(5);
  for (const p of ps) { p.x = S.X.x + p.u * 7; p.y = CY + p.v * 7; }
  function setValue(v) { value = clamp(Math.round(v), 0, 100); el.setAttribute('aria-valuenow', String(value)); out.textContent = value; }
  const localX = e => e.clientX - cv.cv.getBoundingClientRect().left;
  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    const x = localX(e), n = smokeK();
    S.drag = { id: e.pointerId, grab: 0, samples: [], jumped: false, x0: x };
    if (Math.abs(x - S.X.x) <= R + 6) { S.drag.grab = S.X.x - x; S.drag.active = true; }
    else {   // 点在轨道上：圆头散开，飘到那儿再凝回来
      setValue(toV(x)); S.X.t = toX(value); S.drag.jumped = true;
      if (!reduced) {
        S.travel = true; S.c.t = 0; const dir = Math.sign(S.X.t - S.X.x);
        for (const p of ps) { p.vx += dir * (20 + Math.random() * 80); p.vy += J() * 50; }
        if (n) smokeEmit(M, 2, S.X.x - dir * R, CY, { vx: -dir * 60, jit: 20, spreadY: 6, r: 2.4, grow: 3.5, a: .28, life: .9, lift: 4 });
      } else S.X.x = S.X.t;
    }
    pushSample(S.drag.samples, x);
  });
  el.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const x = localX(e);
    if (!d.active) { if (Math.abs(x - d.x0) < 4) return; d.active = true; d.grab = 0; S.travel = false; S.c.t = 1; }   // 点了轨道又拖：直接凝在手下
    S.X.x = rubber(x + d.grab, X0, X1, 10); pushSample(d.samples, x); S.X.v = vel(d.samples);
    setValue(toV(S.X.x));
  });
  const up = e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    if (d.active) { S.X.t = toX(value); S.X.v = 0; }
    S.drag = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', e => {
    if (e.repeat) S.repT = performance.now();
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (step !== undefined) { e.preventDefault(); setValue(value + step); S.X.t = toX(value); }
    if (e.key === 'Home') { e.preventDefault(); setValue(0); S.X.t = toX(0); }
    if (e.key === 'End') { e.preventDefault(); setValue(100); S.X.t = toX(100); }
  });
  comps.push({
    step(dt) {
      S.t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, dragging = S.drag && S.drag.active;
      for (let i = 0; i < sub; i++) {
        if (!dragging && !S.travel) stepS(S.X, h, resp() * .8, Math.max(.5, zeta()));
        stepS(S.c, h, S.travel ? .12 : .1, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7));
      }
      if (dragging && performance.now() - S.drag.samples[S.drag.samples.length - 1].t > 70) S.X.v = 0;
      const n = smokeK();
      const d = fogStep(ps, S.travel ? S.X.t : S.X.x, CY, 7, S.travel ? 2.5 : 7, S.travel, S.t, dt, true);   // 贴着轨道流过去
      let mx = 0; for (const p of ps) mx += p.x; S.mx = mx / ps.length;
      if (S.travel) exhaustFrom(M, ps, dt, n);
      if (S.travel && d < 2) { S.travel = false; S.X.x = S.X.t; S.X.v = 0; S.c.t = 1; S.cs.x = .8; S.cs.v = 0; S.cs.t = 1; }
      // 圆头真实的速度和加速度（拖、弹簧、键盘都算）——小水珠靠它晃
      const endX = S.travel ? S.mx : S.X.x, vNow = (endX - S.prevX) / Math.max(dt, 1e-3);
      S.prevX = endX; S.acc += ((vNow - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = vNow;
      beadsStep(beads, S.acc, S.vel, dt);
      const v = S.travel ? 0 : S.X.v;
      if (n && Math.abs(S.vel) > 40 && performance.now() - (S.repT || 0) > 250) {   // 跑起来，前沿往上冒小云（跟进度条一样）；键盘连按时不冒
        M.acc += Math.min(30, Math.abs(S.vel) * .04) * n * dt;
        while (M.acc >= 1) { M.acc -= 1; smokeEmit(M, 1, endX - Math.sign(S.vel) * 4, CY - 2, { vx: -S.vel * .05 + J() * 10, vy: -16 - Math.random() * 18, r: 2, grow: 3.4, a: .3, life: .9, lift: 14 }); }
      }
      S.st = clamp(Math.abs(v) * .001 * deformK() * 1.5, 0, .45);
      stirFog(ps, cv.cv, M);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, end = S.travel ? S.mx : S.X.x;
      smokeDraw(M, ctx, k);
      goo(ctx, k, true);
      rrect(ctx, PADX, CY - 2, Math.max(4, end - PADX), 4, 2); ctx.fillStyle = rgb(C.body); ctx.fill();   // 已选的那段
      beadsDraw(ctx, beads, PADX + 3, CY, end - R * .6, CY, 2);   // 上面那几颗小水珠
      goo(ctx, k, false);
      fogDraw(ctx, k, ps, .1 + .9 * (1 - S.c.x));
      if (S.c.x > .01) {
        const st = S.st || 0, rx = R * (1 + st) * S.cs.x, ry = R * (1 - st * .3) * (2 - S.cs.x);
        goo(ctx, k, true); ctx.globalAlpha = S.c.x; ctx.beginPath(); ctx.ellipse(S.X.x - Math.sign(S.X.v) * R * st * .5, CY, rx, ry, 0, 0, TAU); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; goo(ctx, k, false);
      }
    },
  });
})();
