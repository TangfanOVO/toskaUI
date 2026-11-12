/* ================= 日期范围输入：两组年月日，正在改的那格底下的实心块在六格之间流 ================= */
(() => {
  const root = $('#dateRangeField'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const els = [...$('#drfBox').querySelectorAll('span:not(.sl):not(.dash)')];
  const a = TODAY, b = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 6);
  const ph = s => ({ ...s, ph: s.label === '年' ? '––––' : '––' });
  const s1 = dateSegs(els.slice(0, 3), a).map(ph), s2 = dateSegs(els.slice(3), b).map(ph);
  s2.forEach(s => { s.label = '结束' + s.label; }); s1.forEach(s => { s.label = '开始' + s.label; });
  s2[2].max = ss => { const y = ss[3].val ?? TODAY.getFullYear(), m = ss[4].val ?? 1; return new Date(y, m, 0).getDate(); };
  const f = segField({ box: $('#drfBox'), cv, M, segs: [...s1, ...s2] });
  comps.push({ step(dt) { f.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); f.draw(cv.ctx, cv.k); } });
})();
