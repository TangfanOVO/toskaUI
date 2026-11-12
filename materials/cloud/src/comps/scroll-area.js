/* ================= 滚动区域：滚动条的把手是一颗实心胶囊；滚得快被拉长变细，滚到头还硬拽会被压扁再弹回；不冒烟（滚动是高频操作） ================= */
(() => {
  const root = $('#scrollArea'), view = $('#sview'), track = $('#strack'), cv = setup(root.querySelector('canvas'));
  const list = view.querySelector('.slist');
  for (let i = 40; i > 0; i--) { const li = document.createElement('li'); li.textContent = `v1.${Math.floor(i / 10)}.${i % 10}${i > 36 ? '-beta.' + (i - 36) : ''}`; list.appendChild(li); }
  const P = spring(0), sq = spring(0), act = spring(0); let placed = false, drag = null, lastT = 0, hover = false;
  const geom = () => { const H = view.clientHeight, sh = view.scrollHeight, track = H - 12, len = Math.max(26, track * H / sh); return { H, sh, track, len, max: Math.max(1, sh - H) }; };
  view.addEventListener('scroll', () => { lastT = performance.now(); });
  view.addEventListener('wheel', e => {   // 已经到头还往外拽：把手被压扁
    const atTop = view.scrollTop <= 0 && e.deltaY < 0, atEnd = view.scrollTop >= view.scrollHeight - view.clientHeight - 1 && e.deltaY > 0;
    if ((atTop || atEnd) && !reduced) { sq.v += clamp(Math.abs(e.deltaY) * .02, .2, 2.5) * (atTop ? -1 : 1); lastT = performance.now(); }
  }, { passive: true });
  root.addEventListener('pointerenter', () => { hover = true; }); root.addEventListener('pointerleave', () => { hover = false; });
  const toScroll = y => { const g = geom(), r = track.getBoundingClientRect(); return clamp((y - r.top - g.len / 2) / (g.track - g.len), 0, 1) * g.max; };
  track.addEventListener('pointerdown', e => { e.preventDefault(); track.setPointerCapture(e.pointerId); drag = e.pointerId; view.scrollTop = toScroll(e.clientY); });
  track.addEventListener('pointermove', e => { if (drag === e.pointerId) view.scrollTop = toScroll(e.clientY); });
  const up = e => { if (drag === e.pointerId) drag = null; };
  track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  comps.push({
    step(dt) {
      const g = geom(), target = view.scrollTop / g.max * (g.track - g.len);
      if (!placed) { P.x = P.t = target; placed = true; }
      P.t = target; act.t = hover || drag !== null || performance.now() - lastT < 700 ? 1 : 0;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(P, h, .07, .9); stepS(sq, h, .26, reduced ? 1 : Math.max(.15, .4 - F.bounce * .25)); stepS(act, h, .2, 1); }
      sq.x = clamp(sq.x, -.6, .6);
      if (reduced) { P.x = P.t; sq.x = 0; }
      this.g = g;
    },
    draw() {
      if (!clear(cv) || !this.g) return;
      const ctx = cv.ctx, k = cv.k, g = this.g, st = reduced ? 0 : Math.min(.5, Math.abs(P.v) / 2400) * (.3 + deformK()), q = Math.abs(sq.x);
      let len = g.len * (1 + st) * (1 - q * .45), y = 20 + 6 + P.x - g.len * st / 2;
      if (sq.x < -.01) y = 26; else if (sq.x > .01) y = 26 + g.track - len;   // 被压扁时贴着头那一端
      const w = (3 + 3 * act.x) * (1 - st * .35) * (1 + q * .6), x = 44 - 20 - 8;
      ctx.fillStyle = rgb(C.body); rrect(ctx, x - w / 2, y, w, Math.max(w, len), w / 2); ctx.fill();
    },
  });
})();
