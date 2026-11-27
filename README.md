# Human Anatomy Explorer — Medical Student Edition (All 12 Systems)

An interactive 3D human anatomy learning application covering **all 12 major body systems** (with the Reproductive System separated into Male and Female systems) and **112 anatomical structures**, complete with *Terminologia Anatomica* Latin names, muscle origins/insertions/actions/innervations, vascular/lymphatic pathways, histology notes, and USMLE/medical board clinical pearls.

## 3D Model

The model uses **real anatomical meshes from [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/)** (an FMA-based atlas of an adult male body). Hovering any surface names the exact part, e.g. *Left fifth rib* or *Right rectus femoris*. Every structure in the details panel is tagged with where its geometry comes from:

| Tag | Meaning | Structures |
|---|---|---|
| **Anatomical mesh** | BodyParts3D surface meshes (simplified to ~12% of original triangles) | 92 — all bones, 49 muscles, brain, heart, vessels, viscera, male reproductive organs |
| **Derived from anatomy data** | Generated from BodyParts3D geometry | 2 — spinal cord (traced through the real vertebral canal), nails (on the real distal phalanges) |
| **Schematic · placed on real landmarks** | No BodyParts3D mesh exists; a simplified shape is positioned on landmarks measured from the real meshes | 18 — peripheral nerves & plexuses, sympathetic trunk, lymph nodes & ducts, tonsils, thyroid/parathyroids, pancreatic islets, sweat glands, female reproductive organs & mammary glands, latissimus dorsi, rectus abdominis, internal oblique, masseter, temporalis, orbicularis oculi/oris |

The lungs combine real meshes (bronchial tree, pulmonary arteries and veins) with an **approximate** pleural envelope (a hull around the bronchial tree), because BodyParts3D has no lung surface. Female organs are shown at real adult dimensions inside the male pelvis, so their relationships to the pelvic walls are approximate.

## Included Body Systems (12)
1. **Integumentary System**: Epidermis/dermis/subcutis, scalp & hair follicles, eccrine/apocrine/sebaceous glands, nail plates & nail beds.
2. **Skeletal System**: Neurocranium, viscerocranium/mandible, hyoid bone, cervical (C1–C7), thoracic (T1–T12), lumbar (L1–L5) + intervertebral discs, sacrum & coccyx, sternum & ribs (1–12), clavicle & scapula, humerus, radius & ulna, carpals/metacarpals/phalanges, pelvic girdle, femur, patella, tibia & fibula, tarsals/metatarsals/phalanges.
3. **Muscular System**: 54 major head, neck, trunk, rotator cuff, upper limb, gluteal, thigh, and lower leg muscles with full Origin, Insertion, Action, Nerve, and Clinical notes.
4. **Nervous System**: Cerebral hemispheres, cerebellum & brainstem, diencephalon, cranial nerves, spinal cord & cauda equina, brachial plexus (median, ulnar, radial), lumbosacral plexus (femoral, sciatic, tibial, common fibular), and sympathetic trunk.
5. **Endocrine System**: Pituitary gland, thyroid & parathyroid glands, adrenal glands, and pancreatic Islets of Langerhans.
6. **Cardiovascular (Circulatory) System**: Heart (chambers, valves, coronary arteries), aorta & systemic arteries, and vena cavae / hepatic portal / deep & superficial veins.
7. **Lymphatic & Immune System**: Thymus, spleen, Waldeyer tonsillar ring, thoracic duct, cisterna chyli, right lymphatic duct, and regional lymph node chains.
8. **Respiratory System**: Nasal cartilages & pharynx, larynx, trachea & bronchi, and lungs.
9. **Digestive System**: Oral cavity, teeth, tongue & salivary glands, esophagus, stomach, liver & gallbladder, duodenum & pancreas, jejunum & ileum, and appendix/colon/rectum.
10. **Urinary (Excretory) System**: Kidneys, ureters, urinary bladder, and urethra.
11. **Male Reproductive System**: Testes, epididymis, deferent ducts, penis, prostate, and seminal vesicles.
12. **Female Reproductive System**: Ovaries, uterine (fallopian) tubes, uterus, cervix, vagina, and mammary glands.

## How to Run
- **Option 1 (Direct):** Double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari). An internet connection is needed for Three.js and Google Fonts; the anatomy meshes load from the local `models/` folder.
- **Option 2 (Local Server):**
  ```bash
  python -m http.server 8000
  ```
  Then open `http://localhost:8000` in your browser.

If the meshes cannot load, the app falls back to its built-in schematic model.

## Project Layout
- `index.html`, `style.css`, `app.js` — the application (Three.js r128).
- `anatomy_data.js` — system descriptions and muscle reference data.
- `models/*.js` — generated mesh data (base64 GLB per body system, plus `extras.js` for derived and placed geometry). Do not edit by hand.
- `tools/bp3d/` — the pipeline that builds `models/` from BodyParts3D. `mapping.py` decides which BodyParts3D parts make up each app structure; `landmarks.py` positions the schematic structures. Rebuild with `tools/bp3d/build.sh` (needs Python with numpy + scipy, and Node.js).

## Credits & License
3D anatomy meshes: **BodyParts3D**, © The Database Center for Life Science (DBCLS), licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). The files in `models/` are an adaptation (simplified, re-oriented, regrouped) of that work and are distributed under the same license.
