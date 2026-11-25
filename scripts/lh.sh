#!/bin/bash
# usage: scripts/lh.sh BASE [mobile|desktop]
BASE=${1:-http://localhost:4321}; MODE=${2:-mobile}
for p in / /online-habit-tracker/ /printable-habit-tracker/ /habit-tracker-for-iphone/ /blog/how-to-track-habits-effectively/ /features/; do
  n=$(echo "$p" | tr '/' '_'); extra=""; [ "$MODE" = desktop ] && extra="--preset=desktop"
  npx --yes lighthouse@12 "$BASE$p" $extra --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="lighthouse-reports/${MODE}${n}.json" >/dev/null 2>&1
  node -e "const r=require('./lighthouse-reports/${MODE}${n}.json');const c=r.categories;const a=r.audits;console.log('$MODE $p', Object.entries(c).map(([k,v])=>k.slice(0,4)+':'+Math.round(v.score*100)).join(' '), 'LCP',a['largest-contentful-paint'].displayValue,'CLS',a['cumulative-layout-shift'].displayValue,'TBT',a['total-blocking-time'].displayValue)"
done
