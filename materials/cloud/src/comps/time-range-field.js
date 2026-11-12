/* ================= 时间范围输入：两组时分 ================= */
(() => {
  const root = $('#timeRangeField'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const els = [...$('#trfBox').querySelectorAll('span:not(.sl):not(.dash)')];
  const seg = (el, label, max, val) => ({ el, label, ph: '––', min: 0, max, pad: 2, val, now: 0 });
  const f = segField({ box: $('#trfBox'), cv, M, segs: [seg(els[0], '开始时', 23, 9), seg(els[1], '开始分', 59, 0), seg(els[2], '结束时', 23, 17), seg(els[3], '结束分', 59, 30)] });
  comps.push({ step(dt) { f.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); f.draw(cv.ctx, cv.k); } });
})();
