/* ================= 字段：离开输入框时校验；不对，输入框左右晃一下，错误提示边上凝出一颗小点；改对了小点散掉 ================= */
(() => {
  const root = $('#field'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), inp = $('#fEmail');
  const f = fieldFx(inp, root.querySelector('.ferr'), root.querySelector('.fdesc'), cv, M), ring = focusRing(inp, cv, { M, inputs: [inp] }); let t = 0;
  const ok = () => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value.trim());
  inp.addEventListener('blur', () => f.set(!ok(), true));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); f.set(!ok(), true); } });
  inp.addEventListener('input', () => { if (f.bad && ok()) f.set(false, false); });   // 改对了马上收回提示；打字本身不加戏
  comps.push({ step(dt) { t += dt; f.step(dt, t); ring.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); ring.draw(cv.ctx, cv.k); f.draw(cv.ctx, cv.k); } });
})();
