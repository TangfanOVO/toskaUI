#!/usr/bin/env bash
# 把 preview/_frames 里的每一组帧做成循环的 GIF，放进 preview/。颜色那张用满 256 色，渐变不起条纹
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
for d in "$ROOT"/preview/_frames/*/; do
  n=$(basename "$d")
  if [ "$n" = "color-1" ]; then pal="palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle"
  else pal="palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle"; fi
  ffmpeg -loglevel error -y -framerate 12 -i "$d/f%04d.png" -vf "split[a][b];[a]$pal" -loop 0 "$ROOT/preview/$n.gif"
  echo "preview/$n.gif"
done
