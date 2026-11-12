/* ================= 色块选择：选中框是一块实心，换颜色时流过去（前沿先到、后沿被拖着）；被选中的那块往外喷一小圈自己颜色的云。
   然后从那块滴下一滴新颜色，落到下面“幡幡的云”上，从落点往外染开；那块云停着时，顶上慢慢冒的小云也是这个颜色 ================= */
(() => {
  const root = $('#colorSwatchPicker'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), list = $('#swpList'), pill = $('#swpPill');
  const opts = [...list.querySelectorAll('[role=option]')], cols = opts.map(o => hex(o.dataset.c));
  let sel = opts.findIndex(o => o.getAttribute('aria-selected') === 'true'), pillCol = cols[sel].slice();
  const K = makeCard(M), D = makeDrop(9, M); D.s.x = D.s.t = 0;
  const FL = { r: spring(0), on: false, x: 0, y: 0, col: null, wait: false }, PH = { hov: false, idle: .2, sq: spring(1) };
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height, cx: r.left - c.left + r.width / 2, cy: r.top - c.top + r.height / 2 }; };
  const name = i => `${opts[i].getAttribute('aria-label')} · ${opts[i].dataset.c}`;
  const frame = (r, show) => { cardAim(K, r.x - 5, r.y - 5, r.x + r.w + 5, r.y + r.h + 5); if (show) cardShow(K); };
  const pillInk = c => { pill.style.color = inkOn(c); };
  pillInk(pillCol); $('#swpName').textContent = name(sel);
  requestAnimationFrame(() => { frame(rectOf(opts[sel]), false); K.open = true; K.s.x = K.s.t = 1; });   // 一打开就放好，不冒烟
  function pick(i, focus) {
    if (i === sel || i < 0 || i >= opts.length) { if (focus) opts[i]?.focus(); return; }
    const prev = sel; sel = i;
    opts.forEach((o, j) => { o.setAttribute('aria-selected', String(j === i)); o.tabIndex = j === i ? 0 : -1; });
    if (focus) opts[i].focus();
    $('#swpName').textContent = name(i);
    if (FL.on || FL.wait) { pillCol = (FL.col || pillCol).slice(); FL.on = FL.wait = false; pillInk(pillCol); }   // 上一滴还没染完：直接染完
    const r = rectOf(opts[i]), q = rectOf(opts[prev]), n = smokeK();
    frame(r, true);
    if (n) {
      smokeEmit(M, Math.round(5 * (.5 + n)), r.cx, r.cy, { radial: 55, jit: 10, r: 2.3, grow: 3.3, a: .3, life: 1, lift: 10, col: cols[i] });   // 选中的那块喷一圈自己颜色的云
      smokeEmit(M, 2, q.cx, q.y, { vy: -24, jit: 10, spread: 8, r: 2.4, grow: 3.2, a: .28, life: .9, lift: 16, col: cols[prev] });   // 离开的那块冒一小团
    }
    const p = rectOf(pill);
    FL.col = cols[i].slice(); FL.x = p.cx + clamp(r.cx - p.cx, -p.w / 2 + 14, p.w / 2 - 14); FL.y = p.y + 4;
    if (reduced) { pillCol = FL.col.slice(); pillInk(pillCol); return; }
    dropTo(D, r.cx, r.y + r.h, true); D.s.x = .4; D.s.v = 0; D.s.t = 1; dropTo(D, FL.x, FL.y); FL.wait = true;   // 滴下一滴，流到下面那块云上
  }
  list.addEventListener('click', e => { const o = e.target.closest('[role=option]'); if (o) pick(opts.indexOf(o), true); });
  list.addEventListener('keydown', e => {
    const i = opts.indexOf(document.activeElement); if (i < 0) return;
    const m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (m) { e.preventDefault(); pick((i + m + opts.length) % opts.length, true); }
    else if (e.key === 'Home') { e.preventDefault(); pick(0, true); }
    else if (e.key === 'End') { e.preventDefault(); pick(opts.length - 1, true); }
  });
  pill.addEventListener('pointerenter', e => { PH.hov = e.pointerType !== 'touch'; PH.idle = .05; });
  pill.addEventListener('pointerleave', () => { PH.hov = false; });
  addEventListener('resize', () => frame(rectOf(opts[sel]), false));
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, n = smokeK(), p = rectOf(pill);
      cardStep(K, dt); dropStep(D, dt);
      if (FL.wait && D.placed && !D.moving && Math.hypot(D.hx.x - FL.x, D.hy.x - FL.y) < 3) {   // 那滴落到了：从落点往外染开
        FL.wait = false; FL.on = true; FL.r.x = 4; FL.r.v = 0; FL.r.t = Math.hypot(p.w, p.h) + 8; D.s.t = 0; D.s.x = 0;
        PH.sq.x = .9; PH.sq.v = 0;
        if (n) smokeEmit(M, Math.round(3 * (.5 + n)), FL.x, FL.y, { vy: -30, jit: 18, spread: 6, r: 2.4, grow: 3.3, a: .3, life: 1, lift: 14, col: FL.col });
      }
      for (let i = 0; i < sub; i++) { stepS(FL.r, h, .5 + (1 - F.speed) * .2, 1); stepS(PH.sq, h, .3, Math.max(.28, zeta() * .6)); }
      if (FL.on && FL.r.x > FL.r.t - 2) { FL.on = false; pillCol = FL.col.slice(); }
      if (FL.on && FL.r.x > Math.hypot(p.w, p.h) * .45) pillInk(FL.col);
      if (n && PH.hov) { PH.idle -= dt; if (PH.idle <= 0) { PH.idle = (.5 + Math.random() * .6) / (.45 + n); cloudlet(M, p.cx + J() * p.w * .5, p.y + 1, { r: 2.4, grow: 3.4, a: .28, life: 1.5, lift: 15, vy: -14, col: FL.on ? FL.col : pillCol }); } }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, p = rectOf(pill);
      smokeDraw(M, ctx, k);
      cardDraw(ctx, k, K, 13, C.body);                                                       // 选中框：一块实心
      const [fx, fy, fw, fh, fs] = cardRect(K);
      if (fs > .02) { rrect(ctx, fx + 2.5, fy + 2.5, fw - 5, fh - 5, 11 * fs); ctx.fillStyle = rgb(C.bg); ctx.fill(); }   // 中间一圈底色，跟色块隔开
      opts.forEach((o, i) => { const r = rectOf(o); rrect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fillStyle = rgb(cols[i]); ctx.fill(); });   // 色块不带软边：压在选中框上也不会晕出一圈
      const sq = PH.sq.x, pw = p.w * (2 - sq), ph = p.h * sq, px = p.cx - pw / 2, py = p.y + p.h - ph;   // 下面那块云：落上一滴时被压一下
      goo(ctx, k, true, 10, pillCol); rrect(ctx, px, py, pw, ph, ph / 2); ctx.fillStyle = rgb(pillCol); ctx.fill(); goo(ctx, k, false);
      if (FL.on) { ctx.save(); rrect(ctx, px, py, pw, ph, ph / 2); ctx.clip(); ctx.beginPath(); ctx.arc(FL.x, FL.y, Math.max(0, FL.r.x), 0, TAU); ctx.fillStyle = rgb(FL.col); ctx.fill(); ctx.restore(); }
      dropDraw(ctx, k, D, FL.col || cols[sel]);
    },
  });
})();
