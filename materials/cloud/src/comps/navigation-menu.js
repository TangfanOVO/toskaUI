/* ================= 导航菜单：停在上面，下面那块 q 弹鼓出来；换到另一项时不收起，整块变形成新的大小，字跟着卡片走；底下一颗小点在两项之间流 ================= */
(() => {
  const nav = $('#navmenu'), cv = setup(nav.querySelector('canvas')), M = makeSmoke();
  const trigs = [...nav.querySelectorAll('button.nvtrig')], panels = trigs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const K = makeCard(M), D = makeDrop(4, null), T = makeSlab(); D.s.x = D.s.t = 0;   // T：顶上那一排里，开着的那一项底下的实心块
  let cur = -1, openT = 0, closeT = 0;
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left, r.top - c.top, r.right - c.left, r.bottom - c.top]; };
  function open(i) {
    clearTimeout(closeT); clearTimeout(openT);
    if (i === cur) return;
    if (cur >= 0) { panels[cur].hidden = true; trigs[cur].setAttribute('aria-expanded', 'false'); }
    cur = i; panels[i].hidden = false; trigs[i].setAttribute('aria-expanded', 'true'); panels[i].style.transform = 'none';
    const [l, t, r, b] = rectOf(panels[i]); cardAim(K, l, t, r, b); cardShow(K);
    const [tl, , tr, tb] = rectOf(trigs[i]); dropTo(D, (tl + tr) / 2, tb + 9, D.s.x < .05); D.s.t = 1;
  }
  function close(refocus) {
    clearTimeout(openT); clearTimeout(closeT);
    if (cur < 0) return;
    const i = cur; panels[i].hidden = true; trigs[i].setAttribute('aria-expanded', 'false'); cur = -1;
    cardHide(K); D.s.t = 0; if (refocus) trigs[i].focus();
  }
  trigs.forEach((t, i) => {
    t.addEventListener('pointerenter', () => { clearTimeout(closeT); if (cur >= 0) open(i); else { clearTimeout(openT); openT = setTimeout(() => open(i), reduced ? 0 : 140); } });
    t.addEventListener('click', () => (cur === i ? close(false) : open(i)));
  });
  nav.addEventListener('pointerleave', () => { clearTimeout(openT); clearTimeout(closeT); closeT = setTimeout(() => close(false), 240); });
  nav.addEventListener('pointerenter', () => clearTimeout(closeT));
  nav.addEventListener('keydown', e => { if (e.key === 'Escape' && cur >= 0) { e.preventDefault(); close(true); } });
  nav.addEventListener('focusout', e => { if (cur >= 0 && !nav.contains(e.relatedTarget)) close(false); });
  comps.push({
    step(dt) {
      cardStep(K, dt); dropStep(D, dt);
      if (cur >= 0) { cardRide(K, panels[cur]); const c = cv.cv.getBoundingClientRect(), r = trigs[cur].getBoundingClientRect(); slabAim(T, r.left - c.left, r.right - c.left); T.y = r.top - c.top + r.height / 2; T.c.t = 1; } else { if (T.c.t === 1 && T.c.x > .3) slabPuff(M, Math.min(T.a.x, T.b.x), Math.max(T.a.x, T.b.x), T.y, 32); T.c.t = 0; }
      slabStep(T, dt); if (T.dir && T.y) { const tr = T.dir > 0 ? T.a : T.b; trailPuffs(M, dt, tr.x, T.y, tr.v, 0, .6); }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      slabDraw(ctx, k, T, 32);   // 收起来时化成小云，块从两头往中间缩
      cardDraw(ctx, k, K, 14, C.card, cardLine()); dropDraw(ctx, k, D);
    },
  });
})();
