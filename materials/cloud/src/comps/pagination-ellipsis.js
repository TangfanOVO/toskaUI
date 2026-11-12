/* ================= 分页 · 页数多：只露出头、尾和当前页左右，中间用省略号；页码重排时，当前页那块从原来的地方流到新位置 ================= */
(() => {
  const nav = $('#pagerE'), wrap = $('#pgw'), note = $('#pgNote'), cv = setup(nav.querySelector('canvas')), M = makeSmoke(), K = makeCard(M);
  const TOTAL = 20; let cur = 7, first = true;
  function pages() {   // 1 … 6 7 8 … 20
    const s = new Set([1, TOTAL, cur - 1, cur, cur + 1]);
    if (cur <= 4) [2, 3, 4, 5].forEach(x => s.add(x));
    if (cur >= TOTAL - 3) [TOTAL - 4, TOTAL - 3, TOTAL - 2, TOTAL - 1].forEach(x => s.add(x));
    const a = [...s].filter(x => x >= 1 && x <= TOTAL).sort((x, y) => x - y), out = [];
    a.forEach((x, i) => { if (i && x - a[i - 1] > 1) out.push(0); out.push(x); });
    return out;
  }
  function render(focusPage) {
    wrap.textContent = '';
    const mk = (txt, label, fn, dis) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.disabled = !!dis; b.addEventListener('click', fn); wrap.appendChild(b); return b; };
    mk('‹', '上一页', () => go(cur - 1), cur === 1).dataset.nav = '-1';
    for (const p of pages()) {
      if (!p) { const g = document.createElement('span'); g.className = 'gap'; g.textContent = '…'; g.setAttribute('aria-hidden', 'true'); wrap.appendChild(g); continue; }
      const b = mk(String(p), `第 ${p} 页`, () => go(p)); b.dataset.p = p; if (p === cur) b.setAttribute('aria-current', 'page');
    }
    mk('›', '下一页', () => go(cur + 1), cur === TOTAL).dataset.nav = '1';
    note.textContent = `第 ${cur} 页，共 ${TOTAL} 页`;
    if (focusPage) { const f = wrap.querySelector(focusPage === 'prev' ? '[data-nav="-1"]' : focusPage === 'next' ? '[data-nav="1"]' : `[data-p="${cur}"]`); (f && !f.disabled ? f : wrap.querySelector(`[data-p="${cur}"]`)).focus(); }
  }
  function go(p) {
    p = clamp(p, 1, TOTAL); if (p === cur) return;
    const how = document.activeElement && document.activeElement.dataset.nav ? (document.activeElement.dataset.nav === '1' ? 'next' : 'prev') : 'page';
    const old = wrap.querySelector(`[data-p="${cur}"]`), n = smokeK();
    if (old && n) { const [x, y] = centerIn(old, cv); smokeEmit(M, 2, x, y - 10, { vy: -24, jit: 12, r: 2.4, grow: 3.2, a: .28, life: .9, lift: 14 }); }
    cur = p; render(how);
  }
  render();
  comps.push({
    step(dt) {
      const b = wrap.querySelector(`[data-p="${cur}"]`);
      if (b) {
        const r = b.getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
        cardAim(K, r.left - c.left, r.top - c.top, r.right - c.left, r.bottom - c.top);
        if (first) { K.open = true; K.s.x = K.s.t = 1; first = false; }
      }
      cardStep(K, dt); smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); cardDraw(cv.ctx, cv.k, K, 9, C.body); },
  });
})();

