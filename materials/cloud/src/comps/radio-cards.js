/* ================= 单选组 · 卡片：选中的那张卡外面围着一圈实心的边，换卡片时这圈边整个流过去——前沿先到、后沿被拖着；
   卡片右上角的小圆点也是一滴，跟着流过去 ================= */
(() => {
  const root = $('#radioCards'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), K = makeCard(null), D = makeDrop(5, M);
  const cards = [...root.querySelectorAll('.rcard')];
  let cur = cards.findIndex(c => c.getAttribute('aria-checked') === 'true'), first = true;
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }; };
  function pick(i, focus) {
    if (i === cur) { if (focus) cards[i].focus(); return; }
    const old = cur; cur = i;
    cards.forEach((c, j) => { c.setAttribute('aria-checked', String(j === i)); c.tabIndex = j === i ? 0 : -1; });
    if (focus) cards[i].focus();
    const n = smokeK(); if (n && old >= 0) { const r = rectOf(cards[old]); smokeEmit(M, 3, r.x + r.w - 18, r.y + 18, { vy: -24, jit: 12, r: 2.4, grow: 3.2, a: .28, life: .9, lift: 16 }); }
    const r = rectOf(cards[i]); dropTo(D, r.x + r.w - 18, r.y + 18);
  }
  cards.forEach((c, i) => c.addEventListener('click', () => pick(i, false)));
  root.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault(); pick((cur + d + cards.length) % cards.length, true);
  });
  comps.push({
    step(dt) {
      const r = rectOf(cards[cur]);
      cardAim(K, r.x - 3, r.y - 3, r.x + r.w + 3, r.y + r.h + 3);
      if (first) { K.open = true; K.s.x = K.s.t = 1; dropTo(D, r.x + r.w - 18, r.y + 18, true); first = false; }
      else if (!D.moving && Math.hypot(D.hx.t - (r.x + r.w - 18), D.hy.t - (r.y + 18)) > .5) dropTo(D, r.x + r.w - 18, r.y + 18, true);   // 版面挪了：跟着走
      cardStep(K, dt); dropStep(D, dt); smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      cardDraw(ctx, k, K, 17, C.body);                                                   // 一块实心……
      const [x, y, w, h, s] = cardRect(K);
      if (s > .02) { rrect(ctx, x + 2.5, y + 2.5, w - 5, h - 5, 14.5 * s); ctx.fillStyle = rgb(C.bg); ctx.fill(); }   // ……中间挖空，就是一圈边
      for (const c of cards) { const r = rectOf(c); ctx.beginPath(); ctx.arc(r.x + r.w - 18, r.y + 18, 7, 0, TAU); ctx.lineWidth = 1.5; ctx.strokeStyle = rgb(C.track); ctx.stroke(); }   // 每张卡右上角的空圈
      dropDraw(ctx, k, D);
    },
  });
})();

