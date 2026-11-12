/* ================= 颜色滑块：圆头里是它脚下的颜色；拖着划过色相，身后拖出一串彩色的烟；点轨道，圆头化成雾流过去，一路变色；
   停在圆头上，顶上慢慢冒同色的小云。两条互相牵着：色相一动，饱和度那条的颜色跟着换 ================= */
(() => {
  let H = 200, Sat = 75; const V = .9;
  const col = (h = H, s = Sat) => hsv2rgb(h, s / 100, V);
  const hs = chanSlider({ el: $('#cslH'), w: 200, min: 0, max: 360, value: H, colorAt: h => col(h, Sat), text: h => `${h} 度，${colorName(col(h, Sat))}`, onInput: h => { H = h; out(); } });
  const ss = chanSlider({ el: $('#cslS'), w: 200, min: 0, max: 100, value: Sat, colorAt: s => col(H, s), text: s => `${s}%，${colorName(col(H, s))}`, onInput: s => { Sat = s; out(); } });
  function out() {
    const c = col(), hx = toHex(c);
    $('#cslSw').style.setProperty('--c', hx); $('#cslHex').textContent = hx; $('#cslName').textContent = colorName(c);
    $('#cslHV').textContent = H + '°'; $('#cslSV').textContent = Sat + '%';
    $('#cslH').style.setProperty('--grad', `linear-gradient(to right,${[0, 60, 120, 180, 240, 300, 360].map(h => toHex(col(h, Sat))).join(',')})`);
    $('#cslS').style.setProperty('--grad', `linear-gradient(to right,${toHex(col(H, 0))},${toHex(col(H, 100))})`);
    hs.aria(); ss.aria();
  }
  out();
})();

