/* ================= 日期输入：年、月、日一格一格改，正在改的那格底下是一块实心，换格时流过去；整个框是“水流”的框 ================= */
(() => {
  const root = $('#dateField'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const els = [...$('#dfBox').querySelectorAll('span:not(.sl)')];
  const f = segField({ box: $('#dfBox'), cv, M, segs: dateSegs(els, TODAY).map(s => ({ ...s, ph: s.label === '年' ? '––––' : '––' })) });
  comps.push({ step(dt) { f.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); f.draw(cv.ctx, cv.k); } });
})();
