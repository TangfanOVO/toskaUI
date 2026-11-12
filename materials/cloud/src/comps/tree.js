/* ================= 树：选中的那一行是一块实心，换行时上下流过去；展开文件夹，左边的引线跟着往下长 ================= */
(() => {
  const root = $('#tree'), ul = root.querySelector('.trows'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const DATA = [{ n: '组件', open: true, c: [{ n: '按钮.vue' }, { n: '开关.vue' }, { n: '弹层', c: [{ n: '对话框.vue' }, { n: '菜单.vue' }] }] }, { n: '样式', c: [{ n: '云.css' }, { n: '颜色.css' }] }, { n: 'README.md' }];
  const walk = (arr, lv, par) => arr.forEach((d, i) => { d.lv = lv; d.par = par; d.pos = i + 1; d.size = arr.length; d.g = d.g || spring(d.open ? 1 : 0); if (d.c) walk(d.c, lv + 1, d); });
  walk(DATA, 1, null);
  let rows = [], sel = DATA[0].c[0], focus = sel;
  const S = makeSlab();
  function vis(arr, out = []) { for (const d of arr) { out.push(d); if (d.c && d.open) vis(d.c, out); } return out; }
  function render(keepFocus) {
    rows = vis(DATA); ul.textContent = '';
    for (const d of rows) {
      const li = document.createElement('li'); d.el = li;
      li.setAttribute('role', 'treeitem'); li.setAttribute('aria-level', d.lv); li.setAttribute('aria-setsize', d.size); li.setAttribute('aria-posinset', d.pos);
      li.setAttribute('aria-selected', String(d === sel)); if (d.c) li.setAttribute('aria-expanded', String(!!d.open));
      li.tabIndex = d === focus ? 0 : -1; li.style.paddingLeft = (6 + (d.lv - 1) * 18) + 'px';
      li.innerHTML = `<span class="tw" aria-hidden="true">${d.c ? '▸' : ''}</span>`; li.append(d.n);
      li.addEventListener('click', () => { focus = d; if (d.c) toggle(d); select(d); });
      ul.appendChild(li);
    }
    if (keepFocus && focus.el) focus.el.focus();
  }
  function select(d) { sel = d; rows.forEach(x => x.el.setAttribute('aria-selected', String(x === d))); move(d); }
  function move(d) { focus = d; rows.forEach(x => { x.el.tabIndex = x === d ? 0 : -1; }); d.el.focus(); }
  function toggle(d, open = !d.open) {
    if (!d.c || d.open === open) return;
    d.open = open; d.g.t = open ? 1 : 0; if (open) { d.g.x = 0; d.g.v = 0; } if (reduced) d.g.x = d.g.t;
    if (!open) { let p = sel.par; while (p) { if (p === d) { sel = d; break; } p = p.par; } let q = focus.par; while (q) { if (q === d) { focus = d; break; } q = q.par; } }
    render(true);
  }
  ul.addEventListener('keydown', e => {
    const i = rows.indexOf(focus); let d = null;
    if (e.key === 'ArrowDown') d = rows[Math.min(rows.length - 1, i + 1)];
    else if (e.key === 'ArrowUp') d = rows[Math.max(0, i - 1)];
    else if (e.key === 'Home') d = rows[0];
    else if (e.key === 'End') d = rows[rows.length - 1];
    else if (e.key === 'ArrowRight') { if (focus.c && !focus.open) { e.preventDefault(); toggle(focus, true); return; } if (focus.c) d = focus.c[0]; }
    else if (e.key === 'ArrowLeft') { if (focus.c && focus.open) { e.preventDefault(); toggle(focus, false); return; } d = focus.par; }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (focus.c) toggle(focus); select(focus); return; }
    if (!d) return; e.preventDefault(); move(d);
  });
  render(false);
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      const all = []; (function f(a) { for (const d of a) { all.push(d); if (d.c) f(d.c); } })(DATA);
      for (const d of all) if (d.c) for (let i = 0; i < sub; i++) stepS(d.g, h, resp() * 1.2, Math.max(.6, zeta()));
      const c = cv.cv.getBoundingClientRect(), r = sel.el && sel.el.isConnected ? sel.el.getBoundingClientRect() : null;
      if (r) { slabAim(S, r.top - c.top, r.bottom - c.top); this.x0 = r.left - c.left; this.x1 = r.right - c.left; }
      slabStep(S, dt);
      if (S.dir && this.x1) { const tr = S.dir > 0 ? S.a : S.b; trailPuffs(M, dt, this.x1 + 4, tr.x, 0, tr.v, .6); }
      this.lines = rows.filter(d => d.c && d.open && d.g.x > .01).map(d => {   // 打开的文件夹：从它下面往最后一个看得见的子孙那行长一根引线
        let last = d; while (last.c && last.open && last.c.length) last = last.c[last.c.length - 1];
        const a = d.el.getBoundingClientRect(), b = last.el.getBoundingClientRect();
        return [a.left - c.left + 6 + 7, a.bottom - c.top - 4, (b.top - c.top + b.height / 2 - (a.bottom - c.top - 4)) * clamp(d.g.x, 0, 1)];
      });
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.track);
      for (const [x, y, len] of this.lines || []) if (len > 1) { rrect(ctx, x - 1, y, 2, len, 1); ctx.fill(); }
      if (this.x1) {
        const a = Math.min(S.a.x, S.b.x), b = Math.max(S.a.x, S.b.x), L = Math.max(6, b - a), w = (this.x1 - this.x0) * clamp(Math.sqrt(30 / L), .8, 1);
        goo(ctx, k, true, 8); rrect(ctx, this.x0 + (this.x1 - this.x0 - w) / 2, a, w, L, 8); ctx.fillStyle = rgb(C.body); ctx.fill(); goo(ctx, k, false);
      }
    },
  });
})();
