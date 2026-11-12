/* ================= 分段选择：雾是本体 =================
   选中块是一团凝实的雾：平时有一层实心的芯，外面裹着一圈软雾；
   鼠标停到别的选项上，朝那边的雾慢慢化开；点击时芯散掉，雾一股一股飘过去，到了再凝回来。 */
(() => {
  const seg = $('#seg'), cv = setup(seg.querySelector('canvas')), tabs = [...seg.querySelectorAll('[role=radio]')];
  const PX = 30, PY = 60, TW = 72, IN = 4, TH = 34, HW = TW / 2, HH = TH / 2, M = makeSmoke(), hov = hovering(seg);
  const CY = PY + IN + HH, cxOf = i => PX + IN + i * TW + HW;
  const inStadium = (x, y) => { const e = Math.max(0, Math.abs(x) - (HW - HH)); return e * e + y * y <= HH * HH; };
  const G = { sel: 0, hover: -1, travel: false, c: spring(1), cs: spring(1), ext: spring(0), hs: 0, t: 0 };
  const fog = [];
  for (let i = 0; i < 96; i++) {
    let u, v; do { u = Math.random() * 2 - 1; v = Math.random() * 2 - 1; } while (!inStadium(u * HW, v * HH));
    fog.push({ u, v, x: cxOf(0) + u * HW * .8, y: CY + v * HH * .7, vx: 0, vy: 0, rs: .1 + Math.random() * .26,
      r: 4.5 + Math.random() * 4, a: .4 + Math.random() * .25, ph: Math.random() * TAU, w: .6 + Math.random() * 1.2,
      rot: Math.random() * TAU, spin: J() * .6, k: (Math.random() * 3) | 0 });
  }
  function select(i, focus) {
    if (i !== G.sel) {
      const dir = i > G.sel ? 1 : -1, n = smokeK();
      if (!reduced) {
        G.travel = true; G.c.t = 0; G.c.x = 0;   // 芯散掉，变回雾
        for (const f of fog) { f.vx += dir * (15 + Math.random() * 60) + J() * 30; f.vy += J() * (25 + 45 * deformK()); }
        if (n) smokeEmit(M, 3 + Math.round(4 * n), cxOf(G.sel), CY, { radial: 25, vx: -dir * 40, spread: 40, spreadY: 14, r: 4, grow: 4, a: .2, life: 1.1, lift: 4 });
      }
    }
    G.sel = i;
    tabs.forEach((b, j) => { b.setAttribute('aria-checked', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => {
      const n = tabs.length;
      if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + n) % n, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
    });
  });
  seg.addEventListener('pointermove', e => { const r = seg.getBoundingClientRect(); G.hover = clamp(Math.floor((e.clientX - r.left - IN) / TW), 0, tabs.length - 1); });
  seg.addEventListener('pointerleave', () => { G.hover = -1; });

  comps.push({
    step(dt) {
      G.t += dt;
      const n = smokeK(), dk = deformK(), tc = cxOf(G.sel);
      const other = G.hover >= 0 && G.hover !== G.sel && !reduced;
      if (other) G.hs = Math.sign(G.hover - G.sel);
      G.ext.t = other ? 1 : 0;
      const breathe = G.hover === G.sel && !reduced ? .08 : 0;   // 停在自己身上：轻轻往外呼一口
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let s = 0; s < sub; s++) {
        stepS(G.ext, h, .45, .9);                                   // 化开是慢慢的
        stepS(G.c, h, G.travel ? .14 : .2, 1);
        stepS(G.cs, h, .26, Math.max(.25, zeta() * .7));
      }
      let dsum = 0;
      for (const f of fog) {
        let tx = tc + f.u * HW * .8 * (1 + breathe), ty = CY + f.v * HH * .7 * (1 + breathe);
        if (G.ext.x > .01 && f.u * G.hs > 0) {   // 朝鼠标那边渗出一条雾舌
          const e = Math.pow(f.u * G.hs, 1.6);
          tx += G.hs * G.ext.x * (5 + 3 * Math.sin(G.t * 3 + f.ph)) * (.4 + dk) * e; ty += f.v * G.ext.x * 2 * e;   // 边缘只轻轻鼓动
        }
        tx += Math.sin(G.t * f.w + f.ph) * 1.2;
        ty += Math.cos(G.t * f.w * .8 + f.ph) * 1;
        if (G.travel) ty += Math.sin(G.t * 3.2 * f.w + f.ph) * 4 * dk;   // 飘的时候慢慢翻滚
        const [k, c] = kc(G.travel ? f.rs * (1.5 - F.speed * .7) * 2 : .18, G.travel ? .72 : .75);   // 稠一点：慢、不怎么回弹
        for (let s = 0; s < sub; s++) {
          f.vx += (-k * (f.x - tx) - c * f.vx) * h; f.vy += (-k * (f.y - ty) - c * f.vy) * h;
          f.x += f.vx * h; f.y += f.vy * h;
        }
        f.rot += f.spin * dt;
        dsum += Math.hypot(f.x - tx, f.y - ty);
        if (G.travel && n) {   // 一路像排气管一样往身后喷
          const sp = Math.hypot(f.vx, f.vy);
          if (sp > 140 && Math.random() < dt * 5 * n) smokeEmit(M, 1, f.x, f.y, { vx: -f.vx * .3, vy: J() * 12, r: 2.8, grow: 4.5, a: .22, life: .9, lift: 3 });
        }
      }
      if (reduced) { for (const f of fog) { f.x = tc + f.u * HW * .8; f.y = CY + f.v * HH * .7; f.vx = f.vy = 0; } G.travel = false; G.c.x = G.c.t = 1; }
      if (G.travel && dsum / fog.length < 5) {   // 到了：凝回来，再 q 一下
        G.travel = false; G.c.t = 1; G.cs.x = .9; G.cs.v = 0; G.cs.t = 1;
      }
      if (G.ext.x > .25 && n && !G.travel) {   // 雾舌：边上一直往外渗烟，一缕一缕朝鼠标流过去，边流边散
        G.leak = (G.leak || 0) + 36 * G.ext.x * (.4 + n) * dt;
        const r = cv.cv.getBoundingClientRect(), pxl = ptr.x - r.left, pyl = ptr.y - r.top;
        while (G.leak >= 1) {
          G.leak -= 1;
          const ex = tc + G.hs * (HW - 5), ey = CY + J() * TH * .55;
          const dx = pxl - ex, dy = (pyl - ey) * .5, dl = Math.hypot(dx, dy) || 1, sp = 25 + Math.random() * 45;
          smokeEmit(M, 1, ex, ey, { vx: (G.hs * .6 + dx / dl * .4) * sp, vy: dy / dl * .4 * sp + J() * 12, jit: 8, r: 3.2, grow: 4.2, a: .34, life: 1.15, lift: 2 });
        }
      }
      stirFog(fog, cv.cv, M);
      if (hov.on && n && !G.travel) {
        M.idle -= dt;
        if (M.idle <= 0) { M.idle = (.35 + Math.random() * .5) / (.45 + n); smokeEmit(M, 1, tc + J() * TW * .7, PY + IN, { vx: J() * 8, vy: -14, r: 2.6, grow: 4.5, a: .16, life: 1.8, lift: 16 }); }
      }
      smokeStep(M, dt);
      tabs.forEach((b, j) => {
        const on = j === G.sel && G.c.x > .5 ? '1' : '';
        if ((b.dataset.on || '') !== on) { if (on) b.dataset.on = '1'; else delete b.dataset.on; }
      });
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k, W = cv.W - PX * 2;
      smokeDraw(M, ctx, k);
      fogDraw(ctx, k, fog, .1 + .9 * (1 - G.c.x));   // 凝实时藏在芯里，散开时变成一团团实心云
      if (G.c.x > .01) {
        const tc = cxOf(G.sel), w = TW * G.cs.x, hh = TH * G.cs.x;
        ctx.globalAlpha = G.c.x;
        pill(ctx, tc - w / 2, CY - hh / 2, w, hh); ctx.fillStyle = rgb(C.body); ctx.fill();
        ctx.globalAlpha = 1;
      }
    },
  });
})();
