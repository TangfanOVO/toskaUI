/* ================= 标签文字：不加戏。点它把焦点交给输入框；输入框拿到焦点时，一圈实心线沿着框边流一圈 ================= */
(() => {
  const root = $('#labelDemo'), cv = setup(root.querySelector('canvas')), M = makeSmoke(), ring = focusRing($('#lblIn'), cv, { M, inputs: [$('#lblIn')] });
  comps.push({ step(dt) { ring.step(dt); smokeStep(M, dt); }, draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); ring.draw(cv.ctx, cv.k); } });
})();
