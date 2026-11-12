/* ================= 滑块 · 竖着：跟横的一样——拖着紧跟手，已选那段上的小水珠跟着上下晃；点轨道，圆头化开贴着轨道流过去；
   跑起来往上冒小云。上下键（左右键也行）调 ================= */
(() => {
  const el = $('#vslider'), cv = setup(el.querySelector('canvas')), out = $('#vsval'), M = makeSmoke(), ps = makeFog(24, 2.8);
  const PADY = 40, H = 180, R = 10, Y0 = PADY + H - R, Y1 = PADY + R, CX = 40 + 12;   // Y0：0（底），Y1：100（顶）
  let value = 60;
  const toY = v => Y0 + (Y1 - Y0) * v / 100, toV = y => Math.round(clamp((y - Y0) / (Y1 - Y0), 0, 1) * 100);
  const S = { Y: spring(toY(value)), c: spring(1), cs: spring(1), travel: false, drag: null, t: 0, prev: toY(value), vel: 0, acc: 0, my: toY(value), repT: 0, st: 0 };
  const beads = makeBeads(5);
  for (const p of ps) { p.x = CX + p.u * 7; p.y = S.Y.x + p.v * 7; }
  function setValue(v) { value = clamp(Math.round(v), 0, 100); el.setAttribute('aria-valuenow', String(value)); out.textContent = value; }
  const localY = e => e.clientY - cv.cv.getBoundingClientRect().top;
  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    const y = localY(e), n = smokeK();
    S.drag = { id: e.pointerId, grab: 0, samples: [], y0: y, active: false };
    if (Math.abs(y - S.Y.x) <= R + 6) { S.drag.grab = S.Y.x - y; S.drag.active = true; }
    else {
      setValue(toV(y)); S.Y.t = toY(value);
      if (!reduced) {
        S.travel = true; S.c.t = 0; const dir = Math.sign(S.Y.t - S.Y.x);
        for (const p of ps) { p.vy += dir * (20 + Math.random() * 80); p.vx += J() * 50; }
        if (n) smokeEmit(M, 2, CX, S.Y.x - dir * R, { vy: -dir * 60, jit: 20, spread: 6, r: 2.4, grow: 3.5, a: .28, life: .9, lift: 4 });
      } else S.Y.x = S.Y.t;
    }
    pushSample(S.drag.samples, y);
  });
  el.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const y = localY(e);
    if (!d.active) { if (Math.abs(y - d.y0) < 4) return; d.active = true; d.grab = 0; S.travel = false; S.c.t = 1; }
    S.Y.x = rubber(y + d.grab, Y1, Y0, 10); pushSample(d.samples, y); S.Y.v = vel(d.samples);
    setValue(toV(S.Y.x));
  });
  const up = e => { const d = S.drag; if (!d || e.pointerId !== d.id) return; if (d.active) { S.Y.t = toY(value); S.Y.v = 0; } S.drag = null; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', e => {
    const st = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
    const nv = st !== undefined ? value + st : e.key === 'Home' ? 0 : e.key === 'End' ? 100 : null;
    if (nv === null) return;
    e.preventDefault(); S.repT = performance.now(); setValue(nv); S.Y.t = toY(value);
  });
  comps.push({
    step(dt) {
      S.t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, dragging = S.drag && S.drag.active;
      for (let i = 0; i < sub; i++) {
        if (!dragging && !S.travel) stepS(S.Y, h, resp() * .8, Math.max(.5, zeta()));
        stepS(S.c, h, S.travel ? .12 : .1, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7));
      }
      if (dragging && performance.now() - S.drag.samples[S.drag.samples.length - 1].t > 70) S.Y.v = 0;
      const n = smokeK(), d = fogStep(ps, CX, S.travel ? S.Y.t : S.Y.x, S.travel ? 2.5 : 7, 7, S.travel, S.t, dt, true);
      let my = 0; for (const p of ps) my += p.y; S.my = my / ps.length;
      if (S.travel) exhaustFrom(M, ps, dt, n);
      if (S.travel && d < 2) { S.travel = false; S.Y.x = S.Y.t; S.Y.v = 0; S.c.t = 1; S.cs.x = .8; S.cs.v = 0; S.cs.t = 1; }
      const endY = S.travel ? S.my : S.Y.x, vNow = (endY - S.prev) / Math.max(dt, 1e-3);
      S.prev = endY; S.acc += ((vNow - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = vNow;
      beadsStep(beads, -S.acc, -S.vel, dt);   // 往上是正
      if (n && Math.abs(S.vel) > 40 && performance.now() - S.repT > 250) {   // 跑起来：圆头往上冒小云
        M.acc += Math.min(30, Math.abs(S.vel) * .04) * n * dt;
        while (M.acc >= 1) { M.acc -= 1; smokeEmit(M, 1, CX + J() * 8, endY - R, { vx: J() * 16, vy: -16 - Math.random() * 18 - Math.max(0, -S.vel) * .05, r: 2, grow: 3.4, a: .3, life: .9, lift: 14 }); }
      }
      S.st = clamp(Math.abs(S.travel ? 0 : S.Y.v) * .001 * deformK() * 1.5, 0, .45);
      stirFog(ps, cv.cv, M); smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, end = S.travel ? S.my : S.Y.x, bot = PADY + H;
      smokeDraw(M, ctx, k);
      goo(ctx, k, true);
      rrect(ctx, CX - 2, end, 4, Math.max(4, bot - end), 2); ctx.fillStyle = rgb(C.body); ctx.fill();   // 已选的那段：从底下到圆头
      beadsDraw(ctx, beads, CX, bot - 3, CX, end + R * .6, 2);
      goo(ctx, k, false);
      fogDraw(ctx, k, ps, .1 + .9 * (1 - S.c.x));
      if (S.c.x > .01) {
        const st = S.st, rx = R * (1 - st * .3) * (2 - S.cs.x), ry = R * (1 + st) * S.cs.x;
        goo(ctx, k, true); ctx.globalAlpha = S.c.x; ctx.beginPath(); ctx.ellipse(CX, S.Y.x - Math.sign(S.Y.v) * R * st * .5, rx, ry, 0, 0, TAU); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; goo(ctx, k, false);
      }
    },
  });
})();

