/* ================= 表单：提交时校验，不对的那几格左右晃、边上凝出小点，焦点跳到第一个；都对了，旁边 q 弹鼓出一颗“已提交”，过一会儿化成小云 ================= */
(() => {
  const form = $('#form'), cv = setup(form.querySelector('canvas')), M = makeSmoke(), btn = $('#fmSubmit'), ok = $('#fmOk'), live = $('#fmLive');
  const rows = [...form.querySelectorAll('.frow')].map(r => fieldFx(r.querySelector('input'), r.querySelector('.ferr'), r.querySelector('.fdesc'), cv, M));
  const rings = rows.map(f => focusRing(f.input, cv, { M, inputs: [f.input] }));
  const tests = [v => v.trim().length > 0, v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())];
  const okCenter = () => { const r = btn.getBoundingClientRect(), c = cv.cv.getBoundingClientRect(); return [r.right - c.left + 12 + 46, r.top - c.top + r.height / 2]; };
  const bl = makeBloom({ w: 92, h: 32, r: 16, n: 40, M, el: ok, center: okCenter, base: '' });
  let t = 0, timer = 0;
  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    rows.forEach((f, i) => { const bad = !tests[i](f.input.value); f.set(bad, true); if (bad && !first) first = f.input; });
    if (first) { live.textContent = '有几项要改一下'; first.focus(); return; }
    live.textContent = '已提交';
    ok.style.left = (btn.offsetWidth + 12) + 'px';
    if (bl.open) bl.B.sc.v += 2; else bl.show();
    clearTimeout(timer); timer = setTimeout(() => bl.hide(), 2200);
  });
  rows.forEach((f, i) => f.input.addEventListener('input', () => { if (f.bad && tests[i](f.input.value)) f.set(false, false); }));
  comps.push({
    step(dt) { t += dt; bl.step(dt); rows.forEach(f => f.step(dt, t)); rings.forEach(r => r.step(dt)); smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; const ctx = cv.ctx, k = cv.k; smokeDraw(M, ctx, k); bl.draw(ctx, k); rings.forEach(r => r.draw(ctx, k)); rows.forEach(f => f.draw(ctx, k)); },
  });
})();
