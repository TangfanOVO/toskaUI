// 检查全部组件页：有没有报错、在手机宽度下有没有被挤出屏幕、自动演示能不能跑完
// 用法：node tools/check.js   （先 python3 tools/build.py）
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const C = path.resolve(__dirname, '..', 'docs', 'c');
(async () => {
  const ids = fs.readdirSync(C).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5));
  const b = await chromium.launch(), bad = [];
  await Promise.all([0, 1, 2, 3].map(async w => {
    const p = await b.newPage({ viewport: { width: 375, height: 640 } });
    for (let i = w; i < ids.length; i += 4) {
      const id = ids[i], errs = [];
      p.removeAllListeners('pageerror'); p.removeAllListeners('console');
      p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push(m.text()); });
      for (const theme of ['light', 'dark', 'white']) {
        await p.goto('file://' + path.join(C, id + '.html') + '#theme-' + theme); await p.waitForTimeout(250);
        const [sw, W] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        if (sw > W) errs.push(`${theme}: 横向溢出 ${sw}>${W}`);
      }
      await p.evaluate(() => { window.__done = false; addEventListener('message', e => { if (e.data && e.data.type === 'cloud-demo-done') window.__done = true; }); postMessage({ type: 'cloud-demo' }, '*'); });
      const t0 = Date.now(); while (!(await p.evaluate(() => window.__done)) && Date.now() - t0 < 16000) await p.waitForTimeout(250);
      if (!(await p.evaluate(() => window.__done))) errs.push('演示没跑完');
      console.log((errs.length ? '✗ ' : '✓ ') + id, errs.join(' / '));
      if (errs.length) bad.push(id);
    }
  }));
  console.log(bad.length ? `有问题：${bad.join(', ')}` : `全部 ${ids.length} 页都没问题`);
  await b.close(); process.exit(bad.length ? 1 : 0);
})();
