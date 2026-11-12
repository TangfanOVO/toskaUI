/* ================= 通知：原地 q 弹鼓出来；划走会被甩出去；放着不管就化成小云散掉 ================= */
(() => {
  const live = $('#toastLive'), btn = $('#toastBtn'), area = $('#toastArea'), cv = setup(area.querySelector('canvas')), box = $('#toast'), undo = $('#toastUndo'), when = $('#toastWhen'), M = makeSmoke();
  const TW = 260, TH = 64, B = softBody(TW, TH, 14, 90);
  B.sc.x = 0; B.sc.t = 0;
  const S = { shown: false, closing: false, fling: 0, timer: 0, drag: null };
  const cx = () => cv.W / 2, cy = () => 60 + 48;
  function stamp() {
    const d = new Date(Date.now() + 864e5 * 2); d.setHours(17, 57, 0, 0);
    when.textContent = `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]} 下午 5:57`;
  }
  function show() {
    stamp(); clearTimeout(S.timer);
    live.textContent = ''; requestAnimationFrame(() => { live.textContent = `已安排：聊聊近况，${when.textContent}`; });
    if (S.shown) { B.sc.v += 1.6 * (.4 + F.bounce); const n = smokeK(); if (n) smokeFromBody(M, B, cx(), cy(), 3, p => p.ny < -.5, { speed: 20, vy: -20, r: 3.4, grow: 3, a: .3, life: 1, lift: 22 }); }
    else {
      S.shown = true; S.closing = false; S.fling = 0; box.hidden = false;
      B.sc.x = reduced ? 1 : .3; B.sc.v = 0; B.sc.t = 1; B.tx.x = 0; B.tx.v = 0; B.tx.t = 0;
      lumpImpulse(B, 6, deformK());   // 边上鼓出几块，再慢慢平回去
      const n = smokeK();
      if (n) smokeFromBody(M, B, cx(), cy(), Math.round(10 + 12 * n), () => true, { speed: 55 + 40 * n, r: 4.5, grow: 3, a: .3, life: .8, lift: 10 });
    }
    S.timer = setTimeout(() => dismiss(0), 4500);
  }
  function dismiss(dir) {
    clearTimeout(S.timer);
    if (!S.shown) return;
    S.shown = false; S.closing = true;
    if (box.contains(document.activeElement)) btn.focus();   // 焦点别掉到页面最上面
    const n = smokeK();
    if (dir && !reduced) { S.fling = dir; B.tx.t = dir * 300; }   // 甩出去
    else {                                                     // 化成小云散掉
      B.sc.t = 0;
      if (n) smokeFromBody(M, B, cx(), cy(), 8 + Math.round(10 * n), () => true, { speed: 22, vy: -24, r: 4, grow: 3, a: .3, life: 1.2, lift: 26 });
    }
  }
  btn.addEventListener('click', show);
  undo.addEventListener('click', e => { e.stopPropagation(); dismiss(0); });
  const hold = () => clearTimeout(S.timer), resume = () => { if (S.shown && !S.drag) { clearTimeout(S.timer); S.timer = setTimeout(() => dismiss(0), 3000); } };
  box.addEventListener('pointerenter', hold); box.addEventListener('pointerleave', () => { if (!box.contains(document.activeElement)) resume(); });
  box.addEventListener('focusin', hold); box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) resume(); });
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    box.setPointerCapture(e.pointerId); clearTimeout(S.timer);
    S.drag = { id: e.pointerId, x0: e.clientX, tx0: B.tx.x, samples: [] }; pushSample(S.drag.samples, e.clientX);
  });
  box.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    B.tx.x = dx > 0 ? d.tx0 + dx : d.tx0 - rb(-dx, 30);   // 往左拖会变沉
    pushSample(d.samples, e.clientX); B.tx.v = vel(d.samples);
  });
  const up = e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    S.drag = null;
    const v = vel(d.samples, performance.now());
    if (B.tx.x > 70 || v > 600) { B.tx.v = Math.max(v, 300); dismiss(1); }
    else { B.tx.t = 0; S.timer = setTimeout(() => dismiss(0), 3000); }
  };
  box.addEventListener('pointerup', up);
  box.addEventListener('pointercancel', up);
  comps.push({
    step(dt) {
      for (const p of B.pts) p.f = 0;
      const sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let i = 0; i < sub; i++) {
        if (!S.drag) stepS(B.tx, h, S.fling ? .5 : resp() * 1.3, S.fling ? 1 : Math.max(.45, zeta()));
        stepS(B.sc, h, S.shown ? .28 + (1 - F.speed) * .1 : .16, S.shown ? (reduced ? 1 : Math.max(.28, .55 - F.bounce * .35)) : 1);
        bodyStep(B, h);
      }
      const n = smokeK(), v = B.tx.v;
      if (n && Math.abs(v) > 50 && B.sc.x > .5) {   // 动的时候往身后喷
        M.acc += Math.abs(v) * .05 * n * dt;
        while (M.acc >= 1) { M.acc -= 1; smokeEmit(M, 1, cx() + B.tx.x - Math.sign(v) * TW * .48, cy() + J() * TH * .7, { vx: -v * .3, vy: J() * 10, r: 3, grow: 4, a: .28, life: .9, lift: 4 }); }
      }
      if (S.fling && B.tx.x > 240 && B.sc.t !== 0) {   // 甩出去以后在画面外散掉
        B.sc.t = 0;
        if (n) smokeFromBody(M, B, cx(), cy(), 6, () => true, { speed: 20, vy: -20, r: 4, grow: 3, a: .3, life: 1, lift: 22 });
      }
      if (B.sc.x < 0) { B.sc.x = 0; B.sc.v = 0; }
      const s = B.sc.x;
      box.style.transform = `translateX(${B.tx.x.toFixed(2)}px) scale(${s.toFixed(4)})`;
      box.style.opacity = clamp((s - .55) / .35, 0, 1).toFixed(3);
      if (S.closing && s < .03) { S.closing = false; box.hidden = true; S.fling = 0; B.tx.x = 0; B.tx.t = 0; }
      smokeStep(M, dt);
    },
    draw() { if (!clear(cv)) return; smokeDraw(M, cv.ctx, cv.k); if (B.sc.x > .01) drawBody(cv.ctx, B, cx(), cy(), rgb(C.card), cv.k, cardLine()); },
  });
})();
