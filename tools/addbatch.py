# 把一批新组件（batches/*.txt，用 "@@@ 文件名" 分段）写进 src/；"core.css+" / "core.pre.js+" 追加到公用部分
import sys, re
import os
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'materials', 'cloud', 'src')
for path in sys.argv[1:]:
    text = open(path, encoding='utf-8').read()
    parts = re.split(r'^@@@ (\S+)\n', text, flags=re.M)[1:]
    for name, body in zip(parts[::2], parts[1::2]):
        if name.endswith('+'):
            p = f'{SRC}/{name[:-1]}'; cur = open(p, encoding='utf-8').read()
            marker = body.strip().split('\n')[0]
            if marker in cur: print('skip (already there)', name); continue
            open(p, 'a', encoding='utf-8').write(('\n' if not cur.endswith('\n') else '') + body)
        else:
            open(f'{SRC}/comps/{name}', 'w', encoding='utf-8').write(body)
        print('wrote', name)
