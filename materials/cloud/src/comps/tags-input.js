/* ================= 标签输入 ================= */
(() => {
  const box = $('#tags'), cv = setup(box.querySelector('canvas')), input = $('#tagIn'), M = makeSmoke();
  const chips = [], ring = focusRing(box, cv, { r: 12, M, inputs: [input] });
  function add(text, animate) {
    const el = document.createElement('span'); el.className = 'chip';
    const t = document.createElement('span'); t.textContent = text;
    const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', `删除 ${text}`); x.textContent = '×';
    el.append(t, x); box.insertBefore(el, input);
    const ch = { el, text, sc: spring(animate && !reduced ? .3 : 1), dead: false, fresh: animate };
    ch.sc.t = 1;
    x.addEventListener('click', () => remove(ch, true));
    chips.push(ch);
  }
  function remove(ch, focusInput) {
    if (ch.dead) return;
    ch.dead = true; ch.sc.t = 0;
    const [x, y] = centerIn(ch.el, cv), n = smokeK();
    if (n) smokeEmit(M, 4 + Math.round(4 * n), x, y, { spread: 18, spreadY: 6, vy: -30, jit: 20, r: 4, grow: 2.6, a: .32, life: 1, lift: 24 });
    if (focusInput) input.focus();
  }
  ['云', '雾', '烟'].forEach(t => add(t, false));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const t = input.value.trim();
      if (t && chips.filter(c => !c.dead).length < 6 && !chips.some(c => !c.dead && c.text === t)) { add(t.slice(0, 8), true); input.value = ''; }
    }
    if (e.key === 'Backspace' && !input.value && !e.repeat) { const last = [...chips].reverse().find(c => !c.dead); if (last) remove(last, false); }
  });
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = chips.length - 1; i >= 0; i--) {
        const ch = chips[i];
        for (let j = 0; j < sub; j++) stepS(ch.sc, h, ch.dead ? .12 : .26, ch.dead || reduced ? 1 : Math.max(.28, .55 - F.bounce * .35));
        if (ch.fresh) {   // 刚冒出来：边上溅一圈小云
          ch.fresh = false; const n = smokeK();
          if (n) { const [x, y] = centerIn(ch.el, cv); smokeEmit(M, Math.round(4 + 4 * n), x, y, { radial: 50, spreadY: 4, r: 3, grow: 2.6, a: .3, life: .7, lift: 8 }); }
        }
        const s = Math.max(0, ch.sc.x);
        ch.el.style.transform = `scale(${s.toFixed(4)})`;
        ch.el.style.opacity = clamp((s - .5) / .4, 0, 1).toFixed(3);
        if (ch.dead && s < .05) { ch.el.remove(); chips.splice(i, 1); }
      }
      ring.step(dt); smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, b = cv.cv.getBoundingClientRect();
      smokeDraw(M, ctx, cv.k); ring.draw(ctx, cv.k);
      ctx.fillStyle = rgb(C.body);
      for (const ch of chips) {
        const r = ch.el.getBoundingClientRect();
        if (r.width < 2) continue;
        rrect(ctx, r.left - b.left, r.top - b.top, r.width, r.height, r.height / 2); ctx.fill();
      }
    },
  });
})();
