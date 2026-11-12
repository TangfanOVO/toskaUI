/* ================= 可编辑文字：开始改，底下一根实心线从中间往两边流开；回车，线收回中间凝成一滴、噗一下；Esc，线化成小云飘走 ================= */
(() => {
  const box = $('#editable'), pv = $('#eprev'), inp = $('#einput'), cv = setup(box.querySelector('canvas')), M = makeSmoke();
  const S = { l: spring(0), r: spring(0), drop: spring(0), on: false, hover: false, beads: makeBeads(3), prev: 0, vel: 0, acc: 0, cx: 0, y: 0 };
  let val = pv.textContent;
  function start() { if (S.on) return; S.on = true; inp.value = val; pv.hidden = true; inp.hidden = false; inp.focus(); inp.select(); }
  function end(save, refocus) {
    if (!S.on) return; S.on = false;
    const n = smokeK();
    if (save) { const v = inp.value.trim(); if (v) val = v.slice(0, 12); }
    pv.textContent = val; pv.setAttribute('aria-label', `名字：${val}，点一下修改`);
    inp.hidden = true; pv.hidden = false;
    if (save) { if (!reduced) { S.drop.x = 0; S.drop.v = 30; } if (n) smokeEmit(M, 3, S.cx, S.y - 6, { vy: -40, jit: 16, spread: 6, r: 3, grow: 3, a: .3, life: .9, lift: 22 }); }
    else {
      if (n) for (let i = 0; i < 7; i++) smokeEmit(M, 1, S.cx + S.l.x + (S.r.x - S.l.x) * (i + .5) / 7, S.y, { vy: -26, jit: 12, r: 2.4, grow: 3, a: .3, life: .9, lift: 20 });
      S.l.x = S.r.x = 0; S.l.v = S.r.v = 0;   // 取消：线当场化成烟
    }
    if (refocus) pv.focus();
  }
  pv.addEventListener('click', start);
  pv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });
  pv.addEventListener('pointerenter', () => { S.hover = true; }); pv.addEventListener('pointerleave', () => { S.hover = false; });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); end(true, true); } else if (e.key === 'Escape') { e.preventDefault(); end(false, true); } });
  inp.addEventListener('blur', () => end(true, false));
  comps.push({
    step(dt) {
      const [cx, cy] = centerIn(box, cv); S.cx = cx; S.y = cy + 15;
      const half = S.on ? 82 : S.hover ? 16 : 0;
      S.l.t = -half; S.r.t = half;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(S.l, h, resp() * 1.1, Math.max(.4, zeta())); stepS(S.r, h, resp() * 1.1, Math.max(.4, zeta())); stepS(S.drop, h, .22, Math.max(.3, zeta() * .6)); }
      if (reduced) { S.l.x = S.l.t; S.r.x = S.r.t; S.drop.x = 0; }
      const v = (S.r.x - S.prev) / Math.max(dt, 1e-3); S.prev = S.r.x;
      S.acc += ((v - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = v;
      beadsStep(S.beads, S.acc, S.vel, dt);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, x0 = S.cx + S.l.x, x1 = S.cx + S.r.x;
      smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body); goo(ctx, k, true, 8);
      if (x1 - x0 > 1) { rrect(ctx, x0, S.y - 1.25, x1 - x0, 2.5, 1.25); ctx.fill(); beadsDraw(ctx, S.beads, x0, S.y, x1, S.y, 1.25, .6); }
      const d = Math.abs(S.drop.x); if (d > .05) { ctx.beginPath(); ctx.arc(S.cx, S.y, 4.5 * Math.min(1.4, d * 3), 0, TAU); ctx.fill(); }   // 保存：收回来的那一滴
      goo(ctx, k, false);
    },
  });
})();
