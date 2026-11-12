# 生成录预览用的网格页：每页几格，每格是一个组件的独立页（缩小放进去），下面标名字
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'preview', '_grid')   # 录屏用的网格页（不用提交）
os.makedirs(OUT, exist_ok=True)
cat = json.load(open(os.path.join(ROOT, 'docs', 'catalog.json'), encoding='utf-8'))
def page(name, items, cols, cw, ch, theme='light'):
    bg = {'light': '#f8f7f4', 'dark': '#131312', 'white': '#c4c9cf'}[theme]
    ink = {'light': '#1a1918', 'dark': '#efeee9', 'white': '#1b1e22'}[theme]
    mute = {'light': '#75716a', 'dark': '#8f8c86', 'white': '#4e5761'}[theme]
    line = {'light': '#e7e5e0', 'dark': '#2a2927', 'white': '#b2b8bf'}[theme]
    cells = []
    for it in items:
        sc = it['sc'] * it.get('k', 1.25)
        cells.append(f'<div class="c"><iframe src="../../docs/c/{it["id"]}.html#theme-{theme}" style="width:{cw/sc:.0f}px;height:{(ch-30)/sc:.0f}px;transform:scale({sc:.3f})" scrolling="no"></iframe><b>{it["zh"]}<span>{it["en"]}</span></b></div>')
    rows = (len(items) + cols - 1) // cols
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;background:{bg}}}
.g{{display:grid;grid-template-columns:repeat({cols},{cw}px);width:{cols*cw}px}}
.c{{position:relative;width:{cw}px;height:{ch}px;overflow:hidden;box-shadow:inset -1px -1px 0 {line}}}
.c iframe{{position:absolute;left:0;top:0;border:0;transform-origin:0 0;background:{bg}}}
.c b{{position:absolute;left:14px;bottom:9px;font:600 14px "Noto Sans CJK SC","PingFang SC",sans-serif;color:{ink}}}
.c span{{margin-left:7px;font:400 11.5px ui-monospace,Menlo,monospace;color:{mute}}}
</style></head><body><div class="g">{"".join(cells)}</div></body></html>'''
    open(f'{OUT}/{name}.html', 'w', encoding='utf-8').write(html)
    return {'name': name, 'w': cols * cw, 'h': rows * ch, 'n': len(items)}
def item(v, e, label=None):
    zh = e['zh'].replace('（', '(').split('(')[0]
    lab = v.get('label') or ''
    show = lab and len(e['variants']) > 1 and lab not in ('基础', zh)   # “基础”和跟名字一样的样式名不写
    return {'id': v['id'], 'sc': v.get('sc') or .7, 'zh': zh + (f' · {lab}' if show else ''), 'en': e['reka']}
jobs = []
# 首页大图：几个最有代表性的，三个一排
pick = {'button': 0, 'switch': 0, 'select': 0, 'rangecalendar': 0, 'color-swatch-picker': 0, 'toast': 1}
hero = []
for g in cat['groups']:
    for e in g['items']:
        if e['slug'] in pick and e['variants']: it = item(e['variants'][pick[e['slug']]], e); it['zh'] = it['zh'].split(' · ')[0]; hero.append(it)
jobs.append(page('hero', hero, 3, 300, 285))
# 每一类：两个一排，最多八格一张
seen = set()
for g in cat['groups']:
    its = []
    for e in g['items']:
        for v in e['variants']:
            if v['id'] in seen: continue
            seen.add(v['id']); its.append(item(v, e))
    for k in range(0, len(its), 8):
        jobs.append(page(f'{g["en"].lower()}-{k // 8 + 1}', its[k:k + 8], 2, 360, 250))
json.dump(jobs, open(f'{OUT}/jobs.json', 'w'), ensure_ascii=False)
print(len(jobs), [j['name'] + ':' + str(j['n']) for j in jobs])
