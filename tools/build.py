# 从 materials/cloud/src 生成网站（docs/，GitHub Pages 直接从这个文件夹发布）：
#   docs/index.html          —— 文档站：全部组件、每个组件一页、自定义手感、复制代码和 Prompt
#   docs/showcase.html       —— 全部组件放一页、带说明的展示页
#   docs/c/<id>.html         —— 单个组件的独立页：一个文件就能跑，也就是“复制代码”复制出去的东西
#   docs/catalog.json        —— 目录（照 Reka 的分组）＋每个组件的 prompt
# 用法：python3 tools/build.py
import json, os, re, sys, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # 仓库根目录
SRC = os.path.join(ROOT, 'materials', 'cloud', 'src')                   # 烟云材质的源码
SITE = os.path.join(ROOT, 'docs')                                       # 生成的网站（GitHub Pages 从这里发布）
VER = sys.argv[1] if len(sys.argv) > 1 else 'v26'
os.makedirs(SITE + '/c', exist_ok=True)
R = lambda p: open(f'{SRC}/{p}', encoding='utf-8').read()
meta = json.load(open(f'{SRC}/meta.json', encoding='utf-8'))
core_css, pre, post = R('core.css'), R('core.pre.js'), R('core.post.js')
FILTER = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <filter id="solid" color-interpolation-filters="sRGB">
    <feComponentTransfer><feFuncA type="linear" slope="22" intercept="-10"/></feComponentTransfer>
  </filter>
</svg>'''
THEME_HASH = '<script>try{var m=location.hash.match(/theme-(dark|light|white)/);if(m)document.documentElement.setAttribute("data-theme",m[1]);}catch(e){}</script>'
def comp(cid, ext):
    p = f'{SRC}/comps/{cid}.{ext}'
    return open(p, encoding='utf-8').read() if os.path.exists(p) else ''
def indent(t, n): return '\n'.join((' ' * n + l) if l.strip() else l for l in t.rstrip('\n').split('\n'))

# ---------------- 展示页 ----------------
head = R('showcase_head.html').replace(re.search(r'组件小样 v\d+', R('showcase_head.html')).group(), f'组件小样 {VER}')
parts, grp = [], None
for m in meta:
    if m['group'] != grp:
        grp = m['group']; parts.append(f'    <h2 class="grp">{grp}</h2>')
    tip = f'\n      <p class="tip">{m["tip"]}</p>' if m['tip'] else ''
    parts.append(f'    <div class="{m["demo"]}">\n      <span class="cap">{m["cap"]}</span>\n{indent(comp(m["id"], "html"), 6)}{tip}\n    </div>')
all_css = core_css + ''.join(comp(m['id'], 'css') for m in meta) + R('last.css')
all_js = pre + ''.join(comp(m['id'], 'js') + '\n' for m in meta) + post
extras = ''.join(comp(m['id'], 'extra.html') for m in meta)
show = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>实心云 · 组件小样 {VER}</title>
<style>
{all_css}</style>
</head>
<body>
{FILTER}
<div class="wrap">
{head}  <section class="stage" id="stage">
{chr(10).join(parts)}
  </section>

{R('showcase_tail.html')}</div>

{extras}
<script>
{all_js}</script>
</body>
</html>
'''
open(f'{SITE}/showcase.html', 'w', encoding='utf-8').write(show)

# ---------------- 单个组件的独立页 ----------------
cat = json.load(open(f'{SRC}/catalog.json', encoding='utf-8'))
reka_of = {}
for g in cat['groups']:
    for e in g['items']:
        for v in e.get('variants', []): reka_of.setdefault(v['id'], e['reka'])
SOLO_CSS = '''
/* 单独一页：组件放在正中间，不带说明 */
.wrap.solo{max-width:none;min-height:100vh;padding:0;display:flex}
.stage.solo{flex:1;display:flex;align-items:center;justify-content:center;min-height:100vh;border:0;border-radius:0}
.stage.solo .demo{width:100%;max-width:640px;padding:56px 16px}
.stage.solo .demo.pop{min-height:100vh;justify-content:flex-start;padding-top:64px}
'''
DEMOS = json.load(open(f'{SRC}/demos.json', encoding='utf-8'))
for m in meta:
    cid = m['id']
    demo_js = 'window.__DEMO = ' + json.dumps(DEMOS.get(cid), ensure_ascii=False) + ';\n'
    solo = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{m["cap"]} · toskaUI</title>
<!-- toskaUI · 烟云 · {m["cap"]}（对应 Reka UI 的 {reka_of.get(cid, "—")}）
     一个文件就能跑：存成 .html，用浏览器打开。颜色在 :root 的几个变量里，手感在脚本里的 F（速度、弹性、扭曲、烟雾）。
     灵感来自 goopUI（Tim McMasters），结构、尺寸和示例文字参考 Reka UI。 -->
{THEME_HASH}
<style>
{core_css}{comp(cid, "css")}{R("last.css")}{SOLO_CSS}</style>
</head>
<body>
{FILTER}
<div class="wrap solo"><section class="stage solo" id="stage">
  <div class="{m["demo"]}">
{indent(comp(cid, "html"), 4)}
  </div>
</section></div>
{comp(cid, "extra.html")}
<script>
{demo_js}{pre}{comp(cid, "js")}
{post}</script>
</body>
</html>
'''
    open(f'{SITE}/c/{cid}.html', 'w', encoding='utf-8').write(solo)

# ---------------- 目录 + prompt ----------------
RULES = '''材质叫“实心云”，规则：
1. 组件旁边铺一块 canvas 画特效，canvas 加 SVG 阈值滤镜：<filter id="solid" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="22" intercept="-10"/></feComponentTransfer></filter>。软的烟团过了阈值，就变成和组件同色、硬边、不透明的实心。
2. 烟和组件是同一种材料：贴着组件冒出来时和它连在一起；消失时是缩小到没有，不是变淡。
3. 实心＝稳定，雾＝正在变：要换位置的东西先化开、飘过去、再凝回来；跑起来往身后喷尾迹，停着才往上冒小云。
4. 弹层（面板、菜单、对话框）q 弹着鼓出来，边上冒一圈小云；关掉时化成小云散掉。越严肃的组件越安静。
5. 打字、按住连发这种高频操作不冒烟；系统开了“减弱动态效果”就关掉所有烟、扭曲和回弹，组件照常能用。
6. 所有动都用弹簧驱动（半隐式积分，240Hz 子步）；四个手感参数：速度、弹性、扭曲、烟雾。
7. 颜色只用变量：--bg（底）、--ink（字）、--body（组件和烟）、--body-ink（组件上的字）、--track（轨道）；换一组变量就是换一套配色。'''
tips = {m['id']: m['tip'] for m in meta}
caps = {m['id']: m['cap'] for m in meta}
for g in cat['groups']:
    for e in g['items']:
        for v in e.get('variants', []):
            v['label'] = v.get('label') or caps[v['id']]
            v['tip'] = tips[v['id']]
            v['prompt'] = (f'帮我做一个「{v["label"]}」组件，结构、键盘操作和读屏照 Reka UI 的 {e["reka"]} 来（用我项目里的框架；没有框架就用原生 HTML + Canvas + JS）。\n\n'
                           f'{RULES}\n\n这个组件的交互：{tips[v["id"]] or "点开时 q 弹着鼓出来，边上冒一圈小云；点外面或按 Esc，化成小云散掉。"}\n\n'
                           f'参考：toskaUI 的“烟云”材质（灵感来自 goopUI，结构参考 Reka UI）。')
json.dump(cat, open(f'{SITE}/catalog.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('built', VER, 'showcase', len(show), 'bytes;', len(meta), 'solo pages')

# ---------------- 文档站首页 ----------------
docs = R('docs.html').replace('/*CATALOG*/null', json.dumps(cat, ensure_ascii=False).replace('</', '<\\/'))
# 文档站自己的控件（分段选择、日夜开关、换日夜的水流）跟组件用同一套引擎
docs = docs.replace('<!--ENGINE-->', '<script>\n' + pre + R('docs.kit.js') + '\n' + post + '</script>')
# 网站首页：docs.html 本身不带 <!doctype> 和 <head>（在 claude.ai 上发布时会自动包一层），放到 GitHub Pages 要自己包上
docs = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + docs
open(f'{SITE}/index.html', 'w', encoding='utf-8').write(docs)
print('docs index', len(docs), 'bytes')
