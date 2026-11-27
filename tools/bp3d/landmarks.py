"""Place structures that BodyParts3D lacks onto measured landmarks of the real meshes.

Output: build/placed.json  {structure_id: {tubes:[], ells:[], rings:[], meshes:[]}} in app coordinates
(+x = body's left, +y = up, +z = anterior; 1 unit ~= 472 mm).
"""
import json, os, re, sys
import numpy as np
from scipy.spatial import cKDTree
sys.path.insert(0, os.path.dirname(__file__))
import build
from build import load_obj, to_app, find

build.SRC_DIRS[:] = sys.argv[1].split(';')
rows = json.load(open(sys.argv[2]))
OUT = sys.argv[3]
MM = build.S  # app units per mm

byname = {}
for r in rows:
    byname.setdefault(r['name'], []).append(r['file'])
_cache = {}
def V(name):
    if name not in _cache:
        fs = byname.get(name)
        if not fs:
            raise KeyError(name)
        _cache[name] = np.concatenate([to_app(load_obj(find(f))[0]) for f in fs])
    return _cache[name]

def r3(a): return [round(float(x), 4) for x in a]

def centerline(name, n=12, start_near=None):
    """Mean of vertex slices along the principal axis; ordered to start nearest `start_near`."""
    v = V(name); c = v.mean(0)
    ax = np.linalg.svd(v - c, full_matrices=False)[2][0]
    t = (v - c) @ ax
    edges = np.linspace(t.min(), t.max(), n + 1)
    pts = [v[(t >= a) & (t <= b)].mean(0) for a, b in zip(edges[:-1], edges[1:]) if ((t >= a) & (t <= b)).any()]
    pts = np.array(pts)
    if start_near is not None and np.linalg.norm(pts[-1] - start_near) < np.linalg.norm(pts[0] - start_near):
        pts = pts[::-1]
    elif start_near is None and pts[-1][1] > pts[0][1]:
        pts = pts[::-1]  # default: top -> bottom
    return pts

def resample(pts, n):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    s = np.linspace(0, d[-1], n)
    return np.array([np.interp(s, d, pts[:, k]) for k in range(3)]).T

def at_y(pts, y):
    """Linear interpolation of a roughly vertical polyline at height y."""
    o = np.argsort(pts[:, 1])
    return np.array([np.interp(y, pts[o, 1], pts[o, k]) for k in range(3)])

out = {}
def add(sid, kind, **kw):
    out.setdefault(sid, {}).setdefault(kind, []).append(kw)

NERVE, SYMP, LYMPH, MUS = 0xf5d547, 0xff9f1c, 0x4cc9f0, 0xb8453a
SIDES = (('Left', 1), ('Right', -1))

# --------------------------------------------------------------------------- spinal canal (for nerve roots)
ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']
def vert(name):
    return V(name)
def canal_z(v):
    """Centre of the vertebral foramen: midway between back of body and front of spinous process at mid-height."""
    ym = np.median(v[:, 1]); sl = v[(np.abs(v[:, 1] - ym) < 0.012) & (np.abs(v[:, 0]) < 0.008)]
    z = np.sort(sl[:, 2])
    g = np.diff(z); k = g.argmax()
    return (z[k] + z[k + 1]) / 2, ym
def body_front(v):
    ym = np.median(v[:, 1]); sl = v[np.abs(v[:, 1] - ym) < 0.012]
    zmax = sl[:, 2].max(); band = sl[sl[:, 2] > zmax - 0.03]
    return zmax, np.abs(band[:, 0]).max(), ym

# --------------------------------------------------------------------------- brachial plexus & upper-limb nerves
for Side, s in SIDES:
    sub = centerline(f'{Side} subclavian artery', 10, start_near=np.array([0, 1.2, 0]))
    br = centerline(f'{Side} brachial artery', 14)
    rad = centerline(f'{Side} radial artery', 12)
    uln = centerline(f'{Side} ulnar artery', 12)
    hum = V(f'{Side} humerus'); hc = centerline(f'{Side} humerus', 12)
    ret = V(f'Flexor retinaculum of {Side.lower()} wrist').mean(0)
    pis = V(f'{Side} pisiform').mean(0)
    # epicondyles: extreme medial / lateral vertices of distal humerus
    dist = hum[hum[:, 1] < hum[:, 1].min() + 0.03]
    med_epi = dist[np.argmin(s * dist[:, 0])]; lat_epi = dist[np.argmax(s * dist[:, 0])]
    roots = []
    for lvl in ['Fifth cervical vertebra', 'Sixth cervical vertebra', 'Seventh cervical vertebra', 'First thoracic vertebra']:
        v = V(lvl); zc, ym = canal_z(v)
        roots.append(np.array([s * 0.035, ym - 0.012, zc]))
    roots.insert(3, (roots[2] + roots[3]) / 2)  # C8 between C7 and T1
    trunk = sub[-1] + np.array([0, 0.012, -0.012])           # behind clavicle, above/behind subclavian artery
    axilla = br[0] + np.array([0, 0.01, -0.008])
    for i, r in enumerate(roots):
        add('brachial_plexus', 'tubes', part=f'{Side} root {["C5", "C6", "C7", "C8", "T1"][i]}',
            pts=[r3(r), r3(r * 0.5 + trunk * 0.5 + np.array([s * 0.02, 0, 0.01])), r3(trunk)], r=0.0045, c=NERVE)
    add('brachial_plexus', 'tubes', part=f'{Side} brachial plexus (trunks → cords)', pts=[r3(trunk), r3((trunk + axilla) / 2), r3(axilla)], r=0.0075, c=NERVE)
    # forearm midline between radial and ulnar arteries
    ra, ua = resample(rad, 10), resample(uln, 10)
    mid_fore = (ra + ua) / 2 + np.array([0, 0, -0.004])
    median = [axilla] + [p + np.array([s * 0.004, 0, 0.006]) for p in resample(br, 6)[1:]] + list(mid_fore[1:-1]) + \
             [ret + np.array([0, 0.01, 0.003]), ret + np.array([0, -0.045, 0.006])]
    add('brachial_plexus', 'tubes', part=f'{Side} median nerve', pts=[r3(p) for p in median], r=0.0045, c=NERVE)
    ub = resample(br, 6)
    ulnar = [axilla] + [p + np.array([-s * 0.014, 0, -0.012]) for p in ub[1:4]] + \
            [med_epi + np.array([-s * 0.002, 0.012, -0.014]), med_epi + np.array([s * 0.002, -0.02, -0.01])] + \
            [p + np.array([-s * 0.008, 0, -0.004]) for p in resample(uln, 8)[3:-1]] + \
            [pis + np.array([s * 0.009, 0, 0.006]), pis + np.array([s * 0.006, -0.045, 0.008])]
    add('brachial_plexus', 'tubes', part=f'{Side} ulnar nerve', pts=[r3(p) for p in ulnar], r=0.004, c=NERVE)
    # radial nerve: spiral groove on the posterior humerus, then lateral epicondyle, then with the radial artery
    h = resample(hc, 10)
    radial = [axilla, h[2] + np.array([-s * 0.004, 0, -0.024]), h[4] + np.array([s * 0.006, 0, -0.022]),
              h[6] + np.array([s * 0.022, 0, -0.006]), lat_epi + np.array([s * 0.004, 0.03, 0.012]),
              lat_epi + np.array([-s * 0.006, -0.02, 0.016])] + \
             [p + np.array([s * 0.009, 0, 0.002]) for p in resample(rad, 8)[2:-1]] + [ra[-1] + np.array([s * 0.006, -0.02, -0.012])]
    add('brachial_plexus', 'tubes', part=f'{Side} radial nerve', pts=[r3(p) for p in radial], r=0.004, c=NERVE)

# --------------------------------------------------------------------------- lumbosacral plexus & lower-limb nerves
for Side, s in SIDES:
    fem_a = centerline(f'{Side} femoral artery', 14)
    pop = centerline(f'{Side} popliteal artery', 6)
    pta = centerline(f'{Side} posterior tibial artery', 10)
    ata = centerline(f'{Side} anterior tibial artery', 10)
    psoas = centerline(f'{Side} psoas major', 10)
    femur = centerline(f'{Side} femur', 12)
    fib = V(f'{Side} fibula'); fib_head = fib[fib[:, 1] > fib[:, 1].max() - 0.02].mean(0)
    pir = V(f'{Side} piriformis'); pir_lat = pir[np.argmax(s * pir[:, 0])]; pir_low = pir[pir[:, 1] < np.percentile(pir[:, 1], 20)].mean(0)
    sac = V('Sacrum')
    # femoral nerve L2-L4: lateral border of psoas, under inguinal ligament lateral to femoral artery
    roots = []
    for lvl in ['Second lumbar vertebra', 'Third lumbar vertebra', 'Fourth lumbar vertebra']:
        v = V(lvl); zc, ym = canal_z(v); roots.append(np.array([s * 0.04, ym - 0.02, zc + 0.02]))
    ps = resample(psoas, 10)
    lat_ps = [p + np.array([s * 0.022, 0, 0.004]) for p in ps[3:7]]
    fa = resample(fem_a, 14)
    femoral = [roots[1]] + lat_ps + [fa[0] + np.array([s * 0.02, 0.01, 0]), fa[2] + np.array([s * 0.016, 0, 0.002]), fa[4] + np.array([s * 0.014, 0, -0.004])]
    for r in roots:
        add('lumbosacral_plexus', 'tubes', part=f'{Side} lumbar plexus root', pts=[r3(r), r3((r + lat_ps[0]) / 2), r3(lat_ps[0])], r=0.004, c=NERVE)
    add('lumbosacral_plexus', 'tubes', part=f'{Side} femoral nerve', pts=[r3(p) for p in femoral], r=0.0055, c=NERVE)
    # sciatic L4-S3: anterior sacral foramina -> below piriformis -> posterior thigh behind femur
    stop = sac[:, 1].max()
    sroots = []
    for dy in (0.03, 0.065, 0.1):
        band = sac[np.abs(sac[:, 1] - (stop - dy)) < 0.01]
        sroots.append(np.array([s * 0.032, stop - dy, band[:, 2].max() - 0.008]))
    exitp = pir_low + np.array([s * 0.02, -0.025, -0.01])
    fm = resample(femur, 12)
    thigh = [p + np.array([s * 0.004, 0, -0.05]) for p in fm[2:9]]
    popl = resample(pop, 6)
    sciatic = [exitp] + thigh + [popl[1] + np.array([0, 0.01, -0.012])]
    for r in sroots:
        add('lumbosacral_plexus', 'tubes', part=f'{Side} sacral plexus root', pts=[r3(r), r3((r + exitp) / 2 + np.array([0, 0.01, -0.02])), r3(exitp)], r=0.005, c=NERVE)
    add('lumbosacral_plexus', 'tubes', part=f'{Side} sciatic nerve', pts=[r3(p) for p in sciatic], r=0.0085, c=NERVE)
    split = sciatic[-1]
    tib = [split] + [p + np.array([0, 0, -0.012]) for p in popl[2:]] + [p + np.array([-s * 0.004, 0, -0.008]) for p in resample(pta, 10)[1:]]
    add('lumbosacral_plexus', 'tubes', part=f'{Side} tibial nerve', pts=[r3(p) for p in tib], r=0.0055, c=NERVE)
    at = resample(ata, 10)
    cfn = [split, split + np.array([s * 0.02, -0.04, 0.002]), fib_head + np.array([s * 0.01, 0.005, -0.012]),
           fib_head + np.array([s * 0.012, -0.035, 0.012])] + [p + np.array([s * 0.008, 0, 0.004]) for p in at[2:]]
    add('lumbosacral_plexus', 'tubes', part=f'{Side} common fibular nerve', pts=[r3(p) for p in cfn], r=0.0045, c=NERVE)

# --------------------------------------------------------------------------- sympathetic trunks
levels = ['Axis'] + [f'{o.capitalize()} cervical vertebra' for o in ORD[2:7]] + [f'{o.capitalize()} thoracic vertebra' for o in ORD] + \
         [f'{o.capitalize()} lumbar vertebra' for o in ORD[:5]]
for Side, s in SIDES:
    pts = []
    for lvl in levels:
        zmax, hw, ym = body_front(V(lvl))
        thor = 'thoracic' in lvl
        pts.append(np.array([s * (hw + (0.012 if thor else 0.002)), ym, zmax - (0.03 if thor else 0.012)]))
    pts = np.array(pts)
    add('sympathetic_chain', 'tubes', part=f'{Side} sympathetic trunk', pts=[r3(p) for p in pts], r=0.0028, c=SYMP)
    for i, (lvl, p) in enumerate(zip(levels, pts)):
        name = {'Axis': 'superior cervical ganglion', 'Sixth cervical vertebra': 'middle cervical ganglion',
                'First thoracic vertebra': 'cervicothoracic (stellate) ganglion'}.get(lvl)
        if name or 'thoracic' in lvl or 'lumbar' in lvl:
            big = 2.2 if lvl == 'Axis' else 1.4 if name else 1.0
            add('sympathetic_chain', 'ells', part=f'{Side} {name or "paravertebral ganglion (" + lvl.split()[0] + " " + lvl.split()[1] + ")"}',
                p=r3(p), s=r3([0.0055 * big, 0.009 * big, 0.0055 * big]), c=SYMP)

# --------------------------------------------------------------------------- thyroid & parathyroids
tr = V('Trachea'); cri = V('Cricoid cartilage')
yb = cri[:, 1].min()
ring = tr[np.abs(tr[:, 1] - (yb - 0.025)) < 0.01]
tc = ring.mean(0); trad = np.abs(ring[:, 0]).max(); tfront = ring[:, 2].max()
for Side, s in SIDES:
    lobe = np.array([s * (trad + 0.013), yb - 0.018, tc[2] + 0.006])
    add('thyroid_parathyroid', 'ells', part=f'{Side} lobe of thyroid gland', p=r3(lobe), s=r3([0.011, 0.024, 0.012]), c=0xe76f51)
    for dy, nm in ((0.012, 'superior'), (-0.03, 'inferior')):
        add('thyroid_parathyroid', 'ells', part=f'{Side} {nm} parathyroid gland', p=r3(lobe + np.array([0, dy, -0.012])), s=[0.0035, 0.0045, 0.0035], c=0xffd166)
add('thyroid_parathyroid', 'ells', part='Isthmus of thyroid gland (rings 2–4)', p=r3([0, yb - 0.03, tfront + 0.005]), s=[0.017, 0.008, 0.005], c=0xe76f51)

# --------------------------------------------------------------------------- pancreatic islets (inside the real pancreas parenchyma)
pan = V('Pancreas') if 'Pancreas' in byname else V('Parenchyma of pancreas')
tree = cKDTree(pan)
rng = np.random.default_rng(7)
order = np.argsort(pan[:, 0])
picks = pan[order[np.linspace(int(len(order) * 0.08), len(order) - 1, 22).astype(int)]]
for i, p in enumerate(picks):
    nb = pan[tree.query(p, k=80)[1]].mean(0)   # local mid-thickness of the gland
    add('pancreatic_islets', 'ells', part='Islet cluster (Langerhans, magnified)' + (' – tail, densest' if p[0] > 0.08 else ''),
        p=r3(nb), s=[0.0045, 0.0045, 0.0045], c=0xffb703)

# --------------------------------------------------------------------------- tonsils / Waldeyer ring
tg = V('Tongue')
back = tg[tg[:, 2] < tg[:, 2].min() + 0.02]
root = back.mean(0)
spc = V('Left superior pharyngeal constrictor')
for Side, s in SIDES:
    hw = np.abs(back[:, 0]).max()
    add('tonsils_malt', 'ells', part=f'{Side} palatine tonsil', p=r3([s * (hw + 0.004), root[1] + 0.012, root[2] + 0.004]), s=[0.007, 0.012, 0.008], c=LYMPH)
add('tonsils_malt', 'ells', part='Lingual tonsil', p=r3([0, back[:, 1].max() - 0.004, root[2] + 0.01]), s=[0.016, 0.005, 0.01], c=LYMPH)
top = spc[spc[:, 1] > spc[:, 1].max() - 0.015].mean(0)
add('tonsils_malt', 'ells', part='Pharyngeal tonsil (adenoid)', p=r3([0, top[1] - 0.004, top[2] + 0.006]), s=[0.014, 0.008, 0.007], c=LYMPH)

# --------------------------------------------------------------------------- lymphatic ducts & node chains
ab = centerline('Abdominal aorta', 8)
dta = centerline('Descending thoracic aorta', 12) if 'Descending thoracic aorta' in byname else centerline('Descending aorta', 12)
az = centerline('Azygos vein', 12)
lbc = V('Left brachiocephalic vein'); l_angle = lbc[np.argmax(lbc[:, 0])]
rbc = V('Right brachiocephalic vein'); r_angle = rbc[np.argmin(rbc[:, 0])]
l1 = V('First lumbar vertebra'); y_l1 = np.median(l1[:, 1]); y_l2 = np.median(V('Second lumbar vertebra')[:, 1])
cist = at_y(ab, (y_l1 + y_l2) / 2) + np.array([-0.018, 0, -0.02])
add('lymph_nodes_ducts', 'ells', part='Cisterna chyli (L1–L2)', p=r3(cist), s=[0.008, 0.022, 0.008], c=LYMPH)
y_t4 = np.median(V('Fourth thoracic vertebra')[:, 1])
duct = [cist]
for y in np.linspace(cist[1] + 0.03, y_t4, 8):
    duct.append((at_y(dta, y) + at_y(az, y)) / 2 + np.array([0, 0, -0.006]))
duct += [at_y(dta, y_t4 + 0.05) + np.array([0.012, 0.0, -0.01]), np.array([l_angle[0] - 0.01, l_angle[1] + 0.035, l_angle[2] - 0.012]), l_angle + np.array([0, 0.006, 0])]
add('lymph_nodes_ducts', 'tubes', part='Thoracic duct', pts=[r3(p) for p in duct], r=0.0032, c=LYMPH)
add('lymph_nodes_ducts', 'tubes', part='Right lymphatic duct', pts=[r3(r_angle + np.array([0.012, 0.03, -0.01])), r3(r_angle + np.array([0.004, 0.006, 0]))], r=0.003, c=LYMPH)
def chain(part, pts, k, off, size=0.006):
    for p in resample(np.array(pts), k):
        add('lymph_nodes_ducts', 'ells', part=part, p=r3(p + off), s=[size, size * 1.3, size], c=LYMPH)
for Side, s in SIDES:
    ij = centerline(f'{Side} internal jugular vein', 8)
    chain(f'{Side} deep cervical nodes (jugular chain)', ij[1:-1], 5, np.array([s * 0.012, 0, 0.004]))
    br = centerline(f'{Side} brachial artery', 8)
    sub = centerline(f'{Side} subclavian artery', 6, start_near=np.array([0, 1.2, 0]))
    chain(f'{Side} axillary nodes', [sub[-1], br[0], br[1]], 5, np.array([-s * 0.012, -0.01, -0.006]), 0.007)
    fv = centerline(f'{Side} femoral vein', 10)
    chain(f'{Side} inguinal nodes', fv[:3], 4, np.array([s * 0.006, 0.01, 0.014]), 0.0065)
    cia = centerline(f'{Side} common iliac artery', 4); eia = centerline(f'{Side} external iliac artery', 6)
    chain(f'{Side} iliac nodes', np.r_[cia, eia[:4]], 4, np.array([s * 0.01, 0, 0.004]))
    chain(f'{Side} para-aortic (lumbar) nodes', ab[1:6], 4, np.array([s * 0.02, 0, 0.0]))
    mb = centerline(f'{Side} main bronchus' if Side == 'Left' else 'Right main bronchus proper', 5)
    chain(f'{Side} hilar (bronchopulmonary) nodes', mb[1:], 3, np.array([0, 0.012, 0.006]))

# --------------------------------------------------------------------------- sweat glands (clusters on the real skin at dense sites)
skin = V('Skin'); st = cKDTree(skin)
def cluster(part, target, n=14):
    idx = st.query(target, k=400)[1]
    sel = skin[idx[np.linspace(0, len(idx) - 1, n).astype(int)]]
    for p in sel:
        add('sweat_sebaceous', 'ells', part=part, p=r3(p), s=[0.0035, 0.0035, 0.0035], c=0xffb703)
for Side, s in SIDES:
    br0 = centerline(f'{Side} brachial artery', 8)[0]
    cluster(f'{Side} axilla – apocrine & eccrine glands', br0 + np.array([-s * 0.03, -0.02, 0]))
    cap = V(f'{Side} capitate').mean(0)
    cluster(f'{Side} palm – eccrine glands', cap + np.array([0, -0.03, 0.03]))
    cal = V(f'{Side} calcaneus'); mt = V(f'{Side} third metatarsal bone').mean(0)
    cluster(f'{Side} sole – eccrine glands', (cal.mean(0) + mt) / 2 + np.array([0, -0.05, 0]))
fr = V('Frontal bone'); cluster('Forehead – eccrine & sebaceous glands', fr[np.argmax(fr[:, 2])] + np.array([0, 0.02, 0.03]), 16)

# --------------------------------------------------------------------------- mammary glands (4th intercostal space, mid-clavicular line)
stb = V('Body of sternum'); y_nip = stb[:, 1].max() - 0.42 * np.ptp(stb[:, 1])
for Side, s in SIDES:
    cl = V(f'{Side} clavicle'); xmid = s * np.abs(cl[:, 0]).mean() * 1.05
    pm = np.concatenate([V(f'Sternocostal part of {Side.lower()} pectoralis major'), V(f'Abdominal part of {Side.lower()} pectoralis major')])
    near = pm[np.linalg.norm(pm[:, [0, 1]] - [xmid, y_nip], axis=1) < 0.03]
    surf = near[np.argmax(near[:, 2])]
    add('mammary_glands', 'ells', part=f'{Side} mammary gland', p=r3(surf + np.array([0, 0, 0.012])), s=[0.075, 0.07, 0.04], c=0xffccd5)
    add('mammary_glands', 'ells', part=f'{Side} nipple–areola complex', p=r3(surf + np.array([0, -0.004, 0.05])), s=[0.012, 0.012, 0.006], c=0xe5989b)

# --------------------------------------------------------------------------- female pelvic organs (real adult dimensions, between bladder & rectum)
bl = V('Urinary bladder'); rec = V('Rectum')
uc = np.array([0, bl[:, 1].max() + 0.035, (bl[:, 2].min() + rec[:, 2].max()) / 2 + 0.03])
add('uterus_vagina', 'ells', part='Uterus – body & fundus (anteverted)', p=r3(uc), s=r3(np.array([50, 75, 30]) * MM / 2), c=0xf72585, dir=[0, 0.85, 0.53])
cx = uc + np.array([0, -0.08, -0.05])
add('uterus_vagina', 'ells', part='Cervix', p=r3(cx), s=r3(np.array([25, 30, 25]) * MM / 2), c=0xff758f, dir=[0, 0.9, 0.44])
vag_end = np.array([0, bl[:, 1].min() - 0.07, rec[:, 2].max() + 0.01])
add('uterus_vagina', 'tubes', part='Vagina', pts=[r3(cx + np.array([0, -0.02, -0.01])), r3((cx + vag_end) / 2 + np.array([0, 0, 0.012])), r3(vag_end)], r=0.022, c=0xff758f, flat=0.45)
for Side, s in SIDES:
    iia = V(f'{Side} internal iliac artery'); bif = iia[np.argmax(iia[:, 1])]
    ov = bif + np.array([-s * 0.022, -0.075, -0.01])
    add('ovaries_tubes', 'ells', part=f'{Side} ovary', p=r3(ov), s=r3(np.array([30, 15, 12]) * MM / 2 * 1.2), c=0xf78fb3)
    corn = uc + np.array([s * 0.045, 0.06, 0.0])
    add('ovaries_tubes', 'tubes', part=f'{Side} uterine (fallopian) tube', pts=[r3(corn), r3((corn + ov) / 2 + np.array([0, 0.05, 0.01])), r3(ov + np.array([s * 0.02, 0.03, 0.0])), r3(ov + np.array([s * 0.012, -0.006, 0.012]))], r=0.0045, c=0xffb3c6)

# --------------------------------------------------------------------------- missing muscles built on real bone / fascia landmarks
# Rectus abdominis: strap either side of the real linea alba, pubis -> costal cartilages 5-7
la = V('Linea alba')
ys = np.linspace(la[:, 1].min() + 0.005, la[:, 1].max() - 0.01, 22)
for Side, s in SIDES:
    vs, fs = [], []
    for i, y in enumerate(ys):
        band = la[np.abs(la[:, 1] - y) < 0.012]; z0 = band[:, 2].max()
        t = (y - ys[0]) / (ys[-1] - ys[0])
        w = 0.03 + 0.045 * t                                  # narrow at pubis, wide at costal margin
        for j, u in enumerate(np.linspace(0, 1, 5)):
            x = s * (0.009 + u * w); z = z0 - 1.6 * (x ** 2) - 0.004
            vs += [[x, y, z], [x, y, z - 0.014]]
    n = 5
    for i in range(len(ys) - 1):
        for j in range(n - 1):
            a = (i * n + j) * 2; b = a + 2; c = a + n * 2; d = c + 2
            fs += [[a, c, b], [b, c, d], [a + 1, b + 1, c + 1], [b + 1, d + 1, c + 1]]
    for i in range(len(ys) - 1):  # side walls
        for j in (0, n - 1):
            a = (i * n + j) * 2; c = a + n * 2
            fs += [[a, a + 1, c], [c, a + 1, c + 1]]
    add('abs', 'meshes', part=f'{Side} rectus abdominis', v=[r3(p) for p in vs], f=fs, c=MUS)

# Latissimus dorsi: sheet from T7-L5 spinous processes + iliac crest to the humeral intertubercular groove
spin = []
for lvl in [f'{o.capitalize()} thoracic vertebra' for o in ORD[6:]] + [f'{o.capitalize()} lumbar vertebra' for o in ORD[:5]]:
    v = V(lvl); spin.append(v[np.argmin(v[:, 2])])
for Side, s in SIDES:
    hip = V(f'{Side} hip bone'); crest = hip[hip[:, 1] > hip[:, 1].max() - 0.02]
    crest_post = crest[crest[:, 2] < np.percentile(crest[:, 2], 30)]
    crest_pts = crest_post[np.argsort(s * crest_post[:, 0])][::max(1, len(crest_post) // 4)][:4]
    origins = np.array(spin + list(crest_pts))
    hum = V(f'{Side} humerus'); top = hum[:, 1].max()
    prox = hum[(hum[:, 1] < top - 0.04) & (hum[:, 1] > top - 0.08)]
    ins = prox[np.argmax(prox[:, 2] - s * prox[:, 0] * 0.5)] + np.array([0, 0, 0.004])
    ribs = np.concatenate([V(f'{Side} {o} rib') for o in ORD[5:11]])
    grid = []
    for O in origins:
        ym = O[1] * 0.45 + ins[1] * 0.55
        band = ribs[np.abs(ribs[:, 1] - ym) < 0.03]
        if not len(band): band = ribs
        k = np.argmax(s * band[:, 0] * 0.75 - band[:, 2] * 0.65)
        C = band[k] + np.array([s * 0.02, 0, -0.02])
        row = []
        for t in np.linspace(0, 1, 14):
            P = (1 - t) ** 2 * (O + np.array([s * 0.004, 0, -0.012])) + 2 * (1 - t) * t * C + t ** 2 * ins
            row.append(P)
        grid.append(row)
    grid = np.array(grid); R, Cn = grid.shape[:2]
    vs = grid.reshape(-1, 3); fs = []
    for i in range(R - 1):
        for j in range(Cn - 1):
            a = i * Cn + j; b = a + 1; c = a + Cn; d = c + 1
            fs += [[a, b, c], [b, d, c]]
    add('lats', 'meshes', part=f'{Side} latissimus dorsi', v=[r3(p) for p in vs], f=fs, c=MUS, double=True)

# Masseter: zygomatic arch -> lateral ramus & angle of mandible
mand = V('Mandible')
for Side, s in SIDES:
    lat = mand[s * mand[:, 0] > 0.035]
    post = lat[lat[:, 2] < lat[:, 2].min() + 0.035]
    angle = post[np.argmin(post[:, 1])]
    zy = V(f'{Side} zygomatic bone'); arch = zy[zy[:, 1] < np.percentile(zy[:, 1], 30)]
    arch_pt = arch[np.argmax(s * arch[:, 0])] + np.array([0, -0.004, -0.012])
    a = arch_pt + np.array([s * 0.004, 0, 0]); b = angle + np.array([s * 0.006, 0.012, 0.012])
    add('masseter', 'ells', part=f'{Side} masseter', p=r3((a + b) / 2), s=[0.009, float(np.linalg.norm(b - a) / 2 + 0.006), 0.022], c=MUS, dir=r3((a - b) / np.linalg.norm(a - b)))
    # Temporalis: fan over the temporal fossa (temporal squama + parietal), tendon to coronoid process
    skull = np.concatenate([V(f'{Side} temporal bone'), V(f'{Side} parietal bone'), V('Frontal bone'), V('Sphenoid bone')])
    zy_top = zy[:, 1].max()
    fossa = skull[(skull[:, 1] > zy_top - 0.01) & (skull[:, 1] < zy_top + 0.11) & (s * skull[:, 0] > 0)]
    fossa = fossa[(fossa[:, 2] > np.percentile(fossa[:, 2], 25)) & (fossa[:, 2] < np.percentile(fossa[:, 2], 85))]
    fossa = fossa[s * fossa[:, 0] > np.percentile(s * fossa[:, 0], 70)]
    fc = fossa.mean(0) + np.array([s * 0.006, 0, 0])
    add('temporalis', 'ells', part=f'{Side} temporalis (fan)', p=r3(fc), s=[0.007, 0.05, 0.055], c=MUS)
    ram = mand[(s * mand[:, 0] > 0.03)]
    topr = ram[ram[:, 1] > ram[:, 1].max() - 0.03]
    coronoid = topr[np.argmax(topr[:, 2])]
    add('temporalis', 'tubes', part=f'{Side} temporalis tendon → coronoid process', pts=[r3(fc + np.array([0, -0.03, 0.01])), r3((fc + coronoid) / 2 + np.array([s * 0.004, 0, 0])), r3(coronoid + np.array([0, 0.006, 0]))], r=0.008, c=MUS)
    # Orbicularis oculi around the orbit, centred on the real eyeball
    sc = V(f'{Side} sclera'); c = sc.mean(0)
    add('orb_oculi', 'rings', part=f'{Side} orbicularis oculi', p=r3([c[0], c[1], sc[:, 2].max() - 0.004]), r=0.03, tube=0.0065, sx=1.15, sy=0.85, c=MUS)
lip = V('Lip'); lc = lip.mean(0)
add('orb_oris', 'rings', part='Orbicularis oris', p=r3([0, lc[1], lip[:, 2].max() - 0.008]), r=float(np.ptp(lip[:, 0]) / 2 * 0.9), tube=0.007, sx=1.0, sy=0.55, c=MUS)

json.dump(out, open(os.path.join(OUT, 'placed.json'), 'w'), separators=(',', ':'))
for k, v in out.items():
    print(k, {kk: len(vv) for kk, vv in v.items()})
