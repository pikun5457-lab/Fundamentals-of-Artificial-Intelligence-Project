"""Derived geometry: spinal cord centreline, nail positions, lung envelopes, and landmark report."""
import json, re, os, sys
import numpy as np
from scipy.spatial import ConvexHull
sys.path.insert(0, os.path.dirname(__file__))
import build
from build import load_obj, to_app, find
build.SRC_DIRS[:] = sys.argv[1].split(';')
rows = json.load(open(sys.argv[2])); OUT = sys.argv[3]
byname = {}
for r in rows: byname.setdefault(r['name'], []).append(r['file'])
def pts(name_re):
    P = []
    for n, fs in byname.items():
        if n and re.search(name_re, n, re.I):
            for f in fs: P.append(to_app(load_obj(find(f))[0]))
    return np.concatenate(P) if P else np.zeros((0, 3))
def r3(a): return [round(float(x), 4) for x in a]
out = {}
# spinal cord: find the vertebral canal (largest empty z-gap in the mid-sagittal slice) of each vertebra
ORD = ['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth']
levels = ['Atlas', 'Axis'] + [f'{o.capitalize()} cervical vertebra' for o in ORD[2:7]] +          [f'{o.capitalize()} thoracic vertebra' for o in ORD] + [f'{o.capitalize()} lumbar vertebra' for o in ORD[:5]] + ['Sacrum']
cord = []
for n in levels:
    v = pts('^' + re.escape(n) + '$')
    if not len(v): continue
    from scipy.spatial import cKDTree
    ymid = np.median(v[:, 1]) if n != 'Sacrum' else v[:, 1].max() - 0.03
    sl = v[np.abs(v[:, 1] - ymid) < 0.014][:, [0, 2]]
    tree = cKDTree(sl); best = None
    zmx, zmn = v[:, 2].max(), v[:, 2].min(); dep = zmx - zmn
    for z in np.linspace(zmx - 0.62 * dep, zmx - 0.28 * dep, 120):
        ant = (sl[:, 1] > z) & (np.abs(sl[:, 0]) < 0.01); post = (sl[:, 1] < z) & (np.abs(sl[:, 0]) < 0.01)
        lat = sl[np.abs(sl[:, 1] - z) < 0.01]
        if not (ant.any() and post.any() and (lat[:, 0] > 0.005).any() and (lat[:, 0] < -0.005).any()): continue
        d = tree.query([0, z])[0]
        if best is None or d > best[0]: best = (d, z)
    if best: cord.append(dict(level=n, p=r3([0.0, float(ymid), float(best[1])]), r=round(float(best[0]), 4)))
out['spinal_cord'] = cord
# nails: on the dorsal surface of the distal half of each distal phalanx
nails = []
for n, fs in byname.items():
    if n and n.startswith('Distal phalanx of'):
        v = to_app(load_obj(find(fs[0]))[0]); toe = 'toe' in n
        axis = np.array([0, 0, 1.0]) if toe else np.array([0, -1.0, 0])
        dors = np.array([0, 1.0, 0]) if toe else np.array([0, 0, -1.0])
        t = v @ axis; distal = v[t > np.percentile(t, 45)]
        top = distal[(distal @ dors) > np.percentile(distal @ dors, 85)]
        nails.append(dict(name=n, p=r3(top.mean(0)), toe=toe, len=round(float(np.ptp(distal @ axis)), 4),
                          w=round(float(np.ptp(distal[:, 0])), 4)))
out['nails'] = nails
# lung envelopes from bronchial tree + segmental vessels
lp = pts(r'bronchial tree$|segmental (artery|vein)|lingular (artery|vein)')
lungs = {}
for side, sel in (('right', lp[:, 0] < -0.02), ('left', lp[:, 0] > 0.02)):
    P = lp[sel]; c = P.mean(0)
    P = c + (P - c) * np.array([1.18, 1.10, 1.18])
    h = ConvexHull(P); used = np.unique(h.simplices); remap = {o: i for i, o in enumerate(used)}
    lungs[side] = dict(v=[r3(P[i]) for i in used], f=[[remap[a] for a in t] for t in h.simplices.tolist()])
out['lungs'] = lungs
json.dump(out, open(os.path.join(OUT, 'extras.json'), 'w'), separators=(',', ':'))
# landmark report for aligning schematic structures
for n in ['Skin', 'Right kidney', 'Left kidney', 'Pancreas', 'Trachea', 'Esophagus', 'Urinary bladder', 'Prostate', 'Rectum',
          'Left humerus', 'Right femur', 'Left hip bone', 'Sacrum', 'Mandible', 'Thyroid cartilage', 'Manubrium', 'Body of sternum',
          'Left scapula', 'Left clavicle', 'Fifth lumbar vertebra', 'First thoracic vertebra', 'Left external oblique', 'Left temporal bone',
          'Left zygomatic bone', 'Frontal bone', 'Left ulna', 'Left tibia', 'Spleen', 'Stomach', 'Left lobe of thymus', 'Left main bronchus',
          'Cricoid cartilage', 'Left serratus anterior', 'Linea alba', 'Left psoas major', 'Left sartorius', 'Left gluteus maximus',
          'Left radius', 'Left fibula', 'Left external iliac artery', 'Left femoral artery', 'Left axillary artery', 'Left subclavian artery',
          'Left brachial artery', 'Left femoral vein', 'Left common iliac vein', 'Left eleventh rib', 'Diaphragm', 'Tongue']:
    v = pts('^' + re.escape(n) + '$')
    if len(v): print(f"{n:28s} min {r3(v.min(0))} max {r3(v.max(0))}")
