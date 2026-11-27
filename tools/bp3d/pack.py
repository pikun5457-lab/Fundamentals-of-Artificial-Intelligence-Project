"""Wrap GLB + extras as plain <script> files so the app also works from file:// (no fetch needed)."""
import base64, json, os, sys
import numpy as np
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
systems = []
for f in sorted(os.listdir(SRC)):
    if f.endswith('.glb') and not f.endswith('.raw.glb'):
        k = f[:-4]; systems.append(k)
        b64 = base64.b64encode(open(os.path.join(SRC, f), 'rb').read()).decode()
        with open(os.path.join(OUT, k + '.js'), 'w') as fh:
            fh.write('// Generated from BodyParts3D (c) DBCLS, CC BY-SA 2.1 JP. Do not edit; see tools/bp3d.\n')
            fh.write(f'(window.BP3D_MODELS = window.BP3D_MODELS || {{}})["{k}"] = "{b64}";\n')
ex = json.load(open(os.path.join(SRC, 'extras.json')))
# median-filter the canal depth to suppress per-vertebra detection noise
z = np.array([c['p'][2] for c in ex['spinal_cord']])
zf = np.array([np.median(z[max(0, i - 2):i + 3]) for i in range(len(z))])
for c, v in zip(ex['spinal_cord'], zf): c['p'][2] = round(float(v), 4)
with open(os.path.join(OUT, 'extras.js'), 'w') as fh:
    fh.write('// Geometry derived from BodyParts3D meshes (spinal canal path, nail beds, lung envelopes). Generated; see tools/bp3d.\n')
    fh.write('window.BP3D_EXTRAS = ' + json.dumps(ex, separators=(',', ':')) + ';\n')
    fh.write('window.BP3D_SYSTEMS = ' + json.dumps(systems) + ';\n')
    placed = os.path.join(SRC, 'placed.json')
    if os.path.exists(placed):
        fh.write('// Schematic shapes for structures absent from BodyParts3D, positioned on measured landmarks of the real meshes.\n')
        fh.write('window.BP3D_PLACED = ' + open(placed).read() + ';\n')
print(systems)
