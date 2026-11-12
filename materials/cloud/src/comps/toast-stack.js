/* ================= 通知 · 叠在一起：新的一条在最上面凝出来，旧的往后退、缩小一点，叠成一摞；鼠标停上去，整摞往下摊开；
   每条放五秒就化成小云散掉，最多留三条，再来就把最旧的那条化掉 ================= */
(() => {
  const area = $('#tsArea'), cv = setup(area.querySelector('canvas')), M = makeSmoke(), live = $('#tsLive');
  const TW = 260, TH = 60, GAP = 8, MAX = 3;
  const MSG = [['已保存草稿', '刚刚'], ['Toska 给你点了个赞', '1 分钟前'], ['上传完成：云.png', '2 分钟前'], ['幡幡 分享了一个文件夹', '5 分钟前'], ['明天下午 3 点开会', '提醒']];
  let list = [], seq = 0, open = false, hoverT = 0;
  const base = () => { const c = cv.cv.getBoundingClientRect(), a = area.getBoundingClientRect(); return [a.left - c.left + a.width / 2, a.top - c.top + TH / 2 + 6]; };   // 最新的一条在最上面，旧的往下露一条边；摊开时往下排，不会盖住上面的按钮
  function layout() {   // 第 i 条（0 是最新的）应该在哪、多大
    const [cx, by] = base(), alive = list.filter(t => !t.gone);
    alive.forEach((t, i) => {
      const s = open ? 1 : 1 - i * .06, y = open ? by + i * (TH + GAP) : by + i * 12, w = TW * s, h = TH * s;
      t.i = i; cardAim(t.K, cx - w / 2, y - h / 2, cx + w / 2, y + h / 2);
      const a = area.getBoundingClientRect(), c = cv.cv.getBoundingClientRect();
      t.el.style.left = (cx - TW / 2 - (a.left - c.left)) + 'px'; t.el.style.top = (y - TH / 2 - (a.top - c.top)) + 'px';
      t.el.style.zIndex = String(10 - i);
      t.el.inert = !open && i > 0;   // 叠着的时候，后面那几条点不到，读屏也跳过
    });
  }
  function add(quiet) {
    const [title, when] = MSG[seq++ % MSG.length], el = document.createElement('div');
    el.className = 'tsitem'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', title);
    el.innerHTML = `<div class="tt"><strong></strong><span></span></div><button type="button" class="tsx" aria-label="关掉这条">×</button>`;
    el.querySelector('strong').textContent = title; el.querySelector('span').textContent = when;
    area.appendChild(el);
    const t = { el, K: makeCard(M), gone: false, timer: 0, i: 0 };
    el.querySelector('.tsx').addEventListener('click', () => kill(t));
    list.unshift(t);
    live.textContent = ''; requestAnimationFrame(() => { live.textContent = title; });
    const alive = list.filter(x => !x.gone); if (alive.length > MAX) kill(alive[alive.length - 1]);   // 太多了：最旧的化掉
    layout(); if (quiet) { t.K.open = true; t.K.s.x = t.K.s.t = 1; } else { t.K.s.x = reduced ? 1 : .3; cardShow(t.K); }   // 页面刚打开的那一条直接放好
    arm(t);
  }
  function arm(t) { clearTimeout(t.timer); t.timer = setTimeout(() => { if (open) arm(t); else kill(t); }, 5000); }
  function kill(t) {
    if (t.gone) return; t.gone = true; clearTimeout(t.timer); cardHide(t.K);
    if (t.el.contains(document.activeElement)) $('#tsBtn').focus();
    t.el.inert = true; layout();
  }
  $('#tsBtn').addEventListener('click', () => add(false));
  area.addEventListener('pointerenter', () => { clearTimeout(hoverT); open = true; layout(); });
  area.addEventListener('pointerleave', () => { clearTimeout(hoverT); hoverT = setTimeout(() => { open = false; layout(); }, 250); });
  area.addEventListener('focusin', () => { open = true; layout(); });
  area.addEventListener('focusout', e => { if (!area.contains(e.relatedTarget)) { open = false; layout(); } });
  addEventListener('resize', layout);
  comps.push({
    step(dt) {
      for (const t of list) {
        cardStep(t.K, dt);
        const [, , , , s] = cardRect(t.K);
        if (t.gone) { t.el.style.opacity = '0'; if (s < .03) { t.el.remove(); t.dead = true; } continue; }
        cardRide(t.K, t.el);
        if (!open && t.i > 0) t.el.style.opacity = '0';   // 叠在后面的只露出一条边，字不显示
      }
      list = list.filter(t => !t.dead);
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv)) return;
      const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k);
      for (let i = list.length - 1; i >= 0; i--) {   // 旧的先画，新的盖在上面；每条边上描一圈底色，叠在一起也分得开
        const t = list[i]; cardDraw(ctx, k, t.K, 14, C.card, cardLine() || rgb(C.bg));
      }
    },
  });
  add(true);
})();
