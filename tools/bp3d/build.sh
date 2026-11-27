#!/usr/bin/env bash
# Rebuild models/*.js from the BodyParts3D 4.0 database.
# Requires: Python 3 with numpy + scipy, Node.js (for gltf-transform), curl, unzip.
# Usage:   tools/bp3d/build.sh [work-dir]      (work-dir defaults to ./.bp3d-work, ~400 MB)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WORK="${1:-$ROOT/.bp3d-work}"
BASE=https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST
mkdir -p "$WORK/src" "$WORK/build"

for set in partof isa; do
  zip="$WORK/src/$set.zip"
  [ -f "$zip" ] || curl -fL -o "$zip" "$BASE/${set}_BP3D_4.0_obj_99.zip"
  [ -d "$WORK/src/$set" ] || unzip -q "$zip" -d "$WORK/src/$set"
done
SRC="$WORK/src/isa/isa_BP3D_4.0_obj_99;$WORK/src/partof/partof_BP3D_4.0_obj_99"

# 1. index every OBJ part (name, bounds, triangle count), merging both sets
python "$HERE/index.py" "$WORK/src/isa/isa_BP3D_4.0_obj_99" "$WORK/index_isa.json"
python "$HERE/index.py" "$WORK/src/partof/partof_BP3D_4.0_obj_99" "$WORK/index_partof.json"
python -c "import json,sys;a=json.load(open(sys.argv[1]))+json.load(open(sys.argv[2]));json.dump(list({r['file']:r for r in a}.values()),open(sys.argv[3],'w'))" \
  "$WORK/index_isa.json" "$WORK/index_partof.json" "$WORK/all.json"

# 2. raw per-system GLBs in app coordinates (mapping.py decides which part belongs to which app structure)
python "$HERE/build.py" "$SRC" "$WORK/all.json" "$WORK/build"
# 3. derived geometry (spinal canal path, nails, lung envelopes) and landmark-placed schematics
python "$HERE/extras.py" "$SRC" "$WORK/all.json" "$WORK/build"
python "$HERE/landmarks.py" "$SRC" "$WORK/all.json" "$WORK/build"

# 4. weld -> simplify (~12%) -> meshopt compression
GT="npx --yes @gltf-transform/cli@4.5.1"
for f in "$WORK"/build/*.raw.glb; do
  b="${f%.raw.glb}"
  $GT weld "$f" "$b.w.glb" && $GT simplify "$b.w.glb" "$b.s.glb" --ratio 0.12 --error 0.002 && $GT meshopt "$b.s.glb" "$b.glb"
  rm -f "$b.w.glb" "$b.s.glb"
done

# 5. wrap as <script> files so index.html also works when opened from disk
python "$HERE/pack.py" "$WORK/build" "$ROOT/models"
