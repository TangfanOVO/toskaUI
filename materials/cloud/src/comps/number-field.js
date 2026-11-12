/* ================= 数字输入：中间那块是实心的，加减时往那边鼓 ================= */
(() => {
  const wrap = $('#numf'), cv = setup(wrap.querySelector('canvas')), val = $('#nval'), M = makeSmoke();
  const B = softBody(62, 32, 16, 44);
  let v = 12, lastPuff = 0;
  function change(d, quiet) {
    const nv = clamp(v + d, 0, 99), dir = Math.sign(d), k = deformK();
    if (nv === v) { for (const p of B.pts) p.v += Math.max(0, p.nx * dir) * 60 * k; return; }   // 到头了：只轻轻顶一下
    v = nv; val.textContent = v; val.setAttribute('aria-valuenow', String(v));
    for (const p of B.pts) p.v += Math.max(0, p.nx * dir) * (120 + 60 * F.bounce) * k;
    B.sx.v += dir * 0; B.sc.v += .9 * (.4 + F.bounce) * (reduced ? 0 : 1);
    const now = performance.now(), n = smokeK();
    if (n && !quiet && now - lastPuff > 180) {   // 连按时不冒烟（高频操作不加戏）
      lastPuff = now; const [x, y] = centerIn(val, cv);
      smokeEmit(M, 2, x + dir * 20, y - 12, { vx: dir * 18, vy: -40, jit: 14, r: 3.2, grow: 3, a: .3, life: .9, lift: 20 });
    }
  }
  wrap.querySelectorAll('.nbtn').forEach(b => {
    let rep = false;
    b.addEventListener('keydown', e => { rep = e.repeat; });
    b.addEventListener('keyup', () => { rep = false; });
    b.addEventListener('click', () => change(+b.dataset.d, rep));
  });
  val.addEventListener('keydown', e => {
    const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (d !== undefined) { e.preventDefault(); change(d, e.repeat); }
    if (e.key === 'Home') { e.preventDefault(); change(-v, false); }
    if (e.key === 'End') { e.preventDefault(); change(99 - v, false); }
  });
  comps.push({
    step(dt) {
      for (const p of B.pts) p.f = 0;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(B.sc, h, .2, Math.max(.25, zeta() * .6)); bodyStep(B, h); }
      val.style.transform = `scale(${B.sc.x.toFixed(4)})`;
      smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); const [x, y] = centerIn(val, cv); drawBody(cv.ctx, B, x, y, rgb(C.body), cv.k); },
  });
})();
