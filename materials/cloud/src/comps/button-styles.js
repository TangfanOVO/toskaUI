/* ================= 按钮样式：主要、次要、描边、幽灵、图标、加载中——同一种实心云，厚薄不同。
   停在上面：实心的慢慢冒小云，描边的边上浸出水往两边流，幽灵的从雾里凝出一块底；按下去都会被压扁，松手弹回来。
   加载中：身体缩成一颗，三滴水绕着它转，传完再胀回去 ================= */
(() => {
  const root = $('#btnStyles'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const rectOf = el => { const r = el.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height }; };
  const items = [...root.querySelectorAll('.bs')].map(el => {
    const k = el.dataset.k, it = { el, k, sc: spring(1), hov: false, idle: .1, K: k === 'ghost' ? makeCard(M) : null, ring: k === 'outline' ? focusRing(el, cv, { r: 20, M, visibleOnly: true }) : null, W: spring(1), load: 0, t: 0 };
    el.addEventListener('pointerenter', e => { it.hov = e.pointerType !== 'touch'; it.idle = .05; });
    el.addEventListener('pointerleave', () => { it.hov = false; it.sc.t = 1; });
    el.addEventListener('pointerdown', () => { if (!reduced) it.sc.t = .9; });
    el.addEventListener('pointerup', () => { it.sc.t = 1; });
    el.addEventListener('pointercancel', () => { it.sc.t = 1; });
    el.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && !reduced) { it.sc.x = .9; it.sc.v = 0; } });
    el.addEventListener('click', () => click(it));
    return it;
  });
  const col = it => it.k === 'secondary' ? C.track : C.body;
  function puff(it, n0) {
    const n = smokeK(); if (!n) return;
    const r = rectOf(it.el), c = col(it);
    smokeEmit(M, Math.round(n0 * (.5 + n)), r.x + r.w / 2, r.y + r.h / 2, { radial: 70, jit: 14, spread: r.w * .25, spreadY: 6, r: 3, grow: 3, a: .3, life: .9, lift: 14, col: c === C.body ? undefined : c });
  }
  function click(it) {
    if (it.k === 'outline') { it.ring.bump(); it.ring.bump(); puff(it, 3); return; }
    if (it.k === 'icon') { const on = it.el.getAttribute('aria-pressed') !== 'true'; it.el.setAttribute('aria-pressed', String(on)); if (on) puff(it, 8); return; }
    if (it.k === 'loading') {
      if (it.load) return;
      it.load = 1; it.t = 0; it.el.setAttribute('aria-busy', 'true'); it.el.querySelector('.bl').textContent = '上传中';
      return;
    }
    puff(it, it.k === 'ghost' ? 3 : 6);
  }
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub, n = smokeK();
      for (const it of items) {
        for (let i = 0; i < sub; i++) { stepS(it.sc, h, .24, reduced ? 1 : Math.max(.22, .5 - F.bounce * .35)); stepS(it.W, h, .32, reduced ? 1 : Math.max(.3, .6 - F.bounce * .3)); }
        const r = rectOf(it.el);
        if (it.k === 'ghost') {   // 幽灵：停上去才从雾里凝出一块底
          cardAim(it.K, r.x, r.y, r.x + r.w, r.y + r.h);
          if (it.hov || it.el.matches(':focus-visible')) cardShow(it.K); else cardHide(it.K);
          cardStep(it.K, dt); it.el.toggleAttribute('data-on', it.K.s.x > .55);
        }
        if (it.ring) it.ring.step(dt);
        if (it.k === 'loading' && it.load) {   // 加载中：缩成一颗 → 转一会儿 → 胀回去
          it.t += dt; it.W.t = it.t < 2.2 ? r.h / r.w : 1;
          if (it.t >= 2.2 && it.load === 1) { it.load = 2; it.el.removeAttribute('aria-busy'); it.el.querySelector('.bl').textContent = '完成'; if (n) puff(it, 6); }
          if (it.t >= 3.6) { it.load = 0; it.el.querySelector('.bl').textContent = '上传'; }
        }
        const solid = it.k === 'primary' || it.k === 'secondary' || it.k === 'icon' || it.k === 'loading';
        if (n && it.hov && solid && !it.load) {   // 停着：慢慢往上冒小云
          it.idle -= dt;
          if (it.idle <= 0) { it.idle = (.55 + Math.random() * .6) / (.45 + n); const c = col(it); cloudlet(M, r.x + r.w / 2 + J() * r.w * .5, r.y + 1, { r: 2.3, grow: 3.4, a: .27, life: 1.5, lift: 15, vy: -14, col: c === C.body ? undefined : c }); }
        }
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      for (const it of items) {
        const r = rectOf(it.el), s = it.sc.x, sx = 1 + (1 - s) * .45, sy = s, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        if (it.k === 'ghost') { cardDraw(ctx, k, it.K, 999, C.body); continue; }
        if (it.k === 'outline') { it.ring.draw(ctx, k); continue; }
        const c = col(it);
        let w = r.w * sx * (it.k === 'loading' ? clamp(it.W.x, .2, 1.2) : 1), hh = r.h * sy;
        if (it.k === 'loading' && it.load === 1) { const br = 1 + .05 * Math.sin(it.t * 9); w *= br; hh *= br; }
        goo(ctx, k, true, 9, c); ctx.fillStyle = rgb(c); rrect(ctx, cx - w / 2, cy - hh / 2, w, hh, Math.min(w, hh) / 2); ctx.fill();
        if (it.k === 'loading' && it.load === 1 && it.t > .25) {   // 三滴水绕着转，离身体近的时候连着
          const R = r.h * .62 + 3 * Math.sin(it.t * 3);
          for (let i = 0; i < 3; i++) { const a = it.t * 5.2 + i * TAU / 3, d = 3.4 + 1.2 * Math.sin(it.t * 7 + i); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, d * clamp((it.t - .25) * 4, 0, 1), 0, TAU); ctx.fill(); }
        }
        goo(ctx, k, false);
      }
    },
  });
})();

