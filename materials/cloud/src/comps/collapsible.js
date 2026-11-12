/* ================= 折叠：展开时左边一根实心线跟着内容往下淌，线上的水珠跟着鼓；收起时线退回去 ================= */
(() => {
  const root = $('#collapsible'), cv = setup(root.querySelector('canvas')), btn = $('#collBtn'), body = $('#collBody'), M = makeSmoke();
  const chev = btn.querySelector('.chev'), first = root.querySelector('.crepo');
  const S = { h: spring(0), open: false, beads: makeBeads(3), prev: -1, vel: 0, acc: 0, len: 0, x: 0, y0: 0 };
  let quiet = 0;
  new ResizeObserver(() => { quiet = 0; }).observe(root);
  btn.addEventListener('click', () => {
    S.open = !S.open; S.h.t = S.open ? 1 : 0; quiet = 0;
    btn.setAttribute('aria-expanded', String(S.open)); btn.setAttribute('aria-label', S.open ? '收起' : '展开全部');
    if (S.open) body.hidden = false;
    if (reduced) S.h.x = S.h.t;
  });
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) stepS(S.h, h, resp() * 1.1, Math.max(.5, zeta()));
      const still = Math.abs(S.h.x - S.h.t) < .002 && Math.abs(S.h.v) < .01 && Math.abs(S.vel) < 1;
      quiet = still ? quiet + 1 : 0;
      if (quiet > 3) { beadsStep(S.beads, 0, 0, dt); smokeStep(M, dt); return; }
      const full = body.scrollHeight;
      body.style.height = (S.h.t === 1 && still) ? 'auto' : (clamp(S.h.x, 0, 1) * full).toFixed(1) + 'px';   // 不冲过内容
      body.style.opacity = clamp(S.h.x * 1.4 - .2, 0, 1).toFixed(3);
      if (S.h.t === 0 && S.h.x < .005) body.hidden = true;
      chev.style.transform = `rotate(${(clamp(S.h.x, 0, 1.1) * 180).toFixed(1)}deg)`;
      const c = cv.cv.getBoundingClientRect(), a = first.getBoundingClientRect(), b = body.getBoundingClientRect();
      S.x = a.left - c.left - 9; S.y0 = a.top - c.top + a.height / 2;
      const rows = body.hidden ? [] : [...body.querySelectorAll('.crepo')].filter(r => { const q = r.getBoundingClientRect(); return q.top + q.height / 2 < b.bottom; });   // 只数已经露出来的那几行
      const lastRow = rows.length ? rows[rows.length - 1].getBoundingClientRect() : null;
      S.len = lastRow ? Math.max(0, lastRow.top - c.top + lastRow.height / 2 - S.y0) : 0;
      if (S.prev < 0) S.prev = S.len;
      const v = (S.len - S.prev) / Math.max(dt, 1e-3); S.prev = S.len;
      S.acc += ((v - S.vel) / Math.max(dt, 1e-3) - S.acc) * .35; S.vel = v;
      beadsStep(S.beads, S.acc, S.vel, dt);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body); goo(ctx, k, true);
      ctx.beginPath(); ctx.arc(S.x, S.y0, 3.5, 0, TAU); ctx.fill();
      if (S.len > 2) { rrect(ctx, S.x - 2, S.y0, 4, S.len, 2); ctx.fill(); beadsDraw(ctx, S.beads, S.x, S.y0 + 4, S.x, S.y0 + S.len, 2); }
      goo(ctx, k, false);
    },
  });
})();
