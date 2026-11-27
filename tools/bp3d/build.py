"""Convert BodyParts3D OBJ parts into per-system GLB files in the app's coordinate frame."""
import json, re, os, sys, struct, collections
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from mapping import RULES, PART_COLOURS

SRC_DIRS = os.environ.get('BP3D_SRC', '').split(';')

# BodyParts3D: mm, +X = body's left, -Y = anterior, +Z = superior.
# App frame:  +x = body's left, +z = anterior, +y = up; feet ~-1.82, vertex ~1.845.
Z0, Z1 = -78.0, 1652.0
S = (1.845 + 1.82) / (Z1 - Z0)
YC = -101.0
def to_app(v):
    out = np.empty_like(v)
    out[:, 0] = v[:, 0] * S
    out[:, 1] = (v[:, 2] - Z0) * S - 1.82
    out[:, 2] = -(v[:, 1] - YC) * S
    return out

def find(fid):
    for d in SRC_DIRS:
        p = os.path.join(d, fid + '.obj')
        if os.path.exists(p): return p

def load_obj(path):
    vs, fs = [], []
    with open(path, encoding='utf-8', errors='replace') as fh:
        for line in fh:
            if line.startswith('v '):
                vs.append([float(x) for x in line.split()[1:4]])
            elif line.startswith('f '):
                idx = [int(t.split('/')[0]) for t in line.split()[1:]]
                for k in range(1, len(idx) - 1):
                    fs.append([idx[0], idx[k], idx[k + 1]])
    return np.array(vs, np.float32), np.array(fs, np.uint32) - 1

def part_colour(name, default):
    for pat, c in PART_COLOURS:
        if re.search(pat, name, re.I): return c
    return default

def main(INDEX, OUT):
    os.makedirs(OUT, exist_ok=True)
    rows = json.load(open(INDEX))
    comp = [(i, s, [re.compile(p, re.I) for p in pats], c) for i, s, pats, c in RULES]
    groups = collections.defaultdict(lambda: collections.defaultdict(list))  # sys -> (id, part, colour) -> files
    for r in rows:
        n = (r['name'] or '').strip()
        for i, s, ps, c in comp:
            if any(p.search(n) for p in ps):
                groups[s][(i, n, part_colour(n, c))].append(r['file']); break

    manifest = {}
    for sysname, parts in groups.items():
        bin_ = bytearray(); bviews, accs, meshes, nodes, mats, matidx = [], [], [], [], [], {}
        def view(data, target):
            while len(bin_) % 4: bin_.append(0)
            bviews.append(dict(buffer=0, byteOffset=len(bin_), byteLength=len(data), target=target)); bin_.extend(data)
            return len(bviews) - 1
        for (sid, pname, col), files in sorted(parts.items()):
            V, F, off = [], [], 0
            for f in files:
                v, fc = load_obj(find(f)); V.append(v); F.append(fc + off); off += len(v)
            v = to_app(np.concatenate(V)).astype(np.float32); f = np.concatenate(F).astype(np.uint32)
            if col not in matidx:
                matidx[col] = len(mats)
                rgb = [((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255]
                mats.append(dict(name='%06x' % col, pbrMetallicRoughness=dict(baseColorFactor=[c ** 2.2 for c in rgb] + [1],
                                                                             metallicFactor=0.05, roughnessFactor=0.55)))
            pv = view(v.tobytes(), 34962); iv = view(f.tobytes(), 34963)
            accs.append(dict(bufferView=pv, componentType=5126, count=len(v), type='VEC3', min=v.min(0).tolist(), max=v.max(0).tolist()))
            accs.append(dict(bufferView=iv, componentType=5125, count=f.size, type='SCALAR'))
            meshes.append(dict(name=f'{sid}|{pname}', primitives=[dict(attributes=dict(POSITION=len(accs) - 2), indices=len(accs) - 1, material=matidx[col])]))
            nodes.append(dict(name=f'{sid}|{pname}', mesh=len(meshes) - 1))
            manifest.setdefault(sid, []).append(pname)
        while len(bin_) % 4: bin_.append(0)
        gl = dict(asset=dict(version='2.0', generator='bp3d-build', copyright='BodyParts3D (c) The Database Center for Life Science, CC BY-SA 2.1 JP'),
                  scene=0, scenes=[dict(nodes=list(range(len(nodes))))], nodes=nodes, meshes=meshes, materials=mats,
                  accessors=accs, bufferViews=bviews, buffers=[dict(byteLength=len(bin_))])
        js = json.dumps(gl, separators=(',', ':')).encode()
        js += b' ' * ((4 - len(js) % 4) % 4)
        with open(os.path.join(OUT, sysname + '.raw.glb'), 'wb') as fh:
            fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
            fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
            fh.write(struct.pack('<II', len(bin_), 0x004E4942)); fh.write(bin_)
        print(sysname, len(nodes), 'meshes', round(len(bin_) / 1e6, 1), 'MB')
    json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)


if __name__ == '__main__':
    SRC_DIRS[:] = sys.argv[1].split(';')
    main(sys.argv[2], sys.argv[3])
