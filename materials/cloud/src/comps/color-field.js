/* ================= 颜色输入：框上的水就是这个颜色——鼠标停在上面，选中色的水顺着框边流、顶上冒同色的小云；
   打对一个颜色，水和小方块慢慢变过去；回车确认，小方块 q 一下，往外喷一圈新颜色的云；打错了，框左右晃一下，回到原来的颜色 ================= */
(() => {
  const root = $('#colorField'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), inp = $('#cfIn'), sw = $('#cfSw');
  let ok = parseHex(inp.value), tgt = ok.slice(), shown = ok.slice();
  const P = spring(1), W = spring(0);
  const ring = focusRing(inp, cv, { M, inputs: [inp], col: () => visCol(shown) });
  const paint = () => { sw.style.setProperty('--c', rgb(shown)); };
  paint();
  function burst(c, big) {   // 小方块那儿喷一圈新颜色的云
    const n = smokeK(); if (!n) return;
    const a = sw.getBoundingClientRect(), b = cv.cv.getBoundingClientRect(), x = a.left + a.width / 2 - b.left, y = a.top + a.height / 2 - b.top;
    smokeEmit(M, Math.round((big ? 7 : 3) * (.5 + n)), x, y, { radial: big ? 70 : 40, jit: 12, r: 2.6, grow: 3.4, a: .3, life: 1.1, lift: 12, col: c });
  }
  function commit(fromKey) {
    const c = parseHex(inp.value);
    if (!c) { inp.value = toHex(ok); tgt = ok.slice(); if (!reduced) { W.v = 300; W.x = 0; } inp.setAttribute('aria-invalid', 'false'); return; }   // 打错了：晃一下，回到原来的
    const changed = toHex(c) !== toHex(ok); ok = c; tgt = c.slice(); inp.value = toHex(c); inp.setAttribute('aria-invalid', 'false');
    if (changed || fromKey) { if (!reduced) { P.x = 1.45; P.v = 0; } burst(c, true); }
  }
  inp.addEventListener('input', () => { const c = parseHex(inp.value); if (c) tgt = c; inp.setAttribute('aria-invalid', String(!c && inp.value.replace('#', '').length >= 6)); });   // 打对了，水先慢慢变过去
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commit(true); return; }
    if (e.key === 'Escape') { inp.value = toHex(ok); tgt = ok.slice(); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {   // 亮一点／暗一点
      e.preventDefault();
      const [h, s, v] = rgb2hsv(parseHex(inp.value) || ok), dv = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? .1 : .04);
      const c = hsv2rgb(h, s, clamp(v + dv, 0, 1)); ok = c; tgt = c.slice(); inp.value = toHex(c);
      if (!e.repeat && !reduced) { P.x = 1.2; P.v = 0; } ring.bump();
    }
  });
  inp.addEventListener('blur', () => commit(false));
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) { stepS(P, h, .3, Math.max(.3, zeta() * .6)); stepS(W, h, .16, .18); }
      shown = reduced ? tgt.slice() : colTo(shown, tgt, dt, .18); paint();
      sw.style.transform = Math.abs(P.x - 1) > .002 ? `scale(${P.x.toFixed(3)})` : '';
      inp.style.transform = Math.abs(W.x) > .05 ? `translateX(${W.x.toFixed(2)}px)` : '';
      ring.step(dt); smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); ring.draw(cv.ctx, cv.k); },
  });
})();

