/* ================= 时间输入：时、分两格，跟日期输入一样 ================= */
(() => {
  const root = $('#timeField'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), now = new Date();
  const els = [...$('#tfBox').querySelectorAll('span:not(.sl)')];
  const f = segField({ box: $('#tfBox'), cv, M, segs: [
    { el: els[0], label: '时', ph: '––', min: 0, max: 23, pad: 2, val: 9, now: now.getHours() },
    { el: els[1], label: '分', ph: '––', min: 0, max: 59, pad: 2, val: 41, now: now.getMinutes() }] });
  comps.push({ step(dt) { f.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); f.draw(cv.ctx, cv.k); } });
})();
