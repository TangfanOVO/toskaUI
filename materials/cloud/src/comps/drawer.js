/* ================= 抽屉：从底下 q 弹着升上来，顶边晃一晃；往下拖，松手够远或者甩得够快就收回去，顶边化成小云；不够就弹回来 ================= */
(() => {
  const btn = $('#drwBtn'), layer = $('#drwLayer'), back = $('#drwBack'), sheet = $('#drw'), cv = setup(layer.querySelector('.drw-fx')), M = makeSmoke();
  const val = $('#drwVal'), pop = spring(1);
  const S = { y: spring(0), open: false, drag: null, B: null, w: 0, h: 0, last: null };
  const off = () => S.h + 70;
  let goal = 350;
  function build() { S.w = sheet.offsetWidth; S.h = sheet.offsetHeight; S.B = softBody(S.w, S.h + 60, 22, 130); }
  function open() {
    if (S.open) return; S.open = true; S.last = document.activeElement;
    layer.hidden = false; layer.style.pointerEvents = ''; cv.rs(); build();
    S.y.x = off(); S.y.v = 0; S.y.t = 0; if (reduced) S.y.x = 0;
    if (!reduced) lumpImpulse(S.B, 6, deformK() * .5);
    $('.wrap').inert = true; requestAnimationFrame(() => sheet.focus({ preventScroll: true }));
  }
  function close(v) {
    if (!S.open) return; S.open = false; S.y.t = off(); if (v) S.y.v = v; if (reduced) S.y.x = S.y.t;
    layer.style.pointerEvents = 'none'; $('.wrap').inert = false; (S.last && S.last.isConnected ? S.last : btn).focus({ preventScroll: true });
    const n = smokeK();
    if (n) { const top = innerHeight - S.h + S.y.x; for (let i = 0; i < Math.round(8 + 8 * n); i++) smokeEmit(M, 1, innerWidth / 2 + J() * S.w * .9, top + 6, { vy: -30, jit: 16, r: 4.5, grow: 2.6, a: .32, life: 1, lift: 24 }); }
  }
  btn.addEventListener('click', open);
  $('#drwOk').addEventListener('click', () => close());
  back.addEventListener('click', () => close());
  sheet.querySelectorAll('.drw-b').forEach(b => b.addEventListener('click', () => {
    goal = clamp(goal + +b.dataset.d, 50, 990); val.textContent = goal; if (!reduced) { pop.x = .86; pop.v = 0; }
  }));
  sheet.addEventListener('pointerdown', e => {   // 往下拖：跟手；往上拖：被橡皮筋拽住
    if (e.target.closest('button')) return;
    sheet.setPointerCapture(e.pointerId); S.drag = { id: e.pointerId, y0: e.clientY - S.y.x, samples: [] }; pushSample(S.drag.samples, e.clientY);
  });
  sheet.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || d.id !== e.pointerId) return;
    const y = e.clientY - d.y0; S.y.x = y >= 0 ? y : -rb(-y, 60); pushSample(d.samples, e.clientY); S.y.v = vel(d.samples);
  });
  const up = e => {
    const d = S.drag; if (!d || d.id !== e.pointerId) return; S.drag = null;
    const v = vel(d.samples, performance.now());
    if (S.y.x > S.h * .35 || v > 700) close(Math.max(v, 300)); else { S.y.t = 0; S.y.v = v; }
  };
  sheet.addEventListener('pointerup', up); sheet.addEventListener('pointercancel', up);
  document.addEventListener('keydown', e => {
    if (!S.open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {   // 焦点只在抽屉里转
      const f = [...sheet.querySelectorAll('button')];
      if (!sheet.contains(document.activeElement) || document.activeElement === sheet) { e.preventDefault(); (e.shiftKey ? f[f.length - 1] : f[0]).focus(); return; }
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  addEventListener('resize', () => { if (S.open) build(); });
  comps.push({
    step(dt) {
      if (layer.hidden) return;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) {
        if (!S.drag) stepS(S.y, h, S.open ? .36 : .3, S.open ? (reduced ? 1 : Math.max(.45, .75 - F.bounce * .35)) : 1);
        stepS(pop, h, .2, Math.max(.25, zeta() * .6));
        if (S.B) { for (const p of S.B.pts) p.f = 0; bodyStep(S.B, h); }
      }
      sheet.style.transform = `translate(-50%,${Math.max(-60, S.y.x).toFixed(1)}px)`;
      val.style.transform = Math.abs(pop.x - 1) > .002 ? `scale(${pop.x.toFixed(4)})` : '';
      back.style.opacity = (.6 * clamp(1 - S.y.x / off(), 0, 1)).toFixed(3);
      smokeStep(M, dt);
      if (!S.open && S.y.x > off() - 2 && !M.parts.length) layer.hidden = true;   // 收到底、烟也散完了才收起整层
    },
    draw() {
      if (layer.hidden || !clear(cv) || !S.B) return;
      smokeDraw(M, cv.ctx, cv.k);
      drawBody(cv.ctx, S.B, innerWidth / 2, innerHeight - S.h + S.y.x + (S.h + 60) / 2, rgb(C.card), cv.k, cardLine());
    },
  });
})();
