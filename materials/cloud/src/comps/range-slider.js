/* ================= 范围滑块：两颗圆头；靠近时像两滴水连起来，顶过去会把另一颗撞得一晃 ================= */
(() => {
  const el = $('#range'), cv = setup(el.querySelector('canvas')), out = $('#rval'), M = makeSmoke();
  const th = [...el.querySelectorAll('.rthumb')];
  const PADX = 40, W = 240, R = 10, X0 = PADX + R, X1 = PADX + W - R, CY = 56 + 12;
  const toX = v => X0 + (X1 - X0) * v / 100, toV = x => Math.round(clamp((x - X0) / (X1 - X0), 0, 1) * 100);
  const val = [20, 80], fmt = v => `¥${v * 10}`;
  const T = val.map(v => ({ X: spring(toX(v)), c: spring(1), cs: spring(1), sq: spring(0), ps: makeFog(18, 2.6), travel: false, end: toX(v), prev: toX(v) }));
  T.forEach(t => { for (const p of t.ps) { p.x = t.X.x + p.u * 7; p.y = CY + p.v * 7; } });
  const S = { drag: null, vel: 0, acc: 0, t: 0, hitT: 0, wasHit: false }, beads = makeBeads(4);
  const bounds = i => i === 0 ? [0, val[1]] : [val[0], 100];
  const pos = t => t.travel ? t.end : t.X.x;
  function render() {
    th.forEach((b, i) => {
      b.style.left = `${toX(val[i]) - PADX}px`;
      b.setAttribute('aria-valuenow', String(val[i])); b.setAttribute('aria-valuetext', fmt(val[i]));
    });
    th[0].setAttribute('aria-valuemax', String(val[1])); th[1].setAttribute('aria-valuemin', String(val[0]));
    out.textContent = `${fmt(val[0])} – ${fmt(val[1])}`;
  }
  function setVal(i, v) { const [lo, hi] = bounds(i); v = clamp(Math.round(v), lo, hi); if (v === val[i]) return false; val[i] = v; render(); return true; }
  function travelTo(i) {   // 点在轨道上：近的那颗化开，贴着轨道流过去
    const t = T[i]; t.X.t = toX(val[i]);
    if (reduced) { t.X.x = t.X.t; return; }
    if (!t.travel) t.X.x = pos(t);
    t.travel = true; t.c.t = 0; t.c.x = Math.min(t.c.x, .5);
    const dir = Math.sign(t.X.t - t.end) || 1, n = smokeK();
    for (const p of t.ps) { p.vx += dir * (20 + Math.random() * 80); p.vy += J() * 50; }
    if (n) smokeEmit(M, 2, t.end - dir * R, CY, { vx: -dir * 60, jit: 20, spreadY: 6, r: 2.4, grow: 3.5, a: .28, life: .9, lift: 4 });
  }
  const localX = e => e.clientX - cv.cv.getBoundingClientRect().left;
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const x = localX(e);
    let i = Math.abs(x - pos(T[0])) <= Math.abs(x - pos(T[1])) ? 0 : 1;
    if (val[0] === val[1]) i = x < pos(T[0]) ? 0 : 1;   // 叠在一起时，看往哪边拖
    e.preventDefault(); el.setPointerCapture(e.pointerId); th[i].dataset.ptr = '1'; th[i].focus({ preventScroll: true });   // 鼠标拿起来的不画焦点圈，键盘一动再画
    const t = T[i];
    S.drag = { id: e.pointerId, i, grab: 0, samples: [], active: false, x0: x };
    if (Math.abs(x - pos(t)) <= R + 6) { if (t.travel) { t.travel = false; t.X.x = t.end; } S.drag.grab = t.X.x - x; S.drag.active = true; t.c.t = 1; }
    else if (setVal(i, toV(x))) travelTo(i);
    pushSample(S.drag.samples, x);
  });
  el.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const x = localX(e), t = T[d.i], o = T[1 - d.i];
    if (!d.active) { if (Math.abs(x - d.x0) < 4) return; d.active = true; d.grab = 0; if (t.travel) { t.travel = false; t.X.x = t.end; } t.c.t = 1; }
    const [lo, hi] = bounds(d.i), raw = x + d.grab;
    t.X.x = rubber(raw, toX(lo), toX(hi), 10); pushSample(d.samples, x); t.X.v = vel(d.samples);
    setVal(d.i, toV(raw));
    // 顶到另一颗：那颗被撞得往外一晃，接缝那儿挤出一点烟
    const hit = d.i === 0 ? raw > toX(val[1]) + 1 : raw < toX(val[0]) - 1;
    if (hit && !S.wasHit && !reduced) {
      const sp = Math.abs(t.X.v), dir = d.i === 0 ? 1 : -1, now = performance.now(), n = smokeK();
      o.X.v += dir * Math.min(260, 40 + sp * .3) * (.4 + F.bounce);
      o.sq.v += Math.min(6, 1 + sp * .008);
      if (n && sp > 120 && now - S.hitT > 300) { S.hitT = now; smokeEmit(M, 2 + Math.round(2 * n), (pos(t) + pos(o)) / 2, CY - 8, { vy: -36, jit: 18, spread: 4, r: 2.6, grow: 3.2, a: .3, life: .9, lift: 18 }); }
    }
    S.wasHit = hit;
  });
  const up = e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const t = T[d.i];
    if (d.active) { t.X.t = toX(val[d.i]); t.X.v = clamp(t.X.v * .3, -900, 900); }
    S.drag = null; S.wasHit = false;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  th.forEach(b => b.addEventListener('blur', () => { delete b.dataset.ptr; }));
  th.forEach((b, i) => b.addEventListener('keydown', e => {
    delete b.dataset.ptr;
    const st = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    let nv = null;
    if (st !== undefined) nv = val[i] + st;
    if (e.key === 'Home') nv = bounds(i)[0];
    if (e.key === 'End') nv = bounds(i)[1];
    if (nv === null) return;
    e.preventDefault();
    if (setVal(i, nv)) T[i].X.t = toX(val[i]);
    else if (!e.repeat && !reduced && st && ((i === 0 && st > 0) || (i === 1 && st < 0))) {   // 已经贴着另一颗：轻轻碰它一下
      const o = T[1 - i]; o.X.v += (i === 0 ? 1 : -1) * 70; o.sq.v += 2;
    }
  }));
  render();
  comps.push({
    step(dt) {
      S.t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, dragI = S.drag && S.drag.active ? S.drag.i : -1;
      T.forEach((t, i) => {
        for (let j = 0; j < sub; j++) {
          if (i !== dragI && !t.travel) stepS(t.X, h, resp() * .8, Math.max(.45, zeta()));
          stepS(t.c, h, t.travel ? .12 : .1, 1); stepS(t.cs, h, .22, Math.max(.25, zeta() * .7)); stepS(t.sq, h, .3, Math.max(.18, zeta() * .45));
        }
        t.sq.x = clamp(t.sq.x, -.35, .35);
        const d = fogStep(t.ps, t.travel ? t.X.t : t.X.x, CY, 7, t.travel ? 2.5 : 7, t.travel, S.t, dt, true);
        let mx = 0; for (const p of t.ps) mx += p.x; t.mx = mx / t.ps.length;
        if (t.travel) exhaustFrom(M, t.ps, dt, smokeK());
        if (t.travel && d < 2) { t.travel = false; t.X.x = t.X.t; t.X.v = 0; t.c.t = 1; t.cs.x = .8; t.cs.v = 0; t.cs.t = 1; }
        t.end = t.travel ? t.mx : t.X.x;
        t.v = (t.end - t.prev) / Math.max(dt, 1e-3); t.prev = t.end;
      });
      if (dragI >= 0 && performance.now() - S.drag.samples[S.drag.samples.length - 1].t > 70) T[dragI].X.v = 0;
      const vNow = Math.abs(T[0].v) > Math.abs(T[1].v) ? T[0].v : T[1].v;   // 中间那段的水珠跟着跑得快的那颗
      S.acc += ((vNow - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = vNow;
      beadsStep(beads, S.acc, S.vel, dt);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, a = Math.min(T[0].end, T[1].end), b = Math.max(T[0].end, T[1].end);
      smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body);
      goo(ctx, k, true, 11);
      rrect(ctx, a, CY - 2, Math.max(4, b - a), 4, 2); ctx.fill();
      beadsDraw(ctx, beads, a + R * .7, CY, b - R * .7, CY, 2);
      for (const t of T) {
        if (t.c.x <= .01) continue;
        const st = reduced ? 0 : clamp(Math.abs(t.X.v) * .001 * deformK() * 1.5, 0, .45), q = t.sq.x;
        const rx = R * (1 + st + q) * t.cs.x, ry = R * (1 - st * .3 - q * .5) * (2 - t.cs.x);
        ctx.globalAlpha = t.c.x; ctx.beginPath(); ctx.ellipse(t.X.x - Math.sign(t.X.v) * R * st * .5, CY, Math.max(2, rx), Math.max(2, ry), 0, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1; goo(ctx, k, false);
      for (const t of T) fogDraw(ctx, k, t.ps, .1 + .9 * (1 - t.c.x));
    },
  });
})();
