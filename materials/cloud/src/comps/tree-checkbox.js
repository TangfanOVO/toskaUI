/* ================= 树 · 带勾选：勾上一个文件夹，下面的全跟着勾上，一格接一格凝出实心；只勾了一部分，文件夹是半选（实心小一圈）；
   取消时那一格化成小云往上飘。点小三角展开，左右键也能开合，空格勾选 ================= */
(() => {
  const root = $('#treeC'), ul = root.querySelector('.tcrows'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const DATA = [{ n: '照片', open: true, c: [{ n: '云.png', on: true }, { n: '晚霞.jpg' }, { n: '旅行', c: [{ n: '海边.jpg' }, { n: '山上.jpg' }] }] }, { n: '文档', c: [{ n: '笔记.md', on: true }, { n: '计划.pdf', on: true }] }, { n: '设置.json' }];
  const walk = (arr, lv, par) => arr.forEach((d, i) => { d.lv = lv; d.par = par; d.pos = i + 1; d.size = arr.length; d.f = spring(0); d.on = !!d.on; if (d.c) walk(d.c, lv + 1, d); });
  walk(DATA, 1, null);
  const leaves = d => d.c ? d.c.flatMap(leaves) : [d];
  const state = d => { if (!d.c) return d.on ? 'true' : 'false'; const l = leaves(d), k = l.filter(x => x.on).length; return k === 0 ? 'false' : k === l.length ? 'true' : 'mixed'; };
  const all = (arr, out = []) => { for (const d of arr) { out.push(d); if (d.c) all(d.c, out); } return out; };
  for (const d of all(DATA)) { const s = state(d); d.f.x = d.f.t = s === 'true' ? 1 : s === 'mixed' ? .5 : 0; }
  let rows = [], focus = DATA[0];
  function vis(arr, out = []) { for (const d of arr) { out.push(d); if (d.c && d.open) vis(d.c, out); } return out; }
  const SVG = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><path d="M4.5 9.3l3 3 6-6.4"/></svg><svg class="mx" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 9h8"/></svg>';
  function render(keep) {
    rows = vis(DATA); ul.textContent = '';
    for (const d of rows) {
      const li = document.createElement('li'); d.el = li;
      li.setAttribute('role', 'treeitem'); li.setAttribute('aria-level', d.lv); li.setAttribute('aria-setsize', d.size); li.setAttribute('aria-posinset', d.pos);
      li.setAttribute('aria-checked', state(d)); if (d.c) li.setAttribute('aria-expanded', String(!!d.open));
      li.tabIndex = d === focus ? 0 : -1; li.style.paddingLeft = (4 + (d.lv - 1) * 20) + 'px';
      li.innerHTML = `<span class="tw" aria-hidden="true">${d.c ? '▸' : ''}</span><span class="tcb">${SVG}</span>`; li.append(d.n);
      li.querySelector('.tw').addEventListener('click', e => { if (d.c) { e.stopPropagation(); focus = d; toggleOpen(d); } });
      li.addEventListener('click', () => { focus = d; check(d); });
      ul.appendChild(li);
    }
    if (keep && focus.el) focus.el.focus();
  }
  function sync() { for (const d of all(DATA)) { const s = state(d); d.f.t = s === 'true' ? 1 : s === 'mixed' ? .5 : 0; if (reduced) d.f.x = d.f.t; if (d.el) d.el.setAttribute('aria-checked', s); } }
  function check(d) {
    const on = state(d) !== 'true', n = smokeK();
    for (const l of leaves(d)) l.on = on;
    sync();
    if (n && d.el) { const b = d.el.querySelector('.tcb'), [x, y] = centerIn(b, cv); smokeEmit(M, on ? 3 : 4, x, y - (on ? 0 : 6), on ? { radial: 40, jit: 8, r: 2.2, grow: 3, a: .3, life: .7, lift: 8 } : { vy: -26, jit: 10, r: 2.6, grow: 3, a: .3, life: .9, lift: 18 }); }
    // 子项一个接一个凝出来：越往下越晚一点
    if (on && !reduced) leaves(d).forEach((l, i) => { l.f.x = Math.min(l.f.x, 0); l.f.v = 0; l.delay = i * .06; });
    d.el && d.el.focus();
  }
  function toggleOpen(d, open = !d.open) { if (!d.c || d.open === open) return; d.open = open; render(true); }
  ul.addEventListener('keydown', e => {
    const i = rows.indexOf(focus); if (i < 0) return;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); const j = clamp(i + (k === 'ArrowDown' ? 1 : -1), 0, rows.length - 1); focus = rows[j]; rows.forEach(x => { x.el.tabIndex = x === focus ? 0 : -1; }); focus.el.focus(); }
    else if (k === 'ArrowRight') { e.preventDefault(); if (focus.c && !focus.open) toggleOpen(focus, true); }
    else if (k === 'ArrowLeft') { e.preventDefault(); if (focus.c && focus.open) toggleOpen(focus, false); else if (focus.par) { focus = focus.par; render(true); } }
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); check(focus); }
  });
  render();
  comps.push({
    step(dt) {
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (const d of all(DATA)) {
        if (d.delay > 0) { d.delay -= dt; continue; }
        for (let i = 0; i < sub; i++) stepS(d.f, h, .24, reduced ? 1 : Math.max(.3, .55 - F.bounce * .3));
      }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      ctx.fillStyle = rgb(C.body);
      for (const d of rows) {
        if (!d.el || !d.el.isConnected) continue;
        const f = d.f.x; if (f < .02) continue;
        const r = d.el.querySelector('.tcb').getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
        const cx = r.left - c.left + r.width / 2, cy = r.top - c.top + r.height / 2, s = r.width * Math.min(1.15, f < .6 ? f * 1.6 : f);   // 半选也是实心，只是小一点
        goo(ctx, k, true, 6); rrect(ctx, cx - s / 2, cy - s / 2, s, s, 6 * Math.min(1, s / r.width)); ctx.fill(); goo(ctx, k, false);
      }
    },
  });
})();

