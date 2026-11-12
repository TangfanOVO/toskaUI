/* ================= 色域：拖圆头，紧跟手，跑快了往身后喷它脚下那块的颜色；点别处，圆头化成雾流过去，雾一路变成路过的颜色；
   鼠标停在上面，圆头顶上慢慢冒小云，云是选中的颜色。下面的色相滑块一动，整块色域和圆头一起换色 ================= */
(() => {
  const area = $('#caArea'), th = $('#caThumb'), cv = setup(area.querySelector('canvas')), M = makeSmoke(), ps = makeFog(26, 3);
  const AW = 240, AH = 160, OX = 40, OY = 60, R = 12;
  let H = 250, s = .7, v = .82;
  const toXY = (ss, vv) => [OX + ss * AW, OY + (1 - vv) * AH], fromXY = (x, y) => [clamp((x - OX) / AW, 0, 1), clamp(1 - (y - OY) / AH, 0, 1)];
  const colAt = (x, y) => { const [a, b] = fromXY(x, y); return hsv2rgb(H, a, b); };
  const [x0, y0] = toXY(s, v);
  const S = { X: spring(x0), Y: spring(y0), c: spring(1), cs: spring(1), travel: false, drag: null, t: 0, px: x0, py: y0, vx: 0, vy: 0, mx: x0, my: y0, hov: false, idle: .2, repT: 0 };
  for (const p of ps) { p.x = x0 + p.u * 8; p.y = y0 + p.v * 8; }
  const hue = chanSlider({ el: $('#caHue'), w: 240, min: 0, max: 360, value: H, colorAt: h => hsv2rgb(h, 1, 1), text: h => `${h} 度，${colorName(hsv2rgb(h, 1, 1))}`, onInput: h => { H = h; area.style.setProperty('--hue', h); out(); } });
  $('#caHue').style.setProperty('--grad', `linear-gradient(to right,${[0, 60, 120, 180, 240, 300, 360].map(h => toHex(hsv2rgb(h, 1, 1))).join(',')})`);
  area.style.setProperty('--hue', H);
  function out() {
    const c = hsv2rgb(H, s, v), hx = toHex(c), nm = colorName(c);
    $('#caSw').style.setProperty('--c', hx); $('#caHex').textContent = hx; $('#caName').textContent = nm;
    th.setAttribute('aria-valuenow', String(Math.round(s * 100)));
    th.setAttribute('aria-valuetext', `饱和度 ${Math.round(s * 100)}%，亮度 ${Math.round(v * 100)}%，${nm}`);
    const [x, y] = toXY(s, v); th.style.left = (x - OX) + 'px'; th.style.top = (y - OY) + 'px';
  }
  out();
  const set = (ss, vv) => { s = clamp(ss, 0, 1); v = clamp(vv, 0, 1); out(); const [x, y] = toXY(s, v); S.X.t = x; S.Y.t = y; };
  const local = e => { const r = cv.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  area.addEventListener('pointerenter', e => { S.hov = e.pointerType !== 'touch'; });
  area.addEventListener('pointerleave', () => { S.hov = false; });
  area.addEventListener('pointerdown', e => {
    e.preventDefault(); area.setPointerCapture(e.pointerId); th.classList.add('pf'); th.focus({ preventScroll: true });   // 鼠标点进来的焦点不画框，按键盘才画
    const [x, y] = local(e), n = smokeK();
    S.drag = { id: e.pointerId, gx: 0, gy: 0, sx: [], sy: [], x0: x, y0: y, active: false };
    if (Math.hypot(x - S.X.x, y - S.Y.x) <= R + 6) { S.drag.gx = S.X.x - x; S.drag.gy = S.Y.x - y; S.drag.active = true; S.travel = false; S.c.t = 1; }
    else {   // 点在别处：圆头化开，流过去
      set(...fromXY(x, y));
      if (!reduced) {
        S.travel = true; S.c.t = 0; const dx = S.X.t - S.X.x, dy = S.Y.t - S.Y.x, L = Math.hypot(dx, dy) || 1;
        for (const p of ps) { p.vx += dx / L * (20 + Math.random() * 90) + J() * 40; p.vy += dy / L * (20 + Math.random() * 90) + J() * 40; }
        if (n) smokeEmit(M, 2, S.X.x - dx / L * R, S.Y.x - dy / L * R, { vx: -dx / L * 60, vy: -dy / L * 60, jit: 20, r: 2.4, grow: 3.5, a: .28, life: .9, lift: 4, col: colAt(S.X.x, S.Y.x) });
      } else { S.X.x = S.X.t; S.Y.x = S.Y.t; }
    }
    pushSample(S.drag.sx, x); pushSample(S.drag.sy, y);
  });
  area.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const [x, y] = local(e);
    if (!d.active) { if (Math.hypot(x - d.x0, y - d.y0) < 4) return; d.active = true; d.gx = d.gy = 0; S.travel = false; S.c.t = 1; }
    S.X.x = rubber(x + d.gx, OX, OX + AW, 10); S.Y.x = rubber(y + d.gy, OY, OY + AH, 10);
    pushSample(d.sx, x); pushSample(d.sy, y); S.X.v = vel(d.sx); S.Y.v = vel(d.sy);
    const [a, b] = fromXY(S.X.x, S.Y.x); s = a; v = b; out();
  });
  const up = e => { const d = S.drag; if (!d || e.pointerId !== d.id) return; if (d.active) { const [x, y] = toXY(s, v); S.X.t = x; S.Y.t = y; S.X.v = S.Y.v = 0; } S.drag = null; };
  area.addEventListener('pointerup', up); area.addEventListener('pointercancel', up);
  th.addEventListener('blur', () => th.classList.remove('pf'));
  th.addEventListener('keydown', e => {
    if (e.key === 'Tab') return; th.classList.remove('pf');
    const k = e.shiftKey ? .1 : .01, m = { ArrowRight: [k, 0], ArrowLeft: [-k, 0], ArrowUp: [0, k], ArrowDown: [0, -k], PageUp: [0, .1], PageDown: [0, -.1] }[e.key];
    let ns = null;
    if (m) ns = [s + m[0], v + m[1]]; else if (e.key === 'Home') ns = [0, v]; else if (e.key === 'End') ns = [1, v];
    if (!ns) return;
    e.preventDefault(); S.repT = performance.now(); set(ns[0], ns[1]);
  });
  comps.push({
    cvo: cv,
    step(dt) {
      S.t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, dragging = S.drag && S.drag.active;
      for (let i = 0; i < sub; i++) {
        if (!dragging && !S.travel) { stepS(S.X, h, resp() * .8, Math.max(.5, zeta())); stepS(S.Y, h, resp() * .8, Math.max(.5, zeta())); }
        stepS(S.c, h, S.travel ? .12 : .1, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7));
      }
      if (dragging && performance.now() - S.drag.sx[S.drag.sx.length - 1].t > 70) S.X.v = S.Y.v = 0;
      const n = smokeK(), d = fogStep(ps, S.travel ? S.X.t : S.X.x, S.travel ? S.Y.t : S.Y.x, 8, 8, S.travel, S.t, dt, false);
      let mx = 0, my = 0; for (const p of ps) { mx += p.x; my += p.y; } S.mx = mx / ps.length; S.my = my / ps.length;
      if (S.travel && n) for (const p of ps) { const sp = Math.hypot(p.vx, p.vy); if (sp > 110 && Math.random() < dt * 4 * n) smokeEmit(M, 1, p.x, p.y, { vx: -p.vx * .3, vy: -p.vy * .3, r: 1.8, grow: 3.5, a: .26, life: .8, lift: 4, col: colAt(p.x, p.y) }); }
      if (S.travel && d < 2.2) { S.travel = false; S.X.x = S.X.t; S.Y.x = S.Y.t; S.X.v = S.Y.v = 0; S.c.t = 1; S.cs.x = .8; S.cs.v = 0; S.cs.t = 1; }
      const ex = S.travel ? S.mx : S.X.x, ey = S.travel ? S.my : S.Y.x, col = colAt(ex, ey);
      const vx = (ex - S.px) / Math.max(dt, 1e-3), vy = (ey - S.py) / Math.max(dt, 1e-3); S.px = ex; S.py = ey; S.vx += (vx - S.vx) * .35; S.vy += (vy - S.vy) * .35;
      if (performance.now() - S.repT > 250) { const sp = Math.hypot(S.vx, S.vy) || 1; trailPuffs(M, dt, ex - S.vx / sp * R * .5, ey - S.vy / sp * R * .5, S.vx, S.vy, 1, col); }
      if (n && S.hov && !S.drag && !S.travel) { S.idle -= dt; if (S.idle <= 0) { S.idle = (.55 + Math.random() * .6) / (.45 + n); cloudlet(M, S.X.x + J() * 6, S.Y.x - R - 1, { r: 2.3, grow: 3.4, a: .27, life: 1.5, lift: 15, vy: -14, col }); } }
      S.st = clamp(Math.hypot(S.X.v, S.Y.v) * .0009 * deformK() * 1.5, 0, .4); S.ang = Math.atan2(S.Y.v, S.X.v);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, ex = S.travel ? S.mx : S.X.x, ey = S.travel ? S.my : S.Y.x, col = colAt(ex, ey);
      smokeDraw(M, ctx, k);
      fogDraw(ctx, k, ps, .1 + .9 * (1 - S.c.x), col);
      if (S.c.x > .01) {   // 外圈组件色、中间一圈底色、里面是选中的颜色：落在哪种颜色上都看得清
        const st = S.st, a = S.ang || 0, sx = (1 + st) * S.cs.x, sy = (1 - st * .35) * (2 - S.cs.x);
        ctx.globalAlpha = S.c.x;
        const ring = (r, c) => { ctx.beginPath(); ctx.ellipse(S.X.x, S.Y.x, r * sx, r * sy, a, 0, TAU); ctx.fillStyle = rgb(c); ctx.fill(); };
        goo(ctx, k, true); ring(R, C.body); goo(ctx, k, false); ring(R - 2, C.bg); ring(R - 4.5, col);
        ctx.globalAlpha = 1;
      }
    },
  });
})();

