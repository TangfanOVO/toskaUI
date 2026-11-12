/* ================= 工具栏：样式按钮按下凝成实心；对齐那组的实心块在三个按钮之间流 ================= */
(() => {
  const bar = $('#toolbar'), cv = setup(bar.querySelector('canvas')), M = makeSmoke();
  const items = [...bar.querySelectorAll('button')], radios = [...bar.querySelectorAll('[role=radio]')], share = bar.querySelector('.tshare');
  const fmt = [...bar.querySelectorAll('[data-k]')].map(b => { const it = makeCondense(14, 2.8); it.b = b; it.on = false; return it; });
  const S = makeSlab(); let sel = 0, t = 0, fi = 0;
  const rove = i => { fi = (i + items.length) % items.length; items.forEach((b, j) => { b.tabIndex = j === fi ? 0 : -1; }); items[fi].focus(); };
  items.forEach((b, j) => { b.tabIndex = j === 0 ? 0 : -1; b.addEventListener('focus', () => { fi = j; items.forEach((x, n) => { x.tabIndex = n === j ? 0 : -1; }); }); });
  bar.addEventListener('keydown', e => {   // 工具栏：方向键在按钮之间走，空格／回车才按下
    const m = { ArrowRight: fi + 1, ArrowLeft: fi - 1, Home: 0, End: items.length - 1 }[e.key];
    if (m === undefined) return; e.preventDefault(); rove(m);
  });
  fmt.forEach(it => it.b.addEventListener('click', () => {
    const [x, y] = centerIn(it.b, cv); it.on = !it.on; it.b.setAttribute('aria-pressed', String(it.on));
    if (it.on) condenseOn(it, x, y, 16); else condenseOff(it, M, x, y);
  }));
  radios.forEach((b, i) => b.addEventListener('click', () => { sel = i; radios.forEach((r, j) => r.setAttribute('aria-checked', String(j === i))); }));
  share.addEventListener('click', () => { const n = smokeK(); if (n) { const [x, y] = centerIn(share, cv); smokeEmit(M, 3 + Math.round(3 * n), x, y - 10, { spread: 14, vy: -40, jit: 18, r: 3, grow: 3, a: .3, life: .9, lift: 22 }); } });
  comps.push({
    step(dt) {
      t += dt;
      for (const it of fmt) { const [x, y] = centerIn(it.b, cv); it.x = x; it.y = y; condenseStep(it, x, y, 9, t, dt); }
      const r = radios[sel].getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
      S.y = r.top - c.top + r.height / 2; S.h = r.height;
      slabAim(S, r.left - c.left, r.right - c.left); slabStep(S, dt);
      if (S.dir) { const tr = S.dir > 0 ? S.a : S.b; trailPuffs(M, dt, tr.x, S.y, tr.v, 0, .6); }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body);
      for (const it of fmt) {
        fogDraw(ctx, k, it.ps, it.vis.x);
        if (it.c.x > .01) { const w = 32 * it.cs.x, h = 32 * (2 - it.cs.x); ctx.globalAlpha = it.c.x; rrect(ctx, it.x - w / 2, it.y - h / 2, w, h, 8); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; }
      }
      const a = Math.min(S.a.x, S.b.x), b = Math.max(S.a.x, S.b.x), L = Math.max(4, b - a), hh = S.h * clamp(Math.sqrt(S.h / L), .55, 1);   // 拉长时变扁
      goo(ctx, k, true, 8); rrect(ctx, a, S.y - hh / 2, L, hh, Math.min(8, hh / 2)); ctx.fillStyle = rgb(C.body); ctx.fill(); goo(ctx, k, false);
    },
  });
})();
