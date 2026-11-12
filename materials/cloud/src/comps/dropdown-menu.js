/* ================= 下拉菜单：卡片 q 弹鼓出来；高亮块在选项之间流动 ================= */
(() => {
  const wrap = $('#ddwrap'), btn = $('#ddBtn'), menu = $('#ddMenu'), cv = setup(wrap.querySelector('.ddfx')), M = makeSmoke();
  const items = [...menu.querySelectorAll('[role=menuitem]')];
  const MW = 220, MH = 177, CX = 170, CY = 60 + MH / 2;
  const bl = makeBloom({ w: MW, h: MH, r: 12, n: 120, M, el: menu, center: () => [CX, CY], base: 'translateX(-50%)' });
  menu.style.transform = 'translateX(-50%)';
  const H = { top: spring(0), bot: spring(0), c: spring(0), idx: -1, dir: 0 };
  function setIdx(i, focus) {
    const prev = H.idx;
    H.idx = i;
    if (i >= 0) {
      const top = items[i].offsetTop, bot = top + items[i].offsetHeight;
      if (prev < 0) { H.top.x = top; H.bot.x = bot; H.top.v = H.bot.v = 0; H.dir = 0; }
      else if (i !== prev) H.dir = i > prev ? 1 : -1;
      H.top.t = top; H.bot.t = bot; H.c.t = 1;
      if (focus) items[i].focus({ preventScroll: true });
    } else H.c.t = 0;
    items.forEach((b, j) => { b.tabIndex = j === i ? 0 : -1; });
  }
  function open() {
    if (bl.open) return;
    bl.show(); btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => setIdx(0, true));
  }
  function close(focusBtn) {
    if (!bl.open) return;
    bl.hide(); btn.setAttribute('aria-expanded', 'false'); setIdx(-1);
    if (focusBtn) btn.focus();
  }
  btn.addEventListener('click', () => (bl.open ? close(false) : open()));
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const last = e.key === 'ArrowUp'; open(); requestAnimationFrame(() => requestAnimationFrame(() => setIdx(last ? items.length - 1 : 0, true))); } });
  menu.addEventListener('keydown', e => {
    const n = items.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((H.idx + 1 + n) % n, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((H.idx - 1 + n) % n, true); }
    else if (e.key === 'Home') { e.preventDefault(); setIdx(0, true); }
    else if (e.key === 'End') { e.preventDefault(); setIdx(n - 1, true); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close(false);
  });
  items.forEach((b, j) => {
    b.addEventListener('pointermove', () => { if (H.idx !== j) setIdx(j, true); });
    b.addEventListener('click', () => {   // 选中：那一行冒一小团，菜单收起
      const n = smokeK();
      if (n) { const y = CY - MH / 2 + b.offsetTop + b.offsetHeight / 2; smokeEmit(M, 3, CX + 70, y, { vy: -40, jit: 20, spread: 30, spreadY: 6, r: 3.6, grow: 2.6, a: .3, life: .9, lift: 22 }); }
      close(true);
    });
  });
  menu.addEventListener('pointerleave', () => setIdx(-1));
  document.addEventListener('pointerdown', e => { if (bl.open && !wrap.contains(e.target)) close(false); });
  comps.push({
    step(dt) {
      bl.step(dt);
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, lead = H.dir > 0 ? H.bot : H.top, trail = H.dir > 0 ? H.top : H.bot;
      for (let i = 0; i < sub; i++) {
        if (H.dir === 0) { stepS(H.top, h, resp() * .7, Math.max(.5, zeta())); stepS(H.bot, h, resp() * .7, Math.max(.5, zeta())); }
        else { stepS(lead, h, resp() * .6, zeta()); stepS(trail, h, resp() * 1.3, Math.min(1, zeta() + .15)); }   // 前沿先到，后沿跟上
        stepS(H.c, h, .1, 1);
      }
      items.forEach(b => {   // 字的颜色看底色块此刻盖住了谁，不看选中了谁
        const mid = b.offsetTop + b.offsetHeight / 2, on = H.c.x > .5 && mid > H.top.x && mid < H.bot.x ? '1' : '';
        if ((b.dataset.hl || '') !== on) { if (on) b.dataset.hl = '1'; else delete b.dataset.hl; }
      });
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      bl.draw(ctx, k);
      const s = bl.B.sc.x;
      if (H.c.x > .01 && s > .5) {   // 高亮块：卡片上掏出一块底色
        const y0 = CY + (-MH / 2 + H.top.x) * s, y1 = CY + (-MH / 2 + H.bot.x) * s, x0 = CX + (-MW / 2 + 4) * s, x1 = CX + (MW / 2 - 4) * s;
        const hh = (y1 - y0) * (.4 + .6 * H.c.x), ym = (y0 + y1) / 2;
        rrect(ctx, x0, ym - hh / 2, x1 - x0, hh, 8 * s); ctx.fillStyle = rgb(C.hl); ctx.fill();
      }
    },
  });
})();
