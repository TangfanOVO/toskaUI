/* ================= 组合框：打字只是筛选，不加戏；列表 q 弹鼓出来、跟着结果变高，高亮块在选项之间流；选中那一项化成一滴流回输入框 ================= */
(() => {
  const root = $('#combo'), cv = setup(root.querySelector('canvas')), M = makeSmoke();
  const fx = comboFx({ root, box: $('#cbField'), input: $('#cbIn'), list: $('#cbList'), toggle: $('#cbTog'), cv, M, W: 220,
    data: ['苹果', '香蕉', '蓝莓', '葡萄', '菠萝', '草莓', '西瓜', '芒果'] });
  comps.push({
    step(dt) { fx.step(dt); smokeStep(M, dt); },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); fx.draw(cv.ctx, cv.k); },
  });
})();
