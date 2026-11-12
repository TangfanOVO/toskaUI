/* ================= 日历：选中的那天是一团实心，换日子时化开飘过去 ================= */
(() => {
  const root = $('#cal'), cv = setup(root.querySelector('canvas')), title = $('#calTitle'), body = root.querySelector('tbody'), M = makeSmoke();
  const WK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let view = new Date(today.getFullYear(), today.getMonth(), 1), sel = new Date(today), focusD = new Date(today), btns = [], t = 0;
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const inView = d => d.getFullYear() === view.getFullYear() && d.getMonth() === view.getMonth();
  const Mk = makeDrop(17, M); Mk.on = true;
  function render() {
    title.textContent = `${view.getFullYear()}年${view.getMonth() + 1}月`;
    body.textContent = ''; btns = [];
    const first = view.getDay(), days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let tr = null;
    for (let i = 0; i < 42; i++) {   // 固定 6 行，翻月时高度不跳
      if (i % 7 === 0) { tr = document.createElement('tr'); body.appendChild(tr); }
      const td = document.createElement('td'), d = i - first + 1;
      td.setAttribute('role', 'gridcell');
      if (d >= 1 && d <= days) {
        const date = new Date(view.getFullYear(), view.getMonth(), d), b = document.createElement('button');
        td.setAttribute('aria-selected', String(same(date, sel)));
        b.type = 'button'; b.textContent = d; b.tabIndex = -1; b.dataset.d = d;
        b.dataset.base = `${view.getFullYear()}年${view.getMonth() + 1}月${d}日，${WK[date.getDay()]}${same(date, today) ? '，今天' : ''}`;
        b.setAttribute('aria-label', b.dataset.base + (same(date, sel) ? '，已选中' : ''));
        if (same(date, today)) { b.dataset.today = '1'; b.setAttribute('aria-current', 'date'); }
        b.addEventListener('click', () => pick(date));
        td.appendChild(b); btns[d - 1] = b;
      }
      tr.appendChild(td);
    }
    if (!inView(focusD)) focusD = inView(sel) ? new Date(sel) : new Date(view);
    btns[focusD.getDate() - 1].tabIndex = 0;
  }
  function syncMarker() {   // 选中的日子不在这个月：化成小云飘走；翻回来：q 弹着鼓出来
    const vis = inView(sel), n = smokeK();
    if (vis && !Mk.on) {
      Mk.on = true; const [x, y] = centerIn(btns[sel.getDate() - 1], cv); dropTo(Mk, x, y, true);
      if (!reduced) { Mk.s.x = .3; Mk.s.v = 0; } Mk.s.t = 1;
      if (n) smokeEmit(M, Math.round(4 + 4 * n), x, y, { radial: 46, r: 2.8, grow: 2.6, a: .3, life: .7, lift: 8 });
    } else if (!vis && Mk.on) {
      Mk.on = false; Mk.s.t = 0; if (reduced) Mk.s.x = 0;
      if (n) smokeEmit(M, Math.round(4 + 4 * n), Mk.hx.x, Mk.hy.x, { spread: 10, vy: -34, jit: 18, r: 3.2, grow: 3, a: .3, life: 1, lift: 22 });
    }
  }
  function pick(date) {
    const was = sel; sel = new Date(date); focusD = new Date(date);
    if (!inView(date)) { view = new Date(date.getFullYear(), date.getMonth(), 1); render(); }
    btns.forEach(b => { const on = +b.dataset.d === date.getDate(); b.parentElement.setAttribute('aria-selected', String(on)); b.setAttribute('aria-label', b.dataset.base + (on ? '，已选中' : '')); });
    btns.forEach(b => { b.tabIndex = +b.dataset.d === date.getDate() ? 0 : -1; });
    if (!Mk.on) { syncMarker(); return; }
    if (same(was, date)) { if (!reduced) { Mk.cs.x = .84; Mk.cs.v = 0; } return; }
    const [x, y] = centerIn(btns[date.getDate() - 1], cv); dropTo(Mk, x, y);   // 整滴流过去：头先到，尾巴被拖着
  }
  function moveFocus(nd) {
    focusD = nd;
    if (!inView(nd)) { view = new Date(nd.getFullYear(), nd.getMonth(), 1); render(); syncMarker(); }
    btns.forEach(b => { b.tabIndex = +b.dataset.d === nd.getDate() ? 0 : -1; });
    btns[nd.getDate() - 1].focus();
  }
  body.addEventListener('keydown', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d);
    const st = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    let nd = null;
    if (st !== undefined) nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + st);
    else if (e.key === 'Home') nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    else if (e.key === 'End') nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6 - d.getDay());
    else if (e.key === 'PageUp' || e.key === 'PageDown') {
      const m = d.getMonth() + (e.key === 'PageUp' ? -1 : 1) * (e.shiftKey ? 12 : 1), last = new Date(d.getFullYear(), m + 1, 0).getDate();   // Shift：跨一年
      nd = new Date(d.getFullYear(), m, Math.min(d.getDate(), last));
    }
    if (!nd) return;
    e.preventDefault(); moveFocus(nd);
  });
  root.querySelectorAll('.calnav').forEach(b => b.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + +b.dataset.d, 1);
    focusD = inView(sel) ? new Date(sel) : new Date(view); render(); syncMarker();
  }));
  render();
  comps.push({
    step(dt) {
      t += dt;
      if (Mk.on && btns[sel.getDate() - 1]) {
        const [x, y] = centerIn(btns[sel.getDate() - 1], cv);
        if (!Mk.placed) dropTo(Mk, x, y, true); else if (Math.abs(Mk.hx.t - x) + Math.abs(Mk.hy.t - y) > .5) dropTo(Mk, x, y, !Mk.moving && Math.hypot(Mk.hx.t - x, Mk.hy.t - y) < 6);
      }
      dropStep(Mk, dt);
      const tb = inView(today) ? btns[today.getDate() - 1] : null;
      this.today = tb ? centerIn(tb, cv) : null;
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k;
      smokeDraw(M, ctx, k);
      dropDraw(ctx, k, Mk);
      if (this.today) {   // 今天：数字下面一颗小点；被选中的实心盖住时，点换成底色
        const [x, y] = this.today, covered = Mk.s.x > .5 && Math.hypot(Mk.hx.x - x, Mk.hy.x - y) < 8;
        ctx.beginPath(); ctx.arc(x, y + 10, 1.8, 0, TAU); ctx.fillStyle = rgb(covered ? C.bodyInk : C.body); ctx.fill();
      }
    },
  });
})();
