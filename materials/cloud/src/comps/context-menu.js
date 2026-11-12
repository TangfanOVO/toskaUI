/* ================= 右键菜单：在哪儿点右键，就从哪儿 q 弹着鼓出来 ================= */
(() => {
  const area = $('#ctxArea'), menu = $('#ctxMenu'), cv = setup(area.querySelector('.ctxfx')), M = makeSmoke();
  const items = [...menu.querySelectorAll('[role=menuitem]')];
  const MW = 200, MH = 177, PAD = 40;
  let O = [0, 0], C0 = [0, 0], pending = null, lp = null, lpAt = 0, lpOpen = false;
  const bl = makeBloom({ w: MW, h: MH, r: 12, n: 120, M, el: menu, base: '',
    center: () => { const s = Math.max(0, bl ? bl.B.sc.x : 1); return [O[0] + (C0[0] - O[0]) * s, O[1] + (C0[1] - O[1]) * s]; },
    onClosed: () => { if (pending) { const p = pending; pending = null; openAt(...p); } } });
  const H = { top: spring(0), bot: spring(0), c: spring(0), idx: -1, dir: 0 };
  function setIdx(i, focus) {
    const prev = H.idx; H.idx = i;
    if (i >= 0) {
      const top = items[i].offsetTop, bot = top + items[i].offsetHeight;
      if (prev < 0) { H.top.x = top; H.bot.x = bot; H.top.v = H.bot.v = 0; H.dir = 0; }
      else if (i !== prev) H.dir = i > prev ? 1 : -1;
      H.top.t = top; H.bot.t = bot; H.c.t = 1;
      if (focus) items[i].focus({ preventScroll: true });
    } else H.c.t = 0;
    items.forEach((b, j) => { b.tabIndex = j === i ? 0 : -1; });
  }
  function openAt(x, y, kb) {
    if (bl.open || bl.closing) { pending = [x, y, kb]; if (bl.open) close(false); return; }
    const AW = area.clientWidth, AH = area.clientHeight;
    const mx = clamp(x, 6, Math.max(6, AW - MW - 6)), my = clamp(y, 6, Math.max(6, AH - MH - 6));
    menu.style.left = mx + 'px'; menu.style.top = my + 'px';
    menu.style.transformOrigin = `${x - mx}px ${y - my}px`;   // 从点下去的那个位置长出来
    O = [x + PAD, y + PAD]; C0 = [mx + MW / 2 + PAD, my + MH / 2 + PAD];
    bl.show();
    if (kb) requestAnimationFrame(() => setIdx(0, true)); else { setIdx(-1); menu.focus({ preventScroll: true }); }
  }
  function close(refocus) {
    if (!bl.open) return;
    const inside = menu.contains(document.activeElement);
    bl.hide(); setIdx(-1);
    if (refocus) area.focus({ preventScroll: true });
    else if (inside) setTimeout(() => { const a = document.activeElement; if (!a || a === document.body) area.focus({ preventScroll: true }); }, 0);   // 点了外面空白处：焦点回到区域上，不掉到页面最顶；点的是别的按钮就让给它
  }
  area.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (menu.contains(e.target) || performance.now() - lpAt < 700) return;
    if (lp) { clearTimeout(lp); lp = null; }
    const r = area.getBoundingClientRect();
    openAt(e.clientX - r.left - area.clientLeft, e.clientY - r.top - area.clientTop, false);
  });
  area.addEventListener('keydown', e => {
    if (e.target !== area) return;
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); openAt(area.clientWidth / 2 - MW / 2, area.clientHeight / 2 - MH / 2, true); }
  });
  area.addEventListener('pointerdown', e => {   // 手机：长按
    if (e.pointerType !== 'touch' || menu.contains(e.target)) return;
    const r = area.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, sx = e.clientX, sy = e.clientY;
    if (lp) clearTimeout(lp);
    lp = setTimeout(() => { lp = null; lpAt = performance.now(); lpOpen = true; openAt(x, y, false); }, 520);   // 松手那一下会落在刚冒出来的选项上：这一下不算
    const cancel = ev => { if (ev.type !== 'pointermove' || Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) { if (lp) { clearTimeout(lp); lp = null; } off(); } };
    const off = () => { area.removeEventListener('pointermove', cancel); area.removeEventListener('pointerup', cancel); area.removeEventListener('pointercancel', cancel); };
    area.addEventListener('pointermove', cancel); area.addEventListener('pointerup', cancel); area.addEventListener('pointercancel', cancel);
  });
  menu.addEventListener('keydown', e => {
    const n = items.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((H.idx + 1 + n) % n, true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(H.idx < 0 ? n - 1 : (H.idx - 1 + n) % n, true); }
    else if (e.key === 'Home') { e.preventDefault(); setIdx(0, true); }
    else if (e.key === 'End') { e.preventDefault(); setIdx(n - 1, true); }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') { e.preventDefault(); close(true); }
  });
  items.forEach((b, j) => {
    b.addEventListener('pointermove', () => { if (H.idx !== j) setIdx(j, true); });
    b.addEventListener('click', () => {
      if (lpOpen) { lpOpen = false; return; }
      const n = smokeK();
      if (n) { const s = Math.max(0, bl.B.sc.x), cx = O[0] + (C0[0] - O[0]) * s, cy = O[1] + (C0[1] - O[1]) * s, y = cy + (-MH / 2 + b.offsetTop + b.offsetHeight / 2) * s; smokeEmit(M, 3, cx + 60 * s, y, { vy: -40, jit: 20, spread: 30, spreadY: 6, r: 3.6, grow: 2.6, a: .3, life: .9, lift: 22 }); }
      close(true);
    });
  });
  menu.addEventListener('pointerleave', () => { setIdx(-1); if (menu.contains(document.activeElement)) menu.focus({ preventScroll: true }); });
  document.addEventListener('pointerdown', e => { lpOpen = false; if (bl.open && !menu.contains(e.target)) close(false); }, true);
  comps.push({
    step(dt) {
      bl.step(dt);
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, lead = H.dir > 0 ? H.bot : H.top, trail = H.dir > 0 ? H.top : H.bot;
      for (let i = 0; i < sub; i++) {
        if (H.dir === 0) { stepS(H.top, h, resp() * .7, Math.max(.5, zeta())); stepS(H.bot, h, resp() * .7, Math.max(.5, zeta())); }
        else { stepS(lead, h, resp() * .6, zeta()); stepS(trail, h, resp() * 1.3, Math.min(1, zeta() + .15)); }
        stepS(H.c, h, .1, 1);
      }
      items.forEach(b => {
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
      if (H.c.x > .01 && s > .5) {
        const s0 = Math.max(0, s), cx = O[0] + (C0[0] - O[0]) * s0, cy = O[1] + (C0[1] - O[1]) * s0;
        const y0 = cy + (-MH / 2 + H.top.x) * s, y1 = cy + (-MH / 2 + H.bot.x) * s, x0 = cx + (-MW / 2 + 4) * s, x1 = cx + (MW / 2 - 4) * s;
        const hh = (y1 - y0) * (.4 + .6 * H.c.x), ym = (y0 + y1) / 2;
        rrect(ctx, x0, ym - hh / 2, x1 - x0, hh, 8 * s); ctx.fillStyle = rgb(C.hl); ctx.fill();
      }
    },
  });
})();
