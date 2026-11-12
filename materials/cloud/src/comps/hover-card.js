/* ================= 悬浮卡片：鼠标在链接上停一会儿（或者键盘聚焦），卡片从链接下面 q 弹鼓出来；移开一会儿，化成小云散掉 ================= */
(() => {
  const wrap = $('#hovWrap'), link = $('#hovLink'), card = $('#hovCard'), cv = setup(wrap.querySelector('.hovfx')), M = makeSmoke();
  const center = () => { const r = link.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.left - c.left + r.width / 2, r.bottom - c.top + 12 + 71]; };
  const bl = makeBloom({ w: 270, h: 142, r: 16, n: 120, M, el: card, center, base: '' });
  let openT = 0, closeT = 0;
  const later = (fn, ms) => setTimeout(fn, reduced ? 0 : ms);
  const wantOpen = () => { clearTimeout(closeT); if (!bl.open) { clearTimeout(openT); openT = later(() => bl.show(), 450); } };
  const wantClose = () => { clearTimeout(openT); clearTimeout(closeT); closeT = later(() => bl.hide(), 260); };
  link.addEventListener('pointerenter', wantOpen); link.addEventListener('pointerleave', wantClose);
  link.addEventListener('focus', wantOpen); link.addEventListener('blur', wantClose);
  card.addEventListener('pointerenter', () => clearTimeout(closeT)); card.addEventListener('pointerleave', wantClose);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && bl.open) { clearTimeout(openT); bl.hide(); } });
  comps.push({
    step(dt) { bl.step(dt); smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); bl.draw(cv.ctx, cv.k); },
  });
})();
