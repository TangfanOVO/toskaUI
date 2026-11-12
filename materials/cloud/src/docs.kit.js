/* ================= 文档站自己用的云控件：分段选择、开关、整页换日夜的水流 =================
   跟组件用同一套公式和手感（F），文档站的“自定义”一调，站上这些控件也跟着变 */

// 分段选择（预览／代码、预设、弹层……）：选中的是一块实心，换的时候前沿先到、后沿被拖着流过去；离开的那格冒一小团
function docSeg(box, o = {}) {
  const btns = [...box.querySelectorAll('button')], cv = setup(box.querySelector('canvas')), M = makeSmoke(), K = makeCard(null);
  const tabs = box.getAttribute('role') === 'tablist', attr = tabs ? 'aria-selected' : 'aria-pressed';
  let sel = btns.findIndex(b => b.getAttribute(attr) === 'true'), first = true;
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }; };
  const mark = () => btns.forEach((b, i) => { b.setAttribute(attr, String(i === sel)); if (tabs) b.tabIndex = i === sel || (sel < 0 && i === 0) ? 0 : -1; });
  function set(i, user) {
    if (i === sel) return;
    const prev = sel; sel = i; mark();
    const n = smokeK();
    if (user && n && prev >= 0 && i >= 0) { const q = rectOf(btns[prev]); cloudlet(M, q.x + q.w / 2, q.y + 2, { r: 2.2, grow: 3.2, a: .28, life: 1, lift: 14, vy: -16 }); }
    if (user && o.onChange) o.onChange(i >= 0 ? btns[i].dataset.v : null, i);
  }
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (b && btns.includes(b)) set(btns.indexOf(b), true); });
  if (tabs) box.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault(); const i = (Math.max(0, sel) + d + btns.length) % btns.length; set(i, true); btns[i].focus();
  });
  mark();
  comps.push({
    cvo: cv,
    step(dt) {
      if (sel >= 0) {
        const r = rectOf(btns[sel]); if (r.w < 1) return;
        cardAim(K, r.x, r.y, r.x + r.w, r.y + r.h);
        if (first) { K.open = true; K.s.x = K.s.t = 1; first = false; } else cardShow(K);   // 第一次直接放好，不冒烟
      } else cardHide(K);
      cardStep(K, dt); smokeStep(M, dt);
      const [x, y, w, h, s] = cardRect(K), cx = x + w / 2;
      btns.forEach(b => { const r = rectOf(b), on = s > .55 && Math.abs(cx - (r.x + r.w / 2)) < r.w * .42; if (on !== b.hasAttribute('data-on')) b.toggleAttribute('data-on', on); });   // 实心流到了，字才反色
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); cardDraw(cv.ctx, cv.k, K, 999, C.body); },
  });
  return { set: v => set(btns.findIndex(b => b.dataset.v === v), false), get value() { return sel >= 0 ? btns[sel].dataset.v : null; } };
}

// 开关（日夜、减弱动态）：圆头是一滴实心，拨的时候头先过去、尾巴被拖着，到了 q 一下；可以带一个图标跟着圆头走
function docSwitch(btn, o = {}) {
  const cv = setup(btn.querySelector('canvas')), M = makeSmoke(), D = makeDrop(o.R || 10, M), icon = btn.querySelector('.knob-ic');
  let on = btn.getAttribute('aria-checked') === 'true', placed = false;
  const R = o.R || 10, pad = o.pad ?? 4;
  const spot = () => { const r = btn.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left + (on ? r.width - pad - R : pad + R), r.top - c.top + r.height / 2, r.left - c.left]; };
  function set(v, user) {
    if (v === on) return; on = v; btn.setAttribute('aria-checked', String(on));
    const [x, y] = spot(); dropTo(D, x, y);
    if (user && smokeK()) smokeEmit(M, 2, D.tx.x, D.ty.x, { vx: on ? -40 : 40, jit: 12, r: 2.2, grow: 3.2, a: .28, life: .8, lift: 10 });
    if (icon) icon.dataset.s = on ? 'on' : 'off';
    if (user && o.onChange) o.onChange(on, btn);
  }
  btn.addEventListener('click', () => set(!on, true));
  if (icon) icon.dataset.s = on ? 'on' : 'off';
  comps.push({
    cvo: cv,
    step(dt) {
      const [x, y, left] = spot();
      if (!placed) { dropTo(D, x, y, true); placed = true; }
      else if (!D.moving && Math.hypot(D.hx.t - x, D.hy.t - y) > .5) dropTo(D, x, y, true);   // 版面挪了：跟着走
      dropStep(D, dt); smokeStep(M, dt);
      if (icon) icon.style.transform = `translate(${(D.hx.x - left - 8).toFixed(1)}px,-50%)`;
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); dropDraw(cv.ctx, cv.k, D); },
  });
  return { set: v => set(v, false), get on() { return on; } };
}

// 换日夜：新的那一页像水一样从开关那儿漫过整页。用 View Transition：旧页面是底，新页面被一圈会流的水边框住，水边一路往外漫；
// 水边上有一道组件色的浪头，前面伸出几根水舌。浏览器不支持或者开了“减弱动态效果”，就直接换
function pageSweep(apply, ox, oy) {
  if (!document.startViewTransition || reduced) { apply(); return; }
  const W = innerWidth, H = innerHeight, Rmax = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) * 1.3, P = 140, DUR = 1050;
  const fingers = Array.from({ length: 7 }, () => ({ a: Math.random() * TAU, w: .07 + Math.random() * .1, lead: .06 + Math.random() * .12, sp: .6 + Math.random() * .8 }));
  const ease = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  const shape = u => {   // 时间 u（0→1）时水边上的 P 个点
    const R = ease(u) * Rmax + 2, grow = Math.sin(Math.PI * Math.min(1, u * 1.15)), pts = [];
    for (let j = 0; j < P; j++) {
      const th = j / P * TAU;
      let r = R * (1 + .05 * Math.sin(th * 5 + u * 9) + .03 * Math.sin(th * 11 - u * 14 + 1.3));
      for (const f of fingers) { const d = Math.abs((((th - f.a) % TAU) + TAU + Math.PI) % TAU - Math.PI); r += R * f.lead * grow * Math.exp(-((d / f.w) ** 2)) * (.7 + .3 * Math.sin(u * 7 * f.sp)); }
      pts.push([ox + Math.cos(th) * r, oy + Math.sin(th) * r]);
    }
    return pts;
  };
  const N = 56, frames = [];
  for (let i = 0; i <= N; i++) frames.push({ clipPath: `path('M${shape(i / N).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')} Z')` });
  const vt = document.startViewTransition(() => { apply(); return new Promise(r => setTimeout(r, 30)); });
  vt.ready.then(() => {
    const anim = document.documentElement.animate(frames, { duration: DUR, easing: 'linear', pseudoElement: '::view-transition-new(root)' });
    // 浪头：画在新页面最上面的一层画布上（它也被同一圈水边框住，所以只看得见贴着水边的那一道）
    const fx = document.createElement('canvas'); fx.className = 'sweepfx'; fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(fx);
    const k = Math.min(devicePixelRatio || 1, 2); fx.width = W * k; fx.height = H * k;
    const ctx = fx.getContext('2d'), col = rgb(C.body);
    const tick = () => {
      const u = clamp((anim.currentTime || 0) / DUR, 0, 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fx.width, fx.height); ctx.setTransform(k, 0, 0, k, 0, 0);
      if (u < 1) {
        const pts = shape(u), lw = 16 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 2;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineJoin = 'round'; ctx.lineWidth = lw * 2;
        ctx.shadowColor = col; ctx.shadowBlur = 10 * k;
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
        for (let i = 0; i < pts.length; i += 9) {   // 浪头后面跟着的几颗水珠
          const p = pts[i], dx = p[0] - ox, dy = p[1] - oy, L = Math.hypot(dx, dy) || 1, back = lw * (2.2 + Math.sin(i * 1.7 + u * 20)), r = lw * (.35 + .25 * Math.sin(i * 2.3 + u * 11));
          if (r > .5) { ctx.beginPath(); ctx.arc(p[0] - dx / L * back, p[1] - dy / L * back, r, 0, TAU); ctx.fill(); }
        }
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    vt.finished.finally(() => fx.remove());
  }).catch(() => {});
}

window.Cloud = { seg: docSeg, toggle: docSwitch, sweep: pageSweep, setFeel: f => Object.assign(F, f), get reduced() { return reduced; } };
