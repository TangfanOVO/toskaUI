/* ---------- 循环、主题、面板 ---------- */
readTheme();
darkMQ.addEventListener('change', readTheme);
new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-card'] });
reduceMQ.addEventListener('change', e => { reduced = e.matches || !!window.__forceReduced; });
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (!(dt > 0)) dt = 1 / 120;
  dt = Math.min(dt, 1 / 30);
  if (now - ptr.moveT > 80) { ptr.vx = 0; ptr.vy = 0; }
  for (const c of comps) { if (c.cvo && !c.cvo.visible) continue; c.step(dt); c.draw(); }
  ptr.px = ptr.x; ptr.py = ptr.y;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 换颜色：只是给页面换一组颜色变量，组件、烟、文字反色全部跟着走
{
  const root = document.documentElement, outer = root.getAttribute('data-theme') || '', tb = [...document.querySelectorAll('#themes button')];
  const mark = t => tb.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
  tb.forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.t;
    if (t) root.setAttribute('data-theme', t); else if (outer) root.setAttribute('data-theme', outer); else root.removeAttribute('data-theme');
    mark(t);
  }));
}
// 弹层的样子：实心卡／浅色卡
{
  const cb = [...document.querySelectorAll('#cardSeg button')];
  cb.forEach(b => b.addEventListener('click', () => {
    if (b.dataset.c === 'light') document.documentElement.setAttribute('data-card', 'light'); else document.documentElement.removeAttribute('data-card');
    cb.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
}
// 手感面板（展示页才有；单个组件的页面没有这块，就跳过）
if ($('#speed')) {
  const keys = ['speed', 'bounce', 'deform', 'smoke'];
  const presetBtns = [...document.querySelectorAll('#presets button')];
  const pressBtns = a => presetBtns.forEach(b => b.setAttribute('aria-pressed', String(b === a)));
  const sync = () => { for (const k of keys) { const v = Math.round(F[k] * 100); $('#' + k).value = v; $('#o-' + k).textContent = v; } };
  for (const k of keys) $('#' + k).addEventListener('input', e => { F[k] = e.target.value / 100; $('#o-' + k).textContent = e.target.value; pressBtns(null); });
  presetBtns.forEach(b => b.addEventListener('click', () => { Object.assign(F, PRESETS[b.dataset.p]); sync(); pressBtns(b); }));
  sync();
}
// ---------- 演示：文档站点“播放”时，照着脚本自己动一遍，带一个假鼠标，方便录屏 ----------
const Demo = (() => {
  let run = 0, cur = null, cap = null, down = false, cx = 0, cy = 0, hov = null, patched = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const SVG = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M5 2.5v17.2l4.6-4.3 2.9 6.4 2.9-1.3-2.8-6.3 6.4-.3z" fill="#161514" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i>';
  const cursor = () => { if (!cur) { cur = document.createElement('div'); cur.className = 'demo-cursor'; cur.innerHTML = SVG; document.body.appendChild(cur); } return cur; };
  const place = () => { cursor().style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px)`; };
  const opt = (type, extra) => ({ bubbles: !/enter|leave/.test(type), cancelable: true, composed: true, clientX: cx, clientY: cy, button: 0, buttons: down ? 1 : 0, view: window, ...extra });
  const pe = (type, t, extra) => { if (t) t.dispatchEvent(new PointerEvent(type, opt(type, { pointerId: 1, pointerType: 'mouse', isPrimary: true, ...extra }))); };
  const me = (type, t, extra) => { if (t) t.dispatchEvent(new MouseEvent(type, opt(type, extra))); };
  const under = () => document.elementFromPoint(cx, cy) || document.body;
  const chain = e => { const a = []; for (; e; e = e.parentElement) a.push(e); return a; };
  function hoverTo(e) {
    if (e === hov) return;
    const a = chain(hov), b = chain(e);
    if (hov) { pe('pointerout', hov); me('mouseout', hov); }
    for (const x of a) if (!b.includes(x)) { pe('pointerleave', x); me('mouseleave', x); }
    for (const x of b.slice().reverse()) if (!a.includes(x)) { pe('pointerenter', x); me('mouseenter', x); }
    if (e) { pe('pointerover', e); me('mouseover', e); }
    hov = e;
  }
  function moveTo(x, y) { cx = x; cy = y; place(); const t = cap || under(); if (!cap) hoverTo(t); pe('pointermove', t); me('mousemove', t); }
  function el(sel) { if (!sel) return null; const [q, n] = String(sel).split('|'); return document.querySelectorAll(q)[+n || 0] || null; }
  function at(sel, fx = .5, fy = .5) { const e = el(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width * fx, r.top + r.height * fy]; }
  async function glide(x, y, ms = 420, id) {
    const x0 = cx, y0 = cy, n = Math.max(2, Math.round(ms / 16));
    for (let i = 1; i <= n; i++) { if (id !== run) return; const u = i / n, e = u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2; moveTo(x0 + (x - x0) * e, y0 + (y - y0) * e); await sleep(16); }
  }
  function press() {
    const t = under(); down = true; cap = t; cursor().classList.add('down');
    pe('pointerdown', t); me('mousedown', t);
    const f = t.closest('input,textarea,select,button,a[href],[tabindex]'); if (f && document.activeElement !== f) f.focus({ preventScroll: true });
    return t;
  }
  function release(click = true) {
    const t = cap || under(); down = false; cap = null; cursor().classList.remove('down');
    pe('pointerup', t); me('mouseup', t); if (click) me('click', under());
    hoverTo(under());
  }
  const key = k => { const t = document.activeElement || document.body; for (const type of ['keydown', 'keyup']) t.dispatchEvent(new KeyboardEvent(type, { key: k, code: k, bubbles: true, cancelable: true, composed: true })); };
  function typeChar(ch) {
    const t = document.activeElement; if (!t) return;
    t.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }));
    if ('value' in t) { t.value += ch; t.dispatchEvent(new InputEvent('input', { bubbles: true, data: ch, inputType: 'insertText' })); }
    t.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
  }
  const DEFAULT = () => { const f = document.querySelector('.stage button, .stage [tabindex="0"], .stage input'); const s = f ? (f.id ? '#' + f.id : null) : null; return s ? [['hover', s, 1200], ['click', s], ['wait', 1000], ['click', s], ['wait', 800], ['out']] : [['wait', 500]]; };
  async function play(steps) {
    const id = ++run;
    if (!patched) {   // 假的指针没有真的 pointerId：抓取指针时别报错（抓取由这里自己模拟：按下后的移动都发给按下的那个元素）
      patched = true;
      for (const m of ['setPointerCapture', 'releasePointerCapture']) { const o = Element.prototype[m]; Element.prototype[m] = function (p) { try { return o.call(this, p); } catch (e) {} }; }
    }
    cursor().classList.add('on'); document.documentElement.classList.add('demo-run'); down = false; cap = null;
    cx = innerWidth * .62; cy = innerHeight * .92; place(); hoverTo(under());
    for (const s of steps || DEFAULT()) {
      if (id !== run) return;
      const [op, a, b, c, d, e2, f] = s;
      if (op === 'wait') await sleep(a);
      else if (op === 'move') { const p = at(a, b ?? .5, c ?? .5); if (p) await glide(p[0], p[1], d || 420, id); }
      else if (op === 'hover') { const p = at(a); if (p) await glide(p[0], p[1], 420, id); await sleep(b || 900); }
      else if (op === 'click') { if (a) { const p = at(a); if (p) await glide(p[0], p[1], 380, id); await sleep(90); } press(); await sleep(110); release(); await sleep(120); }
      else if (op === 'ctx') { const t = under(); pe('pointerdown', t, { button: 2, buttons: 2 }); me('contextmenu', t, { button: 2 }); pe('pointerup', t, { button: 2 }); await sleep(100); }
      else if (op === 'drag' || op === 'dragBy') {
        let p0, p1;
        if (op === 'drag') { p0 = at(a, b, c); p1 = at(a, d, e2); } else { p0 = at(a); p1 = p0 && [p0[0] + b, p0[1] + c]; }
        if (!p0) continue;
        await glide(p0[0], p0[1], 380, id); await sleep(80); press(); await sleep(90);
        await glide(p1[0], p1[1], (op === 'drag' ? f : d) || 700, id); await sleep(60); release(false);
      }
      else if (op === 'key') { for (let i = 0; i < (b || 1); i++) { if (id !== run) return; key(a); await sleep(c || 200); } }
      else if (op === 'type') { if (a) el(a)?.focus(); for (const ch of b) { if (id !== run) return; typeChar(ch); await sleep(c || 150); } }
      else if (op === 'clear') { const t = el(a); if (t) { t.value = ''; t.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' })); } }
      else if (op === 'focus') el(a)?.focus();
      else if (op === 'blur') document.activeElement?.blur();
      else if (op === 'scroll') { const t = el(a); if (t) { const y0 = t.scrollTop, n = Math.max(2, Math.round((c || 800) / 16)); for (let i = 1; i <= n; i++) { if (id !== run) return; const u = i / n; t.scrollTop = y0 + b * (u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2); await sleep(16); } } }
      else if (op === 'wheel') { const t = el(a); for (let i = 0; i < (c || 3); i++) { if (id !== run) return; t?.dispatchEvent(new WheelEvent('wheel', { deltaY: b, bubbles: true, cancelable: true, clientX: cx, clientY: cy })); await sleep(d || 90); } }
      else if (op === 'out') { await glide(innerWidth * .9, innerHeight * .96, 520, id); hoverTo(null); }
    }
    if (id !== run) return;
    await sleep(300); cursor().classList.remove('on'); document.documentElement.classList.remove('demo-run');
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();   // 演示完把焦点放掉，免得留一圈焦点框
    try { parent.postMessage({ type: 'cloud-demo-done' }, '*'); } catch (e) {}
  }
  function stop() { run++; if (down) release(false); hoverTo(null); if (cur) cur.classList.remove('on'); document.documentElement.classList.remove('demo-run'); }
  return { play, stop };
})();
// 被嵌在文档站里时，外面可以发消息来换颜色、换手感
window.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'cloud-theme') { if (d.theme) document.documentElement.setAttribute('data-theme', d.theme); else document.documentElement.removeAttribute('data-theme'); }
  if (d.type === 'cloud-card') { if (d.card === 'light') document.documentElement.setAttribute('data-card', 'light'); else document.documentElement.removeAttribute('data-card'); }
  if (d.type === 'cloud-reduced') { window.__forceReduced = !!d.on; reduced = !!d.on || reduceMQ.matches; for (const c of comps) if (c.onReduced) c.onReduced(); }
  if (d.type === 'cloud-demo') { if (d.stop) Demo.stop(); else Demo.play(window.__DEMO); }
  if (d.type === 'cloud-feel' && d.feel) { for (const k of ['speed', 'bounce', 'deform', 'smoke']) if (typeof d.feel[k] === 'number') F[k] = clamp(d.feel[k], 0, 1); }
});
})();