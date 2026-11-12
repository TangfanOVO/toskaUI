# 交接说明

给接手的人（或 Codex）看的。仓库名 `toskaUI`，作者 幡幡（Toska），GitHub [@TangfanOVO](https://github.com/TangfanOVO)。

## 第一次上传到 GitHub

1. 在 GitHub 上新建仓库，名字 `toskaUI`，公开，**不要**勾选自动生成 README。
2. 在这个文件夹里：

   ```bash
   git init -b main
   git add .
   git commit -m "toskaUI：烟云材质，61 个组件"
   git remote add origin https://github.com/TangfanOVO/toskaUI.git
   git push -u origin main
   ```

3. 打开网站：仓库 Settings → Pages → Source 选 “Deploy from a branch”，Branch 选 `main`，文件夹选 `/docs`，保存。几分钟后网站在 <https://tangfanovo.github.io/toskaUI/>。README 里的“在线看全部组件”已经指向这个地址。

不想用命令行：也可以用 GitHub Desktop 把这个文件夹拖进去，点 Publish repository，再照第 3 步打开网站。

## 目录

```
README.md              仓库首页（最上面是预览大图）
HANDOFF.md             这份说明
docs/                  生成好的网站，GitHub Pages 从这里发布；别手改，改源码后重新生成
  index.html           文档站
  showcase.html        全部组件放一页的展示页
  c/<id>.html          每个组件一个独立文件，也就是网站上“复制代码”拿到的东西
materials/cloud/src/   烟云材质的源码
  core.css             配色变量（白天、夜里、灰底白云）和公用样式
  core.pre.js          物理和画法：弹簧、烟、雾、软体、阈值滤镜、流动的块、水滴……
  core.post.js         主循环、换配色、演示脚本的执行器
  comps/<id>.*         每个组件的 html / css / js
  meta.json            展示页的分组、说明（tip 也是 Prompt 里“这个组件的交互”）
  catalog.json         文档站的目录：照 Reka 分组，每个组件有哪些样式
  demos.json           每个组件的演示脚本（假鼠标怎么点）
  docs.html            文档站页面；docs.kit.js 是站上自己的云控件和换日夜的水流
tools/
  build.py             生成 docs/
  check.js             检查全部组件页：报错、手机宽度溢出、演示能不能跑完
  addbatch.py          把一批新组件（@@@ 分段的文本文件）写进 src/
  preview/             重录 README 里的预览 GIF：grid.py → record.js → make-gifs.sh
preview/*.gif          README 用的预览图
```

## 常用命令

```bash
python3 tools/build.py                 # 改了源码以后，重新生成 docs/
npm install && npx playwright install chromium
node tools/check.js                    # 全部检查，没问题会打印“全部 77 页都没问题”
npm run preview                        # 重录全部预览 GIF（要装 ffmpeg），大约十分钟
```

## 加一个组件或样式

1. 在 `materials/cloud/src/comps/` 加 `<id>.html`、`<id>.css`、`<id>.js`。
2. `meta.json` 加一条（id、名字、分组、tip），`catalog.json` 里对应的 Reka 组件下面加一个样式（id、label、h、sc、isNew），`demos.json` 加演示脚本。
3. `python3 tools/build.py`，再 `node tools/check.js`。

## 这套材质的规则（新组件照这个做）

- 组件旁边铺一块 canvas 画特效，canvas 加阈值滤镜（`#solid`）：软的烟团过了阈值就是同色、硬边、不透明的实心。
- 烟和组件是同一种材料：贴着组件冒出来时连在一起；消失是缩没，不是变淡。
- 实心＝稳定，雾＝正在变：要换位置的先化开、飘过去、再凝回来；跑起来往身后喷，停着才往上冒小云。
- 弹层 q 弹着鼓出来，关掉时化成小云散掉；越严肃的组件越安静（警告框不冒烟，但照样弹）。
- 打字、按住连发这种高频操作不冒烟；“减弱动态效果”打开时关掉所有烟、扭曲和回弹。
- 所有动都用弹簧（半隐式积分，240Hz 子步）；四个手感参数：速度、弹性、扭曲、烟雾。夸张程度跟着弹性和扭曲走，默认要安静。
- 颜色只用变量：`--bg`、`--ink`、`--body`、`--body-ink`、`--track`……换一组变量就是换一套配色。
- 压在实心上的字要反色；DOM 上的细线不能盖在实心线上（会显得空心）。
- 示例里的名字：中文 幡幡，英文 Toska（@toska）。

## 以后加新材质

复制 `materials/cloud` 成 `materials/<新名字>`，改 `core.css` 的变量和 `core.pre.js` 里的画法；组件的结构、键盘、读屏、演示脚本都可以照搬。`tools/build.py` 现在只认 `materials/cloud`，加第二种材质时，把它改成按材质分别生成到 `docs/<材质>/`，文档站顶上加一个切换材质的开关。

## 给 Codex 的一句话

> 这是 toskaUI 的完整仓库，照 HANDOFF.md 的“第一次上传到 GitHub”推到 TangfanOVO/toskaUI，并打开 GitHub Pages（main 分支的 /docs）。推之前跑一遍 `python3 tools/build.py` 和 `node tools/check.js`，确认全部通过。
