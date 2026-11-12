/* ================= 标签组：选中的标签凝成实心，取消就散掉；点 × 整颗化成小云飘走 ================= */
(() => {
  const g = $('#tagGroup'), cv = setup(g.querySelector('canvas')), M = makeSmoke();
  const tags = [...g.querySelectorAll('.tg')].map(el => {
    const it = makeCondense(16, 3); it.el = el; it.b = el.querySelector('.tgb'); it.xb = el.querySelector('.tgx');
    it.on = it.b.getAttribute('aria-pressed') === 'true'; it.c.x = it.c.t = it.on ? 1 : 0; it.vis.x = it.vis.t = it.on ? .1 : 0; it.sc = spring(1); it.dead = false;
    if (it.on) el.dataset.on = '1';
    return it;
  });
  let t = 0;
  tags.forEach(it => {
    it.b.addEventListener('click', () => {
      const [x, y] = centerIn(it.el, cv); it.on = !it.on; it.b.setAttribute('aria-pressed', String(it.on));
      if (it.on) condenseOn(it, x, y, 22); else condenseOff(it, M, x, y);
    });
    it.xb.addEventListener('click', () => {
      if (it.dead) return;
      it.dead = true; it.sc.t = 0;
      const [x, y] = centerIn(it.el, cv), n = smokeK();
      if (n) smokeEmit(M, 4 + Math.round(4 * n), x, y, { spread: 18, spreadY: 6, vy: -30, jit: 20, r: 3.6, grow: 2.6, a: .32, life: 1, lift: 24 });
      const live = tags.filter(x => !x.dead), next = live.find(x => tags.indexOf(x) > tags.indexOf(it)) || live[live.length - 1];
      if (next) next.b.focus();
    });
  });
  comps.push({
    step(dt) {
      t += dt;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = tags.length - 1; i >= 0; i--) {
        const it = tags[i];
        for (let j = 0; j < sub; j++) stepS(it.sc, h, .12, 1);
        const s = Math.max(0, it.sc.x);
        it.el.style.transform = s < .999 ? `scale(${s.toFixed(4)})` : '';
        if (it.dead && s < .05) { it.el.remove(); tags.splice(i, 1); continue; }
        const r = it.el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
        it.x = r.left - c.left + r.width / 2; it.y = r.top - c.top + r.height / 2; it.w = r.width; it.h = r.height;
        condenseStep(it, it.x, it.y, 12, t, dt);
        const on = it.c.x > .5 && !it.dead ? '1' : '';
        if ((it.el.dataset.on || '') !== on) { if (on) it.el.dataset.on = on; else delete it.el.dataset.on; }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      for (const it of tags) {
        fogDraw(ctx, k, it.ps, it.vis.x);
        if (it.c.x > .01 && it.w > 2) { const w = it.w * it.cs.x, h = it.h * (2 - it.cs.x); ctx.globalAlpha = it.c.x; rrect(ctx, it.x - w / 2, it.y - h / 2, w, h, h / 2); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; }
      }
    },
  });
})();
