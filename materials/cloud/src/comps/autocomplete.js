/* ================= 自动补全：随便写，列表只是建议；输入框里浅浅地提示第一个建议的后半截，按 Tab 或 → 收下，收下时冒一小团 ================= */
(() => {
  const root = $('#autoc'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const fx = comboFx({ root, box: $('#acField'), input: $('#acIn'), list: $('#acList'), ghost: $('#acGhost'), free: true, cv, M, W: 220,
    data: ['云朵', '云海', '云雀', '云层', '雾气', '雾凇', '烟花', '晚霞', '彩虹', '月亮'] });
  comps.push({
    step(dt) { fx.step(dt); smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); fx.draw(cv.ctx, cv.k); },
  });
})();
