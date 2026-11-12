// 录预览：把 grid.py 生成的网格页一帧一帧拍下来。用假时钟，时间只在两张之间往前走，拍得再慢也不会快进或掉帧
// 用法：node tools/preview/record.js [只录哪几张，逗号隔开] [每秒几帧，默认 12] [秒数，默认 10.5]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), GRID = path.join(ROOT, 'preview', '_grid'), FRAMES = path.join(ROOT, 'preview', '_frames');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(path.join(GRID, 'jobs.json')));
  const only = process.argv[2] ? process.argv[2].split(',') : null, FPS = +(process.argv[3] || 12), SECS = +(process.argv[4] || 10.5);
  const b = await chromium.launch();
  for (const j of jobs) {
    if (only && !only.includes(j.name)) continue;
    const ctx = await b.newContext({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({ time: new Date('2026-11-12T10:00:00') });
    await p.clock.pauseAt(new Date('2026-11-12T10:00:01'));
    await p.goto('file://' + path.join(GRID, j.name + '.html'));
    await p.waitForLoadState('load');
    for (let i = 0; i < 30; i++) await p.clock.runFor(50);   // 先让每格都站稳
    for (const f of p.frames()) if (f !== p.mainFrame()) await f.evaluate(() => postMessage({ type: 'cloud-demo' }, '*')).catch(() => {});
    const dir = path.join(FRAMES, j.name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const N = Math.round(SECS * FPS);
    for (let i = 0; i < N; i++) { await p.clock.runFor(1000 / FPS); await p.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) }); }
    console.log(j.name, N, 'frames', errs.length ? errs : '');
    await ctx.close();
  }
  await b.close();
})();
