/* ================= 对话框：普通的 q 弹鼓出来、冒一圈云；警告收着弹、不冒烟 ================= */
(() => {
  const layer = $('#dlgLayer'), back = $('#dlgBack'), cv = setup(layer.querySelector('.dlg-fx')), M = makeSmoke();
  const defs = {
    dlg: { el: $('#dlg'), calm: false, trig: $('#dlgBtn'), first: () => $('#fName'), outside: true },
    alert: { el: $('#alertDlg'), calm: true, trig: $('#alertBtn'), first: () => $('#alCancel'), outside: false },
  };
  let cur = null;
  const blooms = {};
  for (const [key, d] of Object.entries(defs)) {
    blooms[key] = makeBloom({ w: 360, h: 240, r: 18, n: 150, M, el: d.el, calm: d.calm, center: () => [innerWidth / 2, innerHeight / 2], base: 'translate(-50%,-50%)' });
  }
  function open(key) {
    if (cur) return;
    const d = defs[key], bl = blooms[key];
    cur = key; layer.hidden = false; layer.style.pointerEvents = ''; d.el.hidden = false; cv.rs();
    d.el.style.transform = 'translate(-50%,-50%)';
    $('.wrap').inert = true;   // 背后的页面暂时点不到、Tab 也进不去
    bl.resize(d.el.offsetWidth, d.el.offsetHeight);
    d.el.hidden = true; bl.show();
    requestAnimationFrame(() => d.first().focus());
  }
  function close() {
    if (!cur) return;
    const key = cur; cur = null;
    blooms[key].hide(); layer.style.pointerEvents = 'none';
    $('.wrap').inert = false; defs[key].trig.focus();
  }
  addEventListener('resize', () => { if (cur) { const d = defs[cur]; blooms[cur].resize(d.el.offsetWidth, d.el.offsetHeight); } });
  $('#dlgBtn').addEventListener('click', () => open('dlg'));
  $('#alertBtn').addEventListener('click', () => open('alert'));
  ['#dlgSave', '#dlgX', '#alCancel', '#alOk'].forEach(sel => $(sel).addEventListener('click', close));
  back.addEventListener('click', () => { if (cur && defs[cur].outside) close(); });
  document.addEventListener('keydown', e => {
    if (!cur) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {   // 焦点只在对话框里转
      const f = [...defs[cur].el.querySelectorAll('button, input')];
      if (!defs[cur].el.contains(document.activeElement)) { e.preventDefault(); f[0].focus(); return; }
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  comps.push({
    step(dt) {
      let o = 0;
      for (const b of Object.values(blooms)) { b.step(dt); o = Math.max(o, b.B.sc.x); }
      back.style.opacity = (.72 * clamp(o, 0, 1)).toFixed(3);   // 背后起一层雾（深色是夜色，浅色是白雾）
      smokeStep(M, dt);
      if (!cur && !layer.hidden && !Object.values(blooms).some(b => b.open || b.closing) && !M.parts.length) layer.hidden = true;   // 烟散完了才收起整层
    },
    draw() {
      if (layer.hidden || !clear(cv)) return;
      smokeDraw(M, cv.ctx, cv.k);
      for (const b of Object.values(blooms)) b.draw(cv.ctx, cv.k);
    },
  });
})();
