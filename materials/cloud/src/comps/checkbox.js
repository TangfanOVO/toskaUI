/* ================= 复选框 =================
   勾上：四周的云团聚过来凝成实心方块，再划出对勾。取消：散成小云往上飘、缩没。
   半选：一道没凝实的、疙疙瘩瘩的云——凝实＝确定，雾＝还没定。 */
function makeCheckbox(el) {
  const cv = setup(el.querySelector('canvas')), M = makeSmoke(), hov = hovering(el.closest('label')), ps = makeFog(26, 3.1);
  let state = el.getAttribute('aria-checked'), placed = false;
  const S = { c: spring(state === 'true' ? 1 : 0), cs: spring(1), vis: spring(state === 'false' ? 0 : state === 'mixed' ? .9 : .1),
    mark: state === 'true' ? 1 : 0, travel: false, rise: false, t: 0, x: 0, y: 0 };
  S.vis.t = S.vis.x;
  function set(next) {
    const [x, y] = centerIn(el, cv), n = smokeK();
    if (next === state) return;
    if (next === 'mixed') {   // 半选：凝实的散成一道疙疙瘩瘩的雾；空的那边飘进一道雾
      const from = state; S.travel = false; S.rise = false; S.c.t = 0; S.c.x = Math.min(S.c.x, .4); S.mark = 0; S.vis.x = Math.max(S.vis.x, from === 'false' ? .3 : .95); S.vis.t = .9;
      if (from === 'false' && !reduced) for (const p of ps) { p.x = x + p.u * 2; p.y = y + p.v * 2; p.vx = p.vy = 0; }
    } else if (next === 'true') {
      S.rise = false; S.c.t = 0; S.mark = 0; S.vis.x = 1; S.vis.t = 1; S.travel = !reduced;
      if (!reduced) for (const p of ps) { const a = Math.random() * TAU, d = 15 + Math.random() * 12; p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d * .8 - 3; p.vx = p.vy = 0; }
    } else {
      S.travel = false; S.rise = !reduced; S.c.t = 0; S.c.x = Math.min(S.c.x, .4); S.mark = 0; S.vis.x = Math.max(S.vis.x, .95); S.vis.t = 0;
      for (const p of ps) { p.vx += J() * 50; p.vy -= 30 + Math.random() * 60; }
      if (n) smokeEmit(M, 2 + Math.round(2 * n), x, y - 4, { vy: -40, jit: 20, spread: 10, r: 2.6, grow: 3.5, a: .3, life: 1, lift: 20 });
    }
    state = next; el.setAttribute('aria-checked', next);
  }
  const api = { el, set: next => set(next), state: () => state, onClick: null, after: null };
  el.addEventListener('click', () => { if (api.onClick) api.onClick(); else { set(state === 'true' ? 'false' : 'true'); if (api.after) api.after(); } });
  comps.push({
    step(dt) {
      S.t += dt;
      const [x, y] = centerIn(el, cv); S.x = x; S.y = y;
      if (!placed) { for (const p of ps) { p.x = x + p.u * 7; p.y = y + p.v * (state === 'mixed' ? 1.8 : 7); } placed = true; }
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(S.c, h, .1, 1); stepS(S.cs, h, .22, Math.max(.25, zeta() * .7)); stepS(S.vis, h, S.rise ? .55 : .18, 1); }
      let tx = x, ty = y, ax = 7, ay = 7;
      if (state === 'mixed') { ax = 7.5; ay = 1.8; }
      if (S.rise) { ty = y - 22; ax = 12; ay = 6; }
      const d = fogStep(ps, tx, ty, ax, ay, S.travel || S.rise, S.t, dt);
      if (S.travel && d < 2) { S.travel = false; S.c.t = 1; S.cs.x = .82; S.cs.v = 0; S.cs.t = 1; S.vis.t = .1; }
      if (state === 'true' && !S.travel) S.mark = Math.min(1, S.mark + dt / .22);
      if (S.rise && S.vis.x < .02) S.rise = false;
      if (reduced) { S.travel = S.rise = false; S.c.x = S.c.t = state === 'true' ? 1 : 0; S.vis.x = S.vis.t = state === 'mixed' ? .9 : state === 'true' ? .1 : 0; S.mark = state === 'true' ? 1 : 0; }
      const n = smokeK();
      if (hov.on && state === 'true' && n && !S.travel) {
        M.idle -= dt;
        if (M.idle <= 0) { M.idle = (.4 + Math.random() * .5) / (.45 + n); smokeEmit(M, 1, x + J() * 8, y - 10, { vx: J() * 6, vy: -14, r: 1.9, grow: 3.8, a: .26, life: 1.4, lift: 14 }); }
      }
      stirFog(ps, cv.cv, M);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      fogDraw(ctx, k, ps, S.vis.x);
      if (S.c.x > .01) {
        const w = 22 * S.cs.x, hh = 22 * (2 - S.cs.x);
        ctx.globalAlpha = S.c.x; rrect(ctx, S.x - w / 2, S.y - hh / 2, w, hh, 6.5); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1;
        if (S.mark > 0 && S.c.x > .5) {   // 对勾用底色画：实心方块上掏出来的一道
          const P = [[-5, .3], [-1.6, 3.8], [5.2, -3.6]], L1 = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]), L2 = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]);
          let len = S.mark * (L1 + L2);
          ctx.beginPath(); ctx.moveTo(S.x + P[0][0], S.y + P[0][1]);
          if (len <= L1) { const f = len / L1; ctx.lineTo(S.x + P[0][0] + (P[1][0] - P[0][0]) * f, S.y + P[0][1] + (P[1][1] - P[0][1]) * f); }
          else { ctx.lineTo(S.x + P[1][0], S.y + P[1][1]); const f = (len - L1) / L2; ctx.lineTo(S.x + P[1][0] + (P[2][0] - P[1][0]) * f, S.y + P[1][1] + (P[2][1] - P[1][1]) * f); }
          ctx.strokeStyle = rgb(C.bodyInk); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        }
      }
    },
  });
  return api;
}
// 全选跟着下面几项走：都勾上＝勾，都没勾＝空，勾了一部分＝半选；点全选：没全勾就全勾上，全勾了就全取消
{
  const boxes = [...document.querySelectorAll('.dcb')].map(makeCheckbox), all = boxes.find(b => b.el.dataset.all), kids = boxes.filter(b => b !== all);
  if (all && kids.length) {
    const derive = () => { const n = kids.filter(b => b.state() === 'true').length; all.set(n === kids.length ? 'true' : n === 0 ? 'false' : 'mixed'); };
    kids.forEach(b => { b.after = derive; });
    all.onClick = () => { const to = all.state() === 'true' ? 'false' : 'true'; kids.forEach(b => b.set(to)); derive(); };
    derive();
  }
}
