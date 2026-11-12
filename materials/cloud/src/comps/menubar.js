/* ================= 菜单栏：点开一个，卡片 q 弹鼓出来；开着的时候换到别的菜单，卡片不收起，整块流过去、变成新的大小；顶上那一排的实心块也跟着流 ================= */
(() => {
  const root = $('#menubar'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const tops = [...root.querySelectorAll('.mbar [role=menuitem]')], menus = tops.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const K = makeCard(M), H = makeSlab(), T = makeSlab();
  let cur = -1, hi = -1;
  const its = m => [...m.querySelectorAll('[role=menuitem]')];
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left, r.top - c.top, r.right - c.left, r.bottom - c.top]; };
  const rove = j => { tops.forEach((t, k) => { t.tabIndex = k === j ? 0 : -1; }); tops[j].focus(); };
  function setHi(j, focus) {
    const list = cur >= 0 ? its(menus[cur]) : []; hi = j;
    if (j < 0 || !list[j]) { H.c.t = 0; return; }
    slabAim(H, list[j].offsetTop, list[j].offsetTop + list[j].offsetHeight); H.c.t = 1;
    if (focus) list[j].focus({ preventScroll: true });
  }
  function open(i, focus) {
    if (i !== cur) {
      if (cur >= 0) { menus[cur].hidden = true; tops[cur].setAttribute('aria-expanded', 'false'); }
      cur = i; const m = menus[i]; m.hidden = false; tops[i].setAttribute('aria-expanded', 'true');
      m.style.left = tops[i].offsetLeft + 'px'; m.style.transform = 'none';
      const [l, t, r, b] = rectOf(m); cardAim(K, l, t, r, b); cardShow(K);
      H.placed = false; H.c.x = 0; hi = -1;
    }
    if (focus) setHi(focus === 'last' ? its(menus[i]).length - 1 : 0, true);
  }
  function close(refocus) {
    if (cur < 0) return;
    const i = cur; menus[i].hidden = true; tops[i].setAttribute('aria-expanded', 'false'); cur = -1; hi = -1; H.c.t = 0;
    cardHide(K); if (refocus) rove(i);
  }
  tops.forEach((t, i) => {
    t.addEventListener('click', () => (cur === i ? close(false) : open(i)));
    t.addEventListener('pointerenter', () => { if (cur >= 0 && cur !== i) { open(i); tops.forEach((x, k) => { x.tabIndex = k === i ? 0 : -1; }); } });
    t.addEventListener('keydown', e => {
      const n = tops.length;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; rove(j); if (cur >= 0) open(j); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); rove(e.key === 'Home' ? 0 : n - 1); }
      else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, 'first'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); open(i, 'last'); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    });
  });
  menus.forEach((m, i) => {
    m.addEventListener('keydown', e => {
      const list = its(m), n = list.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); setHi((hi + 1) % n, true); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(hi <= 0 ? n - 1 : hi - 1, true); }
      else if (e.key === 'Home') { e.preventDefault(); setHi(0, true); }
      else if (e.key === 'End') { e.preventDefault(); setHi(n - 1, true); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tops.length) % tops.length; tops.forEach((t, k) => { t.tabIndex = k === j ? 0 : -1; }); open(j, 'first'); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    its(m).forEach((b, j) => {
      b.addEventListener('pointermove', () => { if (hi !== j) setHi(j, true); });
      b.addEventListener('click', () => {
        const n = smokeK(), [x, y, w, , s] = cardRect(K);
        if (n) smokeEmit(M, 3, x + w * .7, y + (b.offsetTop + 16) * s, { vy: -40, jit: 20, spread: 30, spreadY: 6, r: 3.6, grow: 2.6, a: .3, life: .9, lift: 22 });
        close(true);
      });
    });
    m.addEventListener('pointerleave', () => { setHi(-1); if (m.contains(document.activeElement)) tops[i].focus({ preventScroll: true }); });
  });
  document.addEventListener('pointerdown', e => { if (cur >= 0 && !root.contains(e.target)) close(false); });
  comps.push({
    step(dt) {
      cardStep(K, dt); slabStep(H, dt);
      const c = cv.cv.getBoundingClientRect();
      if (cur >= 0) { const r = tops[cur].getBoundingClientRect(); slabAim(T, r.left - c.left, r.right - c.left); T.y = r.top - c.top + r.height / 2; T.c.t = 1; cardRide(K, menus[cur]); }
      else { if (T.c.t === 1 && T.c.x > .3) slabPuff(M, Math.min(T.a.x, T.b.x), Math.max(T.a.x, T.b.x), T.y, 30); T.c.t = 0; }
      slabStep(T, dt);
      if (T.dir && T.y) { const tr = T.dir > 0 ? T.a : T.b; trailPuffs(M, dt, tr.x, T.y, tr.v, 0, .6); }
      if (cur >= 0) its(menus[cur]).forEach(b => {
        const mid = b.offsetTop + b.offsetHeight / 2, on = H.c.x > .5 && mid > Math.min(H.a.x, H.b.x) && mid < Math.max(H.a.x, H.b.x) ? '1' : '';
        if ((b.dataset.hl || '') !== on) { if (on) b.dataset.hl = '1'; else delete b.dataset.hl; }
      });
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      slabDraw(ctx, k, T, 30);   // 收起来时化成小云，块从两头往中间缩
      cardDraw(ctx, k, K, 12, C.card, cardLine());
      const [x, y, w, , s] = cardRect(K);
      if (cur >= 0 && H.c.x > .01 && s > .5) {
        const y0 = y + Math.min(H.a.x, H.b.x) * s, y1 = y + Math.max(H.a.x, H.b.x) * s, hh = (y1 - y0) * (.4 + .6 * H.c.x), ym = (y0 + y1) / 2;
        rrect(ctx, x + 4 * s, ym - hh / 2, w - 8 * s, hh, 8 * s); ctx.fillStyle = rgb(C.hl); ctx.fill();
      }
    },
  });
})();
