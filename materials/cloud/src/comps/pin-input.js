/* ================= 验证码输入：每填一位，四周的雾聚过来凝成实心格 ================= */
(() => {
  const root = $('#pin'), cv = setup(root.querySelector('canvas')), msg = $('#pinMsg'), M = makeSmoke();
  const ins = [...root.querySelectorAll('input')], N = ins.length;
  const cells = ins.map(inp => { const it = makeCondense(16, 3); it.inp = inp; it.cell = inp.parentElement; it.on = false; it.waveAt = 0; return it; });
  const rings = cells.map(it => focusRing(it.cell, cv, { r: 10, M, inputs: [it.inp] }));
  let t = 0, said = '';
  const code = () => ins.map(i => i.value).join('');
  function setCell(i, ch, quiet) {
    const it = cells[i], [x, y] = centerIn(ins[i], cv);
    it.ch = ch || '';
    if (ch) {
      ins[i].value = ch;
      if (it.on) { if (!reduced) { it.cs.x = .86; it.cs.v = 0; } }   // 改了一位：轻轻弹一下
      else { it.on = true; condenseOn(it, x, y, 14); }
    } else {
      ins[i].value = '';
      if (it.on) { it.on = false; condenseOff(it, M, x, y, quiet); }
    }
  }
  function check() {   // 每出现一串新的完整验证码，就报一次、弹一遍
    const v = code(), full = v.length === N;
    if (full && v !== said) { said = v; msg.textContent = `已填好：${v}`; cells.forEach((it, i) => { it.waveAt = t + .12 + i * .07; }); }
    else if (!full && said) { said = ''; msg.textContent = `输入 ${N} 位数字`; }
  }
  function spread(from, ds) {   // 一次进来好几位（粘贴、短信自动填）：从这一格往后铺
    let i = from;
    for (const ch of ds) { if (i >= N) break; setCell(i, ch); i++; }
    ins[Math.min(i, N - 1)].focus();
    check();
  }
  ins.forEach((inp, i) => {
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('input', e => {
      const it = cells[i], ds = inp.value.replace(/\D/g, '');
      if (!ds) {
        if ((e.inputType || '').startsWith('delete')) { setCell(i, ''); check(); }
        else inp.value = it.ch || '';   // 打的不是数字：原样放回去，不动这一格
        return;
      }
      if (ds.length > 2 || (ds.length === 2 && !it.ch)) { inp.value = it.ch || ''; spread(i, ds); return; }   // 一次进来好几位
      setCell(i, ds.slice(-1));
      if (i < N - 1) ins[i + 1].focus();
      check();
    });
    inp.addEventListener('paste', e => {
      const ds = (e.clipboardData ? e.clipboardData.getData('text') : '').replace(/\D/g, '');
      if (!ds) return;
      e.preventDefault(); spread(i, ds);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (inp.value) setCell(i, '', e.repeat);
        else if (i > 0) { setCell(i - 1, '', e.repeat); ins[i - 1].focus(); }
        check();
      } else if (e.key === 'Delete') { e.preventDefault(); setCell(i, '', e.repeat); check(); }
      else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); ins[i - 1].focus(); }
      else if (e.key === 'ArrowRight' && i < N - 1) { e.preventDefault(); ins[i + 1].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); ins[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); ins[N - 1].focus(); }
    });
  });
  comps.push({
    step(dt) {
      t += dt;
      const n = smokeK();
      for (const it of cells) {
        const [x, y] = centerIn(it.inp, cv); it.x = x; it.y = y;
        condenseStep(it, x, y, 12, t, dt);
        if (it.waveAt && t >= it.waveAt) {   // 填满：一排依次弹一下，顶上冒一小团
          it.waveAt = 0;
          if (!reduced && it.on) { it.cs.x = .76; it.cs.v = 0; it.cs.t = 1; if (n) smokeEmit(M, 2, x, y - 22, { vy: -36, jit: 14, spread: 6, r: 2.8, grow: 3, a: .3, life: .9, lift: 20 }); }
        }
        const f = it.c.x > .5 ? '1' : '';
        if ((it.cell.dataset.f || '') !== f) { if (f) it.cell.dataset.f = f; else delete it.cell.dataset.f; }
      }
      rings.forEach(r => r.step(dt)); smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k); rings.forEach(r => r.draw(ctx, k));
      for (const it of cells) {
        fogDraw(ctx, k, it.ps, it.vis.x);
        if (it.c.x > .01) { const w = 40 * it.cs.x, h = 46 * (2 - it.cs.x); ctx.globalAlpha = it.c.x; rrect(ctx, it.x - w / 2, it.y - h / 2, w, h, 10); ctx.fillStyle = rgb(C.body); ctx.fill(); ctx.globalAlpha = 1; }
      }
    },
  });
})();
