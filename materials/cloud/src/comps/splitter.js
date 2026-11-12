/* ================= 分隔条：中间那根线像弦，被拖弯，松手晃几下 ================= */
(() => {
  const root = $('#split'), cv = setup(root.querySelector('canvas')), hd = $('#sHandle'), A = $('#paneA'), av = $('#paneAv'), bv = $('#paneBv'), M = makeSmoke();
  const OX = 24, OY = 40;
  let MIN = 15, MAX = 85;
  let pct = 40, restore = 40;
  const S = { X: spring(0), bow: spring(0), act: spring(0), drag: null, hover: false, placed: false, w: 0, h: 0, lastW: -1 };
  const toX = p => OX + S.w * p / 100, toP = x => (x - OX) / Math.max(1, S.w) * 100;
  const measure = () => {
    S.w = root.clientWidth; S.h = root.clientHeight;
    MIN = clamp(Math.ceil(76 / Math.max(1, S.w) * 100), 15, 40); MAX = 100 - MIN;   // 窄屏上收起的那边至少留够放下字
    hd.setAttribute('aria-valuemin', String(MIN)); hd.setAttribute('aria-valuemax', String(MAX)); setPct(pct);
    if (S.placed && !S.drag) { S.X.t = toX(pct); S.X.x = S.X.t; S.X.v = 0; }
  };
  function setPct(p) {
    pct = clamp(Math.round(p), MIN, MAX);
    hd.setAttribute('aria-valuenow', String(pct)); av.textContent = pct + '%'; bv.textContent = (100 - pct) + '%';
  }
  function goTo(p) { setPct(p); S.X.t = toX(pct); if (reduced) S.X.x = S.X.t; }
  function toggle() { if (pct > MIN) { restore = pct; goTo(MIN); } else goTo(restore > MIN ? restore : 40); }
  new ResizeObserver(measure).observe(root); measure();
  const localX = e => e.clientX - cv.cv.getBoundingClientRect().left;
  hd.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); hd.setPointerCapture(e.pointerId); hd.dataset.ptr = '1'; hd.focus({ preventScroll: true });
    S.drag = { id: e.pointerId, grab: S.X.x - localX(e), samples: [] }; pushSample(S.drag.samples, localX(e));
  });
  hd.addEventListener('pointermove', e => {
    const d = S.drag; if (!d || e.pointerId !== d.id) return;
    const x = localX(e), raw = x + d.grab;
    S.X.x = rubber(raw, toX(MIN), toX(MAX), 34); pushSample(d.samples, x); S.X.v = vel(d.samples);
    setPct(toP(raw));
  });
  const up = e => { const d = S.drag; if (!d || e.pointerId !== d.id) return; S.drag = null; S.X.t = toX(pct); S.X.v = clamp(S.X.v * .35, -900, 900); };
  hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  hd.addEventListener('dblclick', toggle);
  hd.addEventListener('pointerenter', () => { S.hover = true; });
  hd.addEventListener('pointerleave', () => { S.hover = false; });
  hd.addEventListener('blur', () => { delete hd.dataset.ptr; });
  hd.addEventListener('keydown', e => {
    delete hd.dataset.ptr;
    if (e.repeat) S.repT = performance.now();
    const st = { ArrowLeft: -5, ArrowRight: 5, ArrowUp: -5, ArrowDown: 5 }[e.key];
    if (st !== undefined) { e.preventDefault(); goTo(pct + st); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(MIN); }
    else if (e.key === 'End') { e.preventDefault(); goTo(MAX); }
    else if (e.key === 'Enter') { e.preventDefault(); toggle(); }
  });
  comps.push({
    step(dt) {
      if (!S.placed && S.w) { S.X.x = S.X.t = toX(pct); S.placed = true; }
      const dragging = !!S.drag, sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      if (dragging && performance.now() - S.drag.samples[S.drag.samples.length - 1].t > 70) S.X.v = 0;
      S.bow.t = reduced ? 0 : clamp(-S.X.v * .03 * (.3 + deformK()), -26, 26);   // 线被拖着走：中间落在后面
      S.act.t = dragging || S.hover || document.activeElement === hd ? 1 : 0;
      for (let i = 0; i < sub; i++) {
        if (!dragging) stepS(S.X, h, resp() * .9, Math.max(.35, zeta() * .85));
        stepS(S.bow, h, .3, reduced ? 1 : Math.max(.1, .32 - F.bounce * .22));
        stepS(S.act, h, .12, 1);
      }
      const n = smokeK(), sp = Math.abs(S.X.v);
      if (n && sp > 240 && performance.now() - (S.repT || 0) > 250) {   // 跑得快：把手往身后喷；按住方向键连按时不喷
        M.acc += sp * .02 * n * dt;
        while (M.acc >= 1) { M.acc -= 1; smokeEmit(M, 1, S.X.x + S.bow.x * .5 - Math.sign(S.X.v) * 5, OY + S.h / 2 + J() * 18, { vx: -S.X.v * .12, vy: J() * 10, jit: 10, r: 2, grow: 3.2, a: .28, life: .8, lift: 6 }); }
      }
      const wA = clamp(S.X.x - OX, 0, S.w);   // 窗格跟着弹簧走：拖过头时也跟着橡皮筋
      if (Math.abs(wA - S.lastW) > .1) { S.lastW = wA; A.style.width = wA.toFixed(1) + 'px'; hd.style.left = (wA - 8).toFixed(1) + 'px'; }
      smokeStep(M, dt);
    },
    draw() {
      if (!clear(cv) || !S.placed) return;
      const ctx = cv.ctx, k = cv.k, x = S.X.x, y0 = OY + 1, y1 = OY + S.h - 1, ym = (y0 + y1) / 2, bw = S.bow.x, a = S.act.x;
      smokeDraw(M, ctx, k);
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + bw, ym, x, y1);
      ctx.strokeStyle = rgb(mixc(C.track, C.body, a)); ctx.lineWidth = 1.6 + a * .8; ctx.stroke();
      const gx = x + bw * .5, sp = reduced ? 0 : Math.min(1, Math.abs(S.X.v) / 1200) * (.3 + deformK()), gh = 30 * (1 + sp * .5) * (1 + a * .1), gw = 8 * (1 - sp * .3);
      goo(ctx, k, true, 7); rrect(ctx, gx - gw / 2, ym - gh / 2, gw, gh, gw / 2); ctx.fillStyle = rgb(C.body); ctx.fill(); goo(ctx, k, false);
    },
  });
})();
