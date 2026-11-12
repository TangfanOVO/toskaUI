/* ================= 按钮 ================= */
(() => {
  const btn = $('#btn'), cv = setup(btn.parentElement.querySelector('canvas')), BW = 140, BH = 44;
  const B = softBody(BW, BH, BH / 2, 56), M = makeSmoke(), hov = hovering(btn);
  const S = { down: null, pulling: false, slow: false, suppress: false, press: null, kb: false };
  const cx = 170 + BW / 2, cy = 130 + BH / 2;
  const local = e => { const r = cv.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const pressStart = q => {
    S.press = q; B.sx.t = 1.03; B.sy.t = .93; B.halo.t = 1;
    const n = smokeK();   // 一捏下去，按的那块边上先渗出一点雾
    if (n) smokeFromBody(M, B, cx, cy, 2 + Math.round(3 * n), p => Math.hypot(p.bx - q[0], p.by - q[1]) < 55, { speed: 20, r: 4, grow: 3.5, a: .2, life: 1.2, lift: 14 });
  };
  btn.addEventListener('pointerdown', e => {
    const [x, y] = local(e);
    S.down = { id: e.pointerId, x: e.clientX, y: e.clientY }; S.pulling = false; S.suppress = false; S.slow = false;
    btn.setPointerCapture(e.pointerId);
    pressStart(toLocal(B, cx, cy, x, y));
  });
  btn.addEventListener('pointermove', e => {
    if (!S.down || e.pointerId !== S.down.id) return;
    const dx = e.clientX - S.down.x, dy = e.clientY - S.down.y, d = Math.hypot(dx, dy);
    if (!S.pulling && d > 8) { S.pulling = true; B.halo.t = .5; }
    if (!S.pulling) return;
    const dd = Math.max(d, 1e-3), mm = rb(d, 80), ox = dx / dd * mm, oy = dy / dd * mm, k = deformK() * 1.6;
    B.tx.t = ox; B.ty.t = oy;
    B.sx.t = clamp(1 + Math.abs(ox) * k / 150 - Math.abs(oy) * k / 420, .82, 1.45);
    B.sy.t = clamp(1 + Math.abs(oy) * k / 150 - Math.abs(ox) * k / 420, .82, 1.45);
  });
  const up = e => {
    if (!S.down || e.pointerId !== S.down.id) return;
    const k = deformK(), n = smokeK();
    if (S.pulling) {
      // 松手：慢慢晃回去，被拽的那一侧拖出一缕烟
      const ox = B.tx.x, oy = B.ty.x, d = Math.hypot(ox, oy) || 1, dx = ox / d, dy = oy / d;
      for (const p of B.pts) p.v += Math.max(0, p.nx * dx + p.ny * dy) * 140 * k;
      if (n) smokeFromBody(M, B, cx, cy, Math.round(10 * n) + 2, p => p.nx * dx + p.ny * dy > .4, { speed: 40, vx: -ox * .9, vy: -oy * .9, r: 5, grow: 3.5, a: .22, life: 1.4 });
      B.tx.t = 0; B.ty.t = 0; S.slow = true; S.suppress = true;
    } else if (S.press) {
      forEachNear(B, S.press[0], S.press[1], 50, (p, f) => { p.v += f * 170 * k; });
    }
    B.sx.t = 1; B.sy.t = 1; B.halo.t = 0;
    S.down = null;
  };
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  const unpress = () => { S.kb = false; S.rep = false; B.sx.t = 1; B.sy.t = 1; B.halo.t = 0; };
  btn.addEventListener('keydown', e => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (e.repeat) { S.rep = true; return; }
    S.kb = true; pressStart([0, 0]);
  });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') unpress(); });
  btn.addEventListener('blur', unpress);
  btn.addEventListener('click', () => {
    if (S.suppress) { S.suppress = false; return; }
    if (S.rep) return;   // 按住回车连着触发：不加戏
    const q = S.press || [0, 0], n = smokeK();
    if (!n) return;
    // 马勃被捏了一下："噗"——一团烟从按的地方鼓出去，顶上冒一股往上走，里面夹着很淡的细孢子
    const near = p => Math.hypot(p.bx - q[0], p.by - q[1]) < 62;
    smokeFromBody(M, B, cx, cy, Math.round(6 + 9 * n), near, { speed: (35 + 70 * F.bounce) * (.6 + .6 * n), r: 6, grow: 4, a: .3, life: 1.6, lift: 30 });
    smokeFromBody(M, B, cx, cy, Math.round(3 + 4 * n), p => p.ny < -.5, { speed: 26, vy: -55, r: 7, grow: 3.5, a: .24, life: 2, lift: 34 });
    smokeFromBody(M, B, cx, cy, Math.round(14 * n), near, { kind: 'spore', speed: 95, r: .9, a: .4, life: 1.3, lift: 18, jit: 40 });
    B.halo.x = Math.max(B.halo.x, .8);
  });

  comps.push({
    step(dt) {
      for (const p of B.pts) p.f = 0;
      const k = deformK(), r = cv.cv.getBoundingClientRect();
      const [lx, ly] = toLocal(B, cx, cy, ptr.x - r.left, ptr.y - r.top);
      if (ptr.on && !S.down) {
        forEachNear(B, lx, ly, 42, (p, f, out) => { p.f += f * 6 * k * (out > 0 ? 1 : .4); });
        const ex = Math.max(0, Math.abs(lx) - BW / 2), ey = Math.max(0, Math.abs(ly) - BH / 2), d = Math.hypot(ex, ey);
        const m = d < 50 && !reduced ? 1 - d / 50 : 0;
        B.tx.t = clamp(lx * .06, -6, 6) * m; B.ty.t = clamp(ly * .12, -4, 4) * m;
      } else if (!S.down) { B.tx.t = 0; B.ty.t = 0; }
      if ((S.down && !S.pulling && S.press) || S.kb) {
        const q = S.press || [0, 0];
        forEachNear(B, q[0], q[1], 50, (p, f) => { p.f -= f * 9 * k; });
      }
      if (!S.down) bodySwipe(B, cx, cy, cv.cv, M, BW / 2, BH / 2, BH / 2);
      if (S.down && S.pulling) {
        const ox = B.tx.t, oy = B.ty.t, d = Math.hypot(ox, oy) || 1;
        for (const p of B.pts) p.f += Math.max(0, (p.nx * ox + p.ny * oy) / d) * Math.min(10, d * .12) * k;
      }
      // 停在上面不点：顶上一直冒小云，一朵接一朵往上飘
      const n = smokeK();
      if (hov.on && !S.down && n) {
        M.idle -= dt;
        if (M.idle <= 0) {
          M.idle = (.16 + Math.random() * .26) / (.45 + n);
          const P = bodyPick(B, p => p.ny < -.35), p = P[(Math.random() * P.length) | 0], [x, y] = ptWorld(B, cx, cy, p);
          if (Math.random() < .7) cloudlet(M, x, y - 1, { r: 3.6, grow: 3.6, a: .2 + .08 * n, life: 2, lift: 20, vy: -14 });
          else smokeEmit(M, 1, x, y, { vx: J() * 10, vy: -20, r: 3, grow: 5, a: .16, life: 2.4, lift: 18 });
        }
      }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      const rr = S.down && S.pulling ? .07 : S.slow ? resp() * 1.9 : resp(), z = S.down && S.pulling ? 1 : S.slow ? Math.max(.14, zeta() * .5) : zeta();
      for (let i = 0; i < sub; i++) {
        stepS(B.tx, h, rr, z); stepS(B.ty, h, rr, z);
        stepS(B.sx, h, resp() * .9, Math.max(.2, zeta() * .75)); stepS(B.sy, h, resp() * .9, Math.max(.2, zeta() * .75));
        bodyStep(B, h);
      }
      if (S.slow && Math.abs(B.tx.x) + Math.abs(B.ty.x) < .2) S.slow = false;
      btn.style.transform = `translate(${B.tx.x.toFixed(2)}px,${B.ty.x.toFixed(2)}px) scale(${B.sx.x.toFixed(4)},${B.sy.x.toFixed(4)})`;
      smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); drawBody(cv.ctx, B, cx, cy, rgb(C.body), cv.k); },
  });
})();
