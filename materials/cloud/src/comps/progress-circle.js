/* ================= 进度条 · 圆的：一圈水沿着环往前爬，头上鼓着一颗、往外冒小云；转满一圈，整圈噗一下 ================= */
(() => {
  const el = $('#progC'), cv = setup(el.querySelector('canvas')), btn = $('#pcBtn'), num = $('#pcNum'), M = makeSmoke();
  const CX = 50 + 48, CY = 60 + 48, R = 45;   // 圆心在画布上的位置，半径在 6px 的环中间
  const S = { v: 0, f: spring(0), running: false, beat: spring(1) };
  btn.addEventListener('click', () => {
    if (S.running) return;
    S.v = 0; S.f.x = S.f.t = 0; S.f.v = 0; S.running = true; btn.textContent = '同步中…'; btn.setAttribute('aria-disabled', 'true');
  });
  comps.push({
    step(dt) {
      const n = smokeK();
      if (S.running) {
        S.v = Math.min(100, S.v + dt * (12 + Math.random() * 30) * (S.v > 85 ? .5 : 1));
        if (S.v >= 100) {
          S.running = false; btn.textContent = '再同步一次'; btn.removeAttribute('aria-disabled'); S.beat.x = 1.12; S.beat.v = 0;
          if (n) for (let i = 0; i < 12 + Math.round(10 * n); i++) { const a = Math.random() * TAU; smokeEmit(M, 1, CX + Math.cos(a) * R, CY + Math.sin(a) * R, { vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 - 20, jit: 10, r: 2.6, grow: 3.4, a: .32, life: 1, lift: 18 }); }
        }
        const s = Math.floor(S.v); el.setAttribute('aria-valuenow', String(s)); num.textContent = s + '%';
      }
      S.f.t = S.v / 100;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(S.f, h, resp() * .9, Math.max(.6, zeta())); stepS(S.beat, h, .3, Math.max(.3, zeta() * .6)); }
      if (reduced) S.f.x = S.f.t;
      if (n && S.running && S.f.x > .01 && Math.random() < dt * 9 * n) {   // 头上往外冒小云
        const a = -Math.PI / 2 + S.f.x * TAU; smokeEmit(M, 1, CX + Math.cos(a) * (R + 2), CY + Math.sin(a) * (R + 2), { vx: Math.cos(a) * 20, vy: Math.sin(a) * 20 - 14, jit: 8, r: 2, grow: 3.2, a: .3, life: .8, lift: 14 });
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, f = clamp(S.f.x, 0, 1); smokeDraw(M, ctx, k);
      if (f < .003) return;
      const a0 = -Math.PI / 2, a1 = a0 + f * TAU, b = S.beat.x;
      ctx.strokeStyle = ctx.fillStyle = rgb(C.body); goo(ctx, k, true, 6);
      ctx.lineWidth = 6 * b; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(CX, CY, R, a0, a1); ctx.stroke();
      if (f < 1) { ctx.beginPath(); ctx.arc(CX + Math.cos(a1) * R, CY + Math.sin(a1) * R, 4.6, 0, TAU); ctx.fill(); }   // 水头鼓着一颗
      goo(ctx, k, false); ctx.lineCap = 'butt';
    },
  });
})();
