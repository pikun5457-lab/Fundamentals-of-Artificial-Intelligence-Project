import os, sys, re, json
d = sys.argv[1]; out = sys.argv[2]
rows = []
for f in sorted(os.listdir(d)):
    if not f.endswith('.obj'): continue
    name = bounds = None; nv = nf = 0
    with open(os.path.join(d, f), encoding='utf-8', errors='replace') as fh:
        for line in fh:
            if line.startswith('# English name :'): name = line.split(':',1)[1].strip()
            elif line.startswith('# Bounds'): bounds = [float(x) for x in re.findall(r'-?\d+\.\d+', line)]
            elif line.startswith('v '): nv += 1
            elif line.startswith('f '): nf += 1
    rows.append(dict(file=f[:-4], name=name, b=bounds, nv=nv, nf=nf))
json.dump(rows, open(out, 'w'), indent=0)
print(len(rows), sum(r['nf'] for r in rows))
