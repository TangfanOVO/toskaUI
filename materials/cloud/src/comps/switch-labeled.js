/* ================= 开关 · 带说明：一排设置，每条左边是名字和说明，点字也能拨；最后一条是禁用的，拨不动，颜色淡一些 ================= */
(() => {
  for (const b of document.querySelectorAll('#swList .dsw')) makeSwitch(b);
  for (const t of document.querySelectorAll('#swList .swtx')) t.addEventListener('click', () => { const b = document.getElementById(t.dataset.for); if (!b.disabled) b.click(); });
})();

