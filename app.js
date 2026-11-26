const V = THREE.Vector3;
const $ = s => document.querySelector(s);
const cv = $('#c'), main = $('main');

const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 50);
const HOME = new V(0, 0.05, 5.1);
cam.position.copy(HOME);

const ctl = new THREE.OrbitControls(cam, cv);
ctl.enableDamping = true;
ctl.target.set(0, 0, 0);
ctl.minDistance = 0.45;
ctl.maxDistance = 9.5;

scene.add(new THREE.HemisphereLight(0xe4eeff, 0x2c2018, 0.95));
const d1 = new THREE.DirectionalLight(0xffffff, 0.95);
d1.position.set(2.5, 3.5, 4);
scene.add(d1);
const d2 = new THREE.DirectionalLight(0x88b4ff, 0.45);
d2.position.set(-3, 1, -3.5);
scene.add(d2);

const mats = [];
function M(c, o = 1, rough = 0.52) {
  const m = new THREE.MeshStandardMaterial({
    color: c,
    roughness: rough,
    metalness: 0.05,
    transparent: true,
    opacity: o
  });
  m.userData.base = o;
  mats.push(m);
  return m;
}
function limb(g, a, b, r1, r2, m) {
  a = new V(...a);
  b = new V(...b);
  const d = b.clone().sub(a);
  const len = Math.max(0.001, d.length());
  const k = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 14), m);
  k.position.copy(a).add(b).multiplyScalar(0.5);
  k.quaternion.setFromUnitVectors(new V(0, 1, 0), d.normalize());
  g.add(k);
  return k;
}
function ell(g, p, s, m) {
  const k = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 16), m);
  k.position.set(...p);
  k.scale.set(...s);
  g.add(k);
  return k;
}
function tube(g, pts, r, m, closed = false) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new V(...p)), closed);
  const k = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 8), r, 8, closed), m);
  g.add(k);
  return k;
}
function ring(g, p, r, tr, rotX, rotY, rotZ, sx, sy, m) {
  const k = new THREE.Mesh(new THREE.TorusGeometry(r, tr, 8, 32), m);
  k.position.set(...p);
  k.rotation.set(rotX || 0, rotY || 0, rotZ || 0);
  k.scale.set(sx || 1, sy || 1, 1);
  g.add(k);
  return k;
}
const S = f => [-1, 1].forEach(f);

const sysRoot = {}, P = {};
for (const k in SYS) {
  sysRoot[k] = new THREE.Group();
  scene.add(sysRoot[k]);
}

function add(id, name, latin, sys, desc, medMeta, fn) {
  const g = new THREE.Group();
  g.userData.id = id;
  fn(g);
  sysRoot[sys].add(g);
  P[id] = { id, name, latin, sys, desc, med: medMeta || {}, g };
}

const BONE = 0xe8e2d0, CART = 0x9ecae1, MUS = 0xb8453a, RED = 0xd62839, BLUE = 0x3b6fd6, NERVE = 0xf5d547, LYMPH = 0x4cc9f0, ENDO = 0xe76f51;

/* ============================================================================
   1. INTEGUMENTARY SYSTEM
   ============================================================================ */
add('epidermis_dermis', 'Skin (Epidermis, Dermis & Subcutis)', 'Cutis / Integumentum commune', 'integumentary',
  'The largest organ of the body (~1.5–2 m²). Composed of stratified squamous keratinized epidermis (strata basale, spinosum, granulosum, lucidum, corneum), vascular papillary/reticular dermis, and insulating hypodermis.',
  { histology: 'Keratinocytes, melanocytes, Langerhans cells, Merkel cells; dense irregular collagen/elastin dermis', function: 'Physical/microbial barrier, thermoregulation, UV protection, vitamin D3 (cholecalciferol) synthesis', clinical: 'Rule of Nines estimates burn TBSA; basal cell carcinoma is most common, melanoma is most lethal.' },
  g => {
    const m = M(0xf4a261, 0.22, 0.85);
    const torso = limb(g, [0, 1.15, 0], [0, -0.15, 0], 0.43, 0.37, m);
    torso.scale.z = 0.67;
    ell(g, [0, 1.61, 0], [0.195, 0.235, 0.205], m);
    limb(g, [0, 1.36, 0], [0, 1.2, 0], 0.085, 0.105, m);
    S(s => {
      limb(g, [s * 0.45, 1.08, 0], [s * 0.52, 0.55, 0], 0.078, 0.062, m);
      limb(g, [s * 0.52, 0.55, 0], [s * 0.57, 0.08, 0.03], 0.062, 0.042, m);
      limb(g, [s * 0.17, -0.15, 0], [s * 0.18, -1.0, 0.02], 0.155, 0.095, m);
      limb(g, [s * 0.18, -1.0, 0.02], [s * 0.17, -1.72, 0], 0.082, 0.052, m);
    });
  });

add('scalp_hair', 'Scalp & Hair Follicles', 'Pili et folliculi pili', 'integumentary',
  'Keratinized filaments growing from dermal papillae within epidermal invaginations, accompanied by arrector pili smooth muscle (sympathetic alpha-1) and holocrine sebaceous glands.',
  { innervation: 'Trigeminal (CN V1–V3) anteriorly; greater/lesser occipital & C2–C3 posteriorly', function: 'Cranial thermal insulation, UV shielding, and tactile mechanoreception', clinical: 'Rich anastomotic scalp blood supply causes profuse bleeding in lacerations but rapid healing.' },
  g => {
    const m = M(0x5c3a21, 0.88, 0.75);
    ell(g, [0, 1.66, -0.02], [0.196, 0.195, 0.205], m);
  });

add('sweat_sebaceous', 'Sweat & Sebaceous Glands', 'Glandulae sudoriferae et sebaceae', 'integumentary',
  'Eccrine glands (cholinergic sympathetic) cover most skin for evaporative cooling; apocrine glands in axilla/groin open into hair follicles; sebaceous glands secrete lipid-rich sebum.',
  { innervation: 'Eccrine: postganglionic sympathetic fibers releasing acetylcholine (muscarinic M3)', function: 'Evaporative thermoregulation, antimicrobial acid mantle, and waterproofing', clinical: 'Cystic fibrosis is screened via elevated sweat chloride; acne vulgaris involves sebaceous hyperkeratinization.' },
  g => {
    const m = M(0xffb703, 0.9);
    S(s => {
      ell(g, [s * 0.34, 0.96, 0.02], [0.035, 0.05, 0.035], m);
      ell(g, [s * 0.13, -0.18, 0.12], [0.03, 0.04, 0.03], m);
    });
  });

add('nails', 'Nail Plates & Nail Beds', 'Ungues', 'integumentary',
  'Hard keratin plates resting on vascular nail beds over distal phalanges, growing proximally from the nail matrix (visible pale lunula).',
  { function: 'Protects dorsal distal phalanges, enhances fine pinch grip and tactile discrimination', clinical: 'Koilonychia (spoon nails) suggests iron deficiency; clubbing indicates chronic hypoxia or lung/GI disease.' },
  g => {
    const m = M(0xf7cad0, 0.95);
    S(s => {
      for (let j = 0; j < 4; j++) {
        ell(g, [s * (0.55 + j * 0.018), -0.14 - (j == 1 || j == 2 ? 0.03 : 0), 0.036], [0.007, 0.01, 0.004], m);
      }
      ell(g, [s * 0.17, -1.79, 0.18], [0.045, 0.01, 0.018], m);
    });
  });

/* ============================================================================
   2. SKELETAL SYSTEM (AXIAL + APPENDICULAR + JOINTS/CARTILAGE)
   ============================================================================ */
add('cranium', 'Neurocranium (Cranial Vault & Base)', 'Neurocranium', 'skeletal',
  '8 bones enclosing the brain: frontal, paired parietal, paired temporal, occipital, sphenoid, and ethmoid, united by fibrous sutures (coronal, sagittal, lambdoid).',
  { landmarks: 'Pterion (junction of frontal, parietal, temporal, sphenoid), foramen magnum, sella turcica', clinical: 'Epidural hematoma classically follows trauma to the pterion rupturing the middle meningeal artery.' },
  g => {
    ell(g, [0, 1.64, -0.01], [0.155, 0.16, 0.175], M(BONE, 0.72));
  });

add('viscerocranium', 'Viscerocranium (Facial Skeleton & Mandible)', 'Viscerocranium', 'skeletal',
  '14 facial bones including paired maxillae, zygomatic, nasal, lacrimal, palatine, inferior nasal conchae, vomer, and the movable mandible (forming the TMJ).',
  { landmarks: 'Supraorbital, infraorbital, and mental foramina (CN V1, V2, V3 exits); paranasal sinuses', clinical: 'Le Fort I, II, and III fractures describe horizontal, pyramidal, and craniofacial disjunction patterns.' },
  g => {
    const m = M(BONE, 0.92);
    ell(g, [0, 1.54, 0.11], [0.11, 0.075, 0.07], m);
    ell(g, [0, 1.44, 0.09], [0.09, 0.045, 0.08], m);
  });

add('hyoid', 'Hyoid Bone & Laryngeal Cartilages', 'Os hyoideum', 'skeletal',
  'U-shaped bone suspended in the anterior neck at C3 level by suprahyoid and infrahyoid muscles—the only bone in the body that does not articulate with any other bone.',
  { landmarks: 'Body, greater and lesser horns (cornua); superior to thyroid cartilage (C4–C5)', clinical: 'Fracture of the hyoid bone is a classic forensic finding in manual strangulation.' },
  g => {
    ring(g, [0, 1.33, 0.09], 0.042, 0.008, Math.PI / 2, 0, 0, 1, 1.1, M(BONE));
  });

add('cervical_spine', 'Cervical Vertebrae (C1–C7)', 'Vertebrae cervicales', 'skeletal',
  '7 vertebrae characterized by transverse foramina (transmitting vertebral arteries C1–C6) and bifid spinous processes. Includes Atlas (C1, ring-shaped) and Axis (C2, with dens/odontoid process).',
  { landmarks: 'C1–C2 atlantoaxial joint ("no" rotation); C7 vertebra prominens', clinical: 'Jefferson burst fracture (C1) and Hangman fracture (C2 pedicles) result from axial loading/hyperextension.' },
  g => {
    const m = M(BONE);
    for (let i = 0; i < 7; i++) {
      const y = 1.38 - i * 0.036;
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.025, 12), m);
      v.position.set(0, y, -0.09 - i * 0.008);
      g.add(v);
    }
  });

add('thoracic_spine', 'Thoracic Vertebrae (T1–T12)', 'Vertebrae thoracicae', 'skeletal',
  '12 heart-shaped vertebral bodies with costal facets for rib articulation and long, inferiorly slanting spinous processes creating a primary kyphotic curve.',
  { landmarks: 'Superior/inferior costal demifacets and transverse costal facets; T4 sternal angle plane', clinical: 'Excessive thoracic kyphosis ("dowager’s hump") occurs with osteoporotic wedge compression fractures.' },
  g => {
    const m = M(BONE);
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const y = 1.12 - i * 0.052;
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.036 + t * 0.01, 0.038 + t * 0.01, 0.038, 12), m);
      v.position.set(0, y, -0.15 - Math.sin(t * Math.PI) * 0.045);
      g.add(v);
    }
  });

add('lumbar_spine', 'Lumbar Vertebrae (L1–L5) & Intervertebral Discs', 'Vertebrae lumbales', 'skeletal',
  '5 massive kidney-shaped vertebral bodies bearing upper-body weight, separated by fibrocartilaginous intervertebral discs (annulus fibrosus + nucleus pulposus).',
  { landmarks: 'Supracristal line crosses L4 spinous process (landmark for lumbar puncture at L3/L4 or L4/L5)', clinical: 'Posterolateral disc herniation at L4–L5 or L5–S1 most commonly compresses the L5 or S1 nerve root.' },
  g => {
    const mb = M(BONE), md = M(CART);
    for (let i = 0; i < 5; i++) {
      const y = 0.45 - i * 0.072;
      const z = -0.16 + Math.sin((i / 4) * Math.PI) * 0.035;
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.048, 14), mb);
      v.position.set(0, y, z);
      g.add(v);
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.053, 0.016, 14), md);
      d.position.set(0, y - 0.032, z);
      g.add(d);
    }
  });

add('sacrum_coccyx', 'Sacrum & Coccyx', 'Os sacrum et os coccygis', 'skeletal',
  '5 fused sacral vertebrae (S1–S5) forming the posterior pelvic wall via sacroiliac joints, terminating in 3–5 fused coccygeal vertebrae.',
  { landmarks: 'Sacral promontory, anterior/posterior sacral foramina, sacral hiatus', clinical: 'Sacral hiatus serves as the entry point for caudal epidural anesthesia.' },
  g => {
    const m = M(BONE);
    const sac = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 12), m);
    sac.rotation.x = Math.PI + 0.25;
    sac.position.set(0, -0.05, -0.16);
    g.add(sac);
    ell(g, [0, -0.18, -0.13], [0.025, 0.035, 0.02], m);
  });

add('sternum_ribs', 'Sternum, Ribs (1–12) & Costal Cartilages', 'Cavea thoracis', 'skeletal',
  'Manubrium, body, and xiphoid process of sternum joined to 7 true ribs, 3 false ribs (8–10), and 2 floating ribs (11–12) via hyaline costal cartilages.',
  { landmarks: 'Sternal angle (Angle of Louis) at T4/T5 marks 2nd costal cartilage, aortic arch, and tracheal bifurcation', clinical: 'Neurovascular bundle (VAN: Vein, Artery, Nerve) runs in the costal groove along the inferior rib border.' },
  g => {
    const mb = M(BONE), mc = M(CART);
    for (let i = 0; i < 11; i++) {
      const t = i / 10, y = 1.12 - i * 0.068;
      const r = 0.16 + 0.15 * Math.sin(Math.min(1, t * 0.85 + 0.2) * Math.PI);
      ring(g, [0, y, -0.02], r, 0.011, Math.PI / 2, 0, 0, 1.15, 0.72, mb);
      if (i < 8) {
        S(s => limb(g, [s * r * 0.7, y, 0.14], [s * 0.035, y + (i > 4 ? 0.04 : 0), 0.24], 0.009, 0.009, mc));
      }
    }
    const man = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.025), mb);
    man.position.set(0, 1.07, 0.23);
    g.add(man);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.34, 0.022), mb);
    body.position.set(0, 0.83, 0.25);
    g.add(body);
    ell(g, [0, 0.62, 0.24], [0.022, 0.04, 0.012], mc);
  });

add('clavicle_scapula', 'Clavicle & Scapula (Pectoral Girdle)', 'Cingulum pectorale', 'skeletal',
  'S-shaped clavicle (first bone to ossify, intramembranous) articulates at sternoclavicular and acromioclavicular joints; triangular scapula features spine, acromion, coracoid process, and glenoid cavity.',
  { landmarks: 'Acromion, coracoid process, suprascapular notch ("army over navy": artery above, nerve below)', clinical: 'Middle-third clavicle fractures are most common; medial fragment elevates via SCM, lateral drops via arm weight.' },
  g => {
    const m = M(BONE);
    S(s => {
      limb(g, [s * 0.04, 1.15, 0.18], [s * 0.42, 1.14, 0.03], 0.015, 0.014, m);
      ell(g, [s * 0.24, 0.96, -0.2], [0.11, 0.14, 0.016], m);
      limb(g, [s * 0.14, 1.06, -0.21], [s * 0.43, 1.13, -0.02], 0.014, 0.016, m);
    });
  });

add('humerus', 'Humerus', 'Humerus', 'skeletal',
  'Arm bone featuring head, anatomical & surgical necks, greater & lesser tubercles, intertubercular sulcus, deltoid tuberosity, radial groove, and distal trochlea/capitulum.',
  { landmarks: 'Surgical neck (axillary nerve), radial groove (radial nerve), medial epicondyle (ulnar nerve)', clinical: 'Supracondylar humeral fractures in children risk brachial artery compression and Volkmann ischemic contracture.' },
  g => {
    const m = M(BONE);
    S(s => {
      ell(g, [s * 0.41, 1.09, 0], [0.042, 0.042, 0.042], m);
      limb(g, [s * 0.42, 1.08, 0], [s * 0.5, 0.58, 0], 0.028, 0.024, m);
      ell(g, [s * 0.5, 0.58, 0], [0.045, 0.024, 0.024], m);
    });
  });

add('radius_ulna', 'Radius & Ulna', 'Radius et Ulna', 'skeletal',
  'Ulna (medial, stabilizes elbow via olecranon & trochlear notch) and Radius (lateral, rotates around ulna during pronation/supination via annular ligament and interosseous membrane).',
  { landmarks: 'Olecranon, radial head, radial & ulnar styloid processes, Lister dorsal tubercle', clinical: 'Colles fracture ("dinner-fork" deformity) is a dorsally displaced distal radius fracture from FOOSH.' },
  g => {
    const m = M(BONE);
    S(s => {
      limb(g, [s * 0.52, 0.56, 0.01], [s * 0.57, 0.1, 0.04], 0.021, 0.026, m);
      limb(g, [s * 0.49, 0.58, -0.02], [s * 0.52, 0.1, 0.0], 0.024, 0.015, m);
    });
  });

add('hand_bones', 'Carpals, Metacarpals & Phalanges (27 Bones/Hand)', 'Ossa manus', 'skeletal',
  '8 carpals (Proximal: Scaphoid, Lunate, Triquetrum, Pisiform; Distal: Trapezium, Trapezoid, Capitate, Hamate), 5 metacarpals, and 14 phalanges.',
  { landmarks: 'Anatomical snuffbox floor (scaphoid & trapezium); carpal tunnel roof (flexor retinaculum)', clinical: 'Scaphoid fracture risks avascular necrosis of the proximal pole due to retrograde blood supply.' },
  g => {
    const m = M(BONE);
    S(s => {
      ell(g, [s * 0.55, 0.05, 0.02], [0.038, 0.032, 0.016], m);
      for (let j = 0; j < 5; j++) {
        const x0 = s * (0.52 + j * 0.015), x1 = s * (0.51 + j * 0.018);
        const len = j === 0 ? -0.07 : (j === 2 || j === 3 ? -0.14 : -0.12);
        limb(g, [x0, 0.02, 0.02], [x1, len, 0.03], 0.008, 0.006, m);
      }
    });
  });

add('pelvic_girdle', 'Pelvic Girdle (Ilium, Ischium & Pubis)', 'Os coxae / Cingulum pelvicum', 'skeletal',
  'Paired hip bones fused at the triradiate cartilage in the acetabulum, joined anteriorly at the fibrocartilaginous pubic symphysis and posteriorly with the sacrum.',
  { landmarks: 'Iliac crest, ASIS, AIIS, ischial spine, ischial tuberosity, obturator foramen', clinical: 'Ischial spine is the anatomical landmark for pudendal nerve block and fetal station (0 station).' },
  g => {
    const m = M(BONE);
    S(s => {
      ell(g, [s * 0.18, -0.06, -0.02], [0.13, 0.12, 0.07], m);
      ring(g, [s * 0.11, -0.19, 0.04], 0.045, 0.014, 0.3, s * 0.4, 0, 0.9, 1.1, m);
    });
    ell(g, [0, -0.21, 0.11], [0.04, 0.03, 0.02], M(CART));
  });

add('femur', 'Femur', 'Femur', 'skeletal',
  'Longest and strongest bone in the body: spherical head (with fovea capitis), neck (125° angle of inclination), greater & lesser trochanters, linea aspera, and medial/lateral condyles.',
  { landmarks: 'Intertrochanteric line/crest, adductor tubercle, intercondylar fossa', clinical: 'Intracapsular femoral neck fracture disrupts medial circumflex femoral artery, risking avascular necrosis.' },
  g => {
    const m = M(BONE);
    S(s => {
      ell(g, [s * 0.14, -0.19, 0.01], [0.042, 0.042, 0.042], m);
      limb(g, [s * 0.14, -0.19, 0.01], [s * 0.21, -0.23, 0], 0.024, 0.026, m);
      limb(g, [s * 0.21, -0.23, 0], [s * 0.17, -1.0, 0.02], 0.038, 0.034, m);
      ell(g, [s * 0.17, -1.0, 0.02], [0.055, 0.035, 0.045], m);
    });
  });

add('patella_knee', 'Patella & Knee Menisci / Cruciate Ligaments', 'Patella et Articulatio genus', 'skeletal',
  'Largest sesamoid bone embedded in the quadriceps tendon, articulating with the femoral trochlea alongside medial/lateral fibrocartilage menisci and ACL/PCL.',
  { landmarks: 'Tibial tuberosity, medial/lateral menisci, ACL (prevents anterior tibial translation), PCL', clinical: '"Unhappy triad" (O’Donoghue) from lateral blow: ACL, MCL, and medial meniscus tear.' },
  g => {
    const mb = M(BONE), mc = M(CART);
    S(s => {
      ell(g, [s * 0.17, -1.01, 0.075], [0.036, 0.042, 0.018], mb);
      ell(g, [s * 0.17, -1.04, 0.02], [0.052, 0.012, 0.045], mc);
    });
  });

add('tibia_fibula', 'Tibia & Fibula', 'Tibia et Fibula', 'skeletal',
  'Weight-bearing medial tibia (tibial plateau, anterior crest, medial malleolus) and lateral non-weight-bearing fibula (head, neck, lateral malleolus) united by a syndesmosis.',
  { landmarks: 'Gerdy tubercle, soleal line, medial & lateral malleoli forming the ankle mortise', clinical: 'Common fibular nerve wraps subcutaneously around the fibular neck and is easily injured by tight casts or trauma.' },
  g => {
    const m = M(BONE);
    S(s => {
      limb(g, [s * 0.17, -1.05, 0.02], [s * 0.17, -1.71, 0], 0.034, 0.025, m);
      limb(g, [s * 0.215, -1.07, -0.01], [s * 0.21, -1.72, -0.01], 0.013, 0.013, m);
    });
  });

add('foot_bones', 'Tarsals, Metatarsals & Phalanges (26 Bones/Foot)', 'Ossa pedis', 'skeletal',
  '7 tarsals (Talus, Calcaneus, Navicular, Cuboid, Medial/Intermediate/Lateral Cuneiforms), 5 metatarsals, and 14 phalanges arranged into medial/lateral longitudinal and transverse arches.',
  { landmarks: 'Sustentaculum tali, sinus tarsi, tuberosity of 5th metatarsal (fibularis brevis insertion)', clinical: 'Talus has no muscular attachments and is prone to AVN after neck fractures; Jones fracture occurs at 5th MT base.' },
  g => {
    const m = M(BONE);
    S(s => {
      ell(g, [s * 0.17, -1.76, -0.02], [0.036, 0.038, 0.055], m);
      ell(g, [s * 0.17, -1.75, 0.04], [0.036, 0.032, 0.045], m);
      for (let j = 0; j < 5; j++) {
        const x = s * (0.14 + j * 0.015);
        limb(g, [x, -1.78, 0.07], [x, -1.79, 0.17], 0.008, 0.006, m);
      }
    });
  });

/* ============================================================================
   3. MUSCULAR SYSTEM (POPULATED FROM MUSCLES_DATA)
   ============================================================================ */
MUSCLES_DATA.forEach(([id, name, latin, a, b, r1, r2, orig, ins, act, nerve, clin]) => {
  add(id, name, latin, 'muscular',
    `${act}. Smoothly coordinates joint biomechanics across the musculoskeletal frame.`,
    { origin: orig, insertion: ins, action: act, innervation: nerve, clinical: clin },
    g => {
      const col = new THREE.Color(MUS).offsetHSL(0, 0, ((id.length * 7) % 10 - 5) * 0.015);
      const m = M(col);
      if (id === 'diaph') {
        ell(g, [0, 0.46, 0], [0.29, 0.055, 0.19], M(0xa8453a, 0.85));
      } else if (id === 'orb_oculi' || id === 'orb_oris') {
        if (id === 'orb_oculi') {
          S(s => ring(g, [s * 0.065, 1.58, 0.155], 0.024, 0.007, 0, s * 0.2, 0, 1.2, 0.85, m));
        } else {
          ring(g, [0, 1.47, 0.165], 0.026, 0.008, 0, 0, 0, 1.3, 0.8, m);
        }
      } else {
        S(s => {
          const k = limb(g, [a[0] * s, a[1], a[2]], [b[0] * s, b[1], b[2]], r1, r2, m);
          k.scale.z = 0.82;
        });
      }
    });
});

/* ============================================================================
   4. NERVOUS SYSTEM (CNS + CRANIAL + PLEXUSES + PERIPHERAL)
   ============================================================================ */
add('cerebrum', 'Cerebral Hemispheres (Frontal, Parietal, Temporal, Occipital Lobes)', 'Cerebrum / Telencephalon', 'nervous',
  'Paired hemispheres separated by the longitudinal fissure and linked by the corpus callosum. Houses primary motor (precentral), somatosensory (postcentral), visual, auditory, and language (Broca/Wernicke) cortices.',
  { blood_supply: 'Anterior, Middle, and Posterior Cerebral Arteries (ACA, MCA, PCA)', function: 'Executive cognition, voluntary motor control, conscious sensation, memory, and language', clinical: 'MCA stroke causes contralateral face/arm hemiplegia and aphasia (dominant hemisphere).' },
  g => {
    const m = M(0xe8b4c4, 0.92);
    S(s => ell(g, [s * 0.065, 1.65, 0.01], [0.065, 0.105, 0.14], m));
  });

add('cerebellum_brainstem', 'Cerebellum & Brainstem (Midbrain, Pons, Medulla)', 'Cerebellum et Truncus encephali', 'nervous',
  'The cerebellum coordinates ipsilateral balance, posture, and motor learning; the brainstem houses cranial nerve nuclei (CN III–XII), ascending/descending tracts, and cardiorespiratory centers.',
  { blood_supply: 'Vertebrobasilar system (SCA, AICA, PICA, basilar & vertebral arteries)', function: 'Motor coordination, vestibular equilibrium, consciousness (ARAS), breathing, and heart rate', clinical: 'Lateral medullary (Wallenberg) syndrome from PICA occlusion causes dysphagia, hoarseness, and crossed pain/temp loss.' },
  g => {
    const mc = M(0xd698aa), mb = M(0xf5d547);
    S(s => ell(g, [s * 0.055, 1.54, -0.08], [0.05, 0.042, 0.048], mc));
    limb(g, [0, 1.57, -0.02], [0, 1.44, -0.06], 0.026, 0.018, mb);
  });

add('diencephalon', 'Diencephalon (Thalamus, Hypothalamus & Pineal Gland)', 'Diencephalon', 'nervous',
  'Central relay hub surrounding the 3rd ventricle: thalamus gates sensory/motor info to cortex; hypothalamus governs autonomic, endocrine (pituitary), circadian, and homeostatic drives.',
  { landmarks: 'VPL/VPM sensory nuclei, LGN (vision), MGN (hearing), optic chiasm, mammillary bodies', function: 'Sensory relay, thermoregulation, hunger/thirst, circadian rhythm (melatonin), and neuroendocrine control', clinical: 'Wernicke-Korsakoff encephalopathy (thiamine B1 deficiency) damages mammillary bodies and dorsomedial thalamus.' },
  g => {
    ell(g, [0, 1.61, -0.01], [0.036, 0.03, 0.038], M(0xffb703));
  });

add('cranial_nerves', 'Cranial Nerves (CN I–XII) & Vagus Nerve (CN X)', 'Nervi craniales / Nervus vagus', 'nervous',
  '12 pairs of nerves emerging from the forebrain and brainstem. Notably, CN X (Vagus) descends through the carotid sheath to provide parasympathetic innervation to thoracic and foregut/midgut viscera.',
  { innervation: 'CN I–II (forebrain), CN III–IV (midbrain), CN V–VIII (pons), CN IX–XII (medulla)', function: 'Special senses, ocular motility, facial sensation/expression, mastication, swallowing, and visceral parasympathetic tone', clinical: 'Recurrent laryngeal branch of CN X loops under aortic arch (left) and right subclavian artery (right).' },
  g => {
    const m = M(NERVE);
    S(s => {
      tube(g, [[s * 0.02, 1.52, -0.02], [s * 0.05, 1.35, 0.04], [s * 0.04, 1.0, 0.03], [s * 0.03, 0.65, 0.01], [s * 0.02, 0.42, 0.03]], 0.007, m);
    });
  });

add('spinal_cord', 'Spinal Cord & Cauda Equina (31 Segments)', 'Medulla spinalis', 'nervous',
  'Extends from foramen magnum to the conus medullaris at L1–L2 in adults, continuing as lumbar/sacral nerve roots (cauda equina) inside the lumbar cistern to S2.',
  { landmarks: 'Cervical (C5–T1) & lumbosacral (L1–S3) enlargements; dorsal sensory & ventral motor roots', function: 'Bidirectional conduction (corticospinal, dorsal columns, spinothalamic) and segmental spinal reflexes', clinical: 'Cauda equina syndrome (saddle anesthesia, bowel/bladder retention) is a neurosurgical emergency.' },
  g => {
    const m = M(NERVE);
    tube(g, [[0, 1.44, -0.07], [0, 1.25, -0.13], [0, 0.7, -0.18], [0, 0.25, -0.16]], 0.018, m);
    S(s => {
      tube(g, [[0, 0.25, -0.16], [s * 0.02, 0.05, -0.16], [s * 0.03, -0.14, -0.15]], 0.007, m);
    });
  });

add('brachial_plexus', 'Brachial Plexus & Upper Limb Nerves (Median, Ulnar, Radial)', 'Plexus brachialis (C5–T1)', 'nervous',
  'Formed by ventral rami C5–T1 ("Randy Travis Drinks Cold Beer": Roots, Trunks, Divisions, Cords, Branches), giving rise to Musculocutaneous, Axillary, Radial, Median, and Ulnar nerves.',
  { innervation: 'All motor and sensory supply to the upper extremity', clinical: 'Upper trunk (C5–C6) injury = Erb-Duchenne palsy ("waiter’s tip"); lower trunk (C8–T1) = Klumpke palsy (claw hand).' },
  g => {
    const m = M(NERVE);
    S(s => {
      tube(g, [[s * 0.04, 1.28, -0.09], [s * 0.24, 1.12, 0.02], [s * 0.42, 0.96, 0.0]], 0.011, m);
      // Median
      tube(g, [[s * 0.42, 0.96, 0.0], [s * 0.48, 0.58, 0.03], [s * 0.54, 0.1, 0.035], [s * 0.56, -0.05, 0.035]], 0.007, m);
      // Ulnar
      tube(g, [[s * 0.42, 0.96, 0.0], [s * 0.46, 0.58, -0.03], [s * 0.51, 0.1, -0.01], [s * 0.52, -0.06, 0.01]], 0.007, m);
      // Radial
      tube(g, [[s * 0.42, 0.96, 0.0], [s * 0.5, 0.75, -0.04], [s * 0.54, 0.56, -0.02], [s * 0.57, 0.12, -0.01]], 0.007, m);
    });
  });

add('lumbosacral_plexus', 'Lumbosacral Plexus, Femoral & Sciatic Nerves', 'Plexus lumbosacralis (L1–S4)', 'nervous',
  'Lumbar plexus (L1–L4) yields the Femoral (anterior thigh) and Obturator (medial thigh) nerves; Sacral plexus (L4–S4) forms the Sciatic nerve—the largest nerve in the body—dividing into Tibial and Common Fibular nerves.',
  { innervation: 'Pelvic girdle, perineum (pudendal nerve S2–S4), and entire lower extremity', clinical: 'Sciatic nerve exits below piriformis; tibial nerve supplies posterior compartment/plantar foot; common fibular supplies anterior/lateral leg.' },
  g => {
    const m = M(NERVE);
    S(s => {
      // Femoral nerve
      tube(g, [[s * 0.07, 0.22, -0.12], [s * 0.16, -0.15, 0.08], [s * 0.17, -0.65, 0.08]], 0.008, m);
      // Sciatic -> Tibial & Common Fibular
      tube(g, [[s * 0.06, -0.08, -0.14], [s * 0.17, -0.25, -0.09], [s * 0.18, -0.95, -0.05]], 0.012, m);
      tube(g, [[s * 0.18, -0.95, -0.05], [s * 0.17, -1.72, -0.03]], 0.008, m);
      tube(g, [[s * 0.18, -0.95, -0.05], [s * 0.22, -1.08, -0.01], [s * 0.2, -1.72, 0.02]], 0.007, m);
    });
  });

add('sympathetic_chain', 'Autonomic Sympathetic Trunk (Paravertebral Ganglia)', 'Truncus sympathicus', 'nervous',
  'Paired chains of paravertebral ganglia running alongside the vertebral column from the skull base to the coccyx (ganglion impar), carrying thoracolumbar (T1–L2) sympathetic outflow.',
  { function: 'Fight-or-flight response: cardioacceleration, bronchodilation, mydriasis, vasoconstriction, decreased GI motility', clinical: 'Superior cervical ganglion lesion causes Horner syndrome (ptosis, miosis, anhidrosis).' },
  g => {
    const m = M(0xff9f1c);
    S(s => {
      tube(g, [[s * 0.045, 1.38, -0.08], [s * 0.055, 0.9, -0.14], [s * 0.055, 0.35, -0.14], [s * 0.03, -0.12, -0.14]], 0.006, m);
      for (let i = 0; i < 10; i++) {
        ell(g, [s * 0.052, 1.3 - i * 0.14, -0.135], [0.011, 0.014, 0.011], m);
      }
    });
  });

/* ============================================================================
   5. ENDOCRINE SYSTEM
   ============================================================================ */
add('pituitary_hypothal', 'Pituitary Gland (Adenohypophysis & Neurohypophysis)', 'Hypophysis', 'endocrine',
  'Master endocrine gland seated in the sella turcica of the sphenoid bone beneath the optic chiasm. Anterior lobe secretes FLAT PiG hormones (FSH, LH, ACTH, TSH, Prolactin, GH); posterior lobe releases ADH & Oxytocin.',
  { blood_supply: 'Superior & inferior hypophyseal arteries; hypothalamo-hypophyseal portal system', clinical: 'Pituitary adenoma mass effect compresses the optic chiasm, classically causing bitemporal hemianopsia.' },
  g => {
    ell(g, [0, 1.56, 0.03], [0.018, 0.014, 0.02], M(ENDO));
  });

add('thyroid_parathyroid', 'Thyroid & Parathyroid Glands', 'Glandula thyroidea et parathyroideae', 'endocrine',
  'Butterfly-shaped thyroid gland (right/left lobes + isthmus) anterior to trachea C5–T1 secretes T3, T4, and calcitonin; 4 posterior parathyroid glands secrete PTH to raise serum calcium.',
  { blood_supply: 'Superior thyroid artery (from ECA) & inferior thyroid artery (from thyrocervical trunk)', clinical: 'During thyroidectomy, preserve recurrent laryngeal nerves and parathyroid glands to avoid hoarseness and hypocalcemic tetany.' },
  g => {
    const mt = M(0xe76f51), mp = M(0xffd166);
    S(s => {
      ell(g, [s * 0.036, 1.25, 0.065], [0.022, 0.045, 0.022], mt);
      ell(g, [s * 0.042, 1.27, 0.045], [0.007, 0.007, 0.007], mp);
      ell(g, [s * 0.042, 1.22, 0.045], [0.007, 0.007, 0.007], mp);
    });
    ell(g, [0, 1.24, 0.075], [0.025, 0.014, 0.01], mt);
  });

add('adrenals', 'Adrenal (Suprarenal) Glands', 'Glandulae suprarenales', 'endocrine',
  'Retroperitoneal glands atop each kidney. Cortex (mesoderm) has 3 zones: Glomerulosa (aldosterone), Fasciculata (cortisol), Reticularis (androgens); Medulla (neural crest) secretes epinephrine & norepinephrine.',
  { blood_supply: 'Superior, middle, and inferior suprarenal arteries; right adrenal vein drains into IVC, left into left renal vein', clinical: 'Addison disease = primary adrenal insufficiency; Cushing syndrome = hypercortisolism; Pheochromocytoma = catecholamine-secreting medullary tumor.' },
  g => {
    const m = M(0xf4a261);
    S(s => {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.038, 12), m);
      cap.position.set(s * 0.13, 0.34, -0.09);
      g.add(cap);
    });
  });

add('pancreatic_islets', 'Endocrine Pancreas (Islets of Langerhans)', 'Insulae pancreaticae', 'endocrine',
  '1–2 million endocrine micro-organs scattered predominantly in the pancreatic tail: Alpha cells (glucagon), Beta cells (insulin & amylin), Delta cells (somatostatin), and PP cells.',
  { function: 'Maintains blood glucose homeostasis (insulin lowers glucose; glucagon raises glucose via glycogenolysis/gluconeogenesis)', clinical: 'Autoimmune destruction of beta cells causes Type 1 Diabetes Mellitus.' },
  g => {
    const m = M(0xffb703);
    for (let i = 0; i < 6; i++) {
      ell(g, [-0.03 + i * 0.035, 0.42 + i * 0.006, 0.02], [0.01, 0.01, 0.01], m);
    }
  });

/* ============================================================================
   6. CARDIOVASCULAR (CIRCULATORY) SYSTEM
   ============================================================================ */
add('heart_chambers', 'Heart (4 Chambers, Valves & Coronary Arteries)', 'Cor', 'circulatory',
  'Located in the middle mediastinum: Right Atrium (receives SVC/IVC/coronary sinus), Right Ventricle (pumps to pulmonary trunk via pulmonary valve), Left Atrium (4 pulmonary veins), and thick Left Ventricle (pumps to aorta via aortic valve).',
  { landmarks: 'Apex at 5th left intercostal space midclavicular line; Tricuspid, Pulmonary, Mitral, Aortic valves', blood_supply: 'Left Coronary Artery (LAD + LCx) & Right Coronary Artery (RCA -> PDA in 85% right-dominant hearts)', clinical: 'LAD ("widow-maker") occlusion causes anterior wall MI; pericardial tamponade presents with Beck triad.' },
  g => {
    const m = M(0xc42035);
    const body = ell(g, [0.055, 0.74, 0.075], [0.092, 0.115, 0.085], m);
    body.rotation.z = 0.35;
    // Right atrium & auricle
    ell(g, [-0.01, 0.78, 0.07], [0.048, 0.06, 0.05], M(0x9e1b32));
    // Pulmonary trunk
    tube(g, [[0.03, 0.81, 0.09], [0.02, 0.92, 0.05], [-0.08, 0.91, 0.01]], 0.02, M(BLUE));
    tube(g, [[0.02, 0.92, 0.05], [0.1, 0.91, 0.01]], 0.018, M(BLUE));
    // Coronary arteries (LAD & RCA)
    tube(g, [[0.05, 0.84, 0.11], [0.08, 0.73, 0.145], [0.11, 0.64, 0.13]], 0.005, M(0xff4d6d));
    tube(g, [[0.03, 0.84, 0.11], [-0.03, 0.75, 0.11], [0.0, 0.66, 0.07]], 0.005, M(0xff4d6d));
  });

add('aorta_arteries', 'Aorta & Major Systemic Arteries (Carotid, Subclavian, Iliac, Femoral)', 'Aorta et Arteriae systemicae', 'circulatory',
  'Ascending aorta -> Aortic arch (brachiocephalic trunk, left common carotid, left subclavian) -> Thoracic & Abdominal aorta (celiac, SMA, renal, IMA) -> Common, Internal & External Iliac -> Femoral, Popliteal, Tibial.',
  { landmarks: 'Bifurcation of common carotid at C4 (carotid sinus/body); abdominal aortic bifurcation at L4', clinical: 'Abdominal aortic aneurysms (AAA) most commonly occur infrarenally between renal arteries and L4 bifurcation.' },
  g => {
    const m = M(RED);
    // Ascending, arch, thoracic, abdominal aorta
    tube(g, [[0.045, 0.82, 0.07], [0.04, 0.97, 0.04], [0.01, 0.99, -0.04], [0.01, 0.75, -0.09], [0.01, 0.25, -0.09], [0.0, -0.06, -0.07]], 0.023, m);
    // Visceral branches (Celiac, SMA, Renal, IMA)
    tube(g, [[0.01, 0.52, -0.09], [0.01, 0.51, 0.0]], 0.011, m);
    tube(g, [[0.01, 0.44, -0.09], [0.02, 0.32, 0.03]], 0.011, m);
    S(s => {
      // Renal arteries
      tube(g, [[0.01, 0.34, -0.09], [s * 0.12, 0.3, -0.09]], 0.009, m);
      // Carotids & Subclavian -> Axillary -> Brachial -> Radial/Ulnar
      tube(g, [[s * 0.03, 0.98, 0.03], [s * 0.055, 1.48, 0.04]], 0.011, m);
      tube(g, [[s * 0.03, 0.98, 0.02], [s * 0.28, 1.1, 0.02], [s * 0.45, 0.95, 0.02], [s * 0.5, 0.58, 0.03]], 0.011, m);
      tube(g, [[s * 0.5, 0.58, 0.03], [s * 0.55, 0.1, 0.04]], 0.007, m);
      tube(g, [[s * 0.5, 0.58, 0.03], [s * 0.51, 0.1, 0.01]], 0.007, m);
      // Iliac -> Femoral -> Popliteal -> Anterior/Posterior Tibial
      tube(g, [[0.0, -0.06, -0.07], [s * 0.13, -0.22, 0.03], [s * 0.16, -0.65, 0.04], [s * 0.17, -1.02, -0.03], [s * 0.17, -1.72, -0.01]], 0.013, m);
    });
  });

add('vena_cava_veins', 'Superior/Inferior Vena Cava, Portal & Deep/Superficial Veins', 'Venae cavae et Systema venosum', 'circulatory',
  'SVC (formed by right/left brachiocephalic veins) and IVC (formed at L5 by common iliac veins) return systemic blood to the right atrium; Hepatic portal vein (SMV + splenic vein) carries nutrient-rich GI blood to the liver.',
  { landmarks: 'Internal jugular vein (lateral to carotid in carotid sheath), great saphenous vein (anterior to medial malleolus)', clinical: 'Deep vein thrombosis (DVT) in femoral/popliteal veins is the primary source of pulmonary embolism (PE).' },
  g => {
    const m = M(BLUE);
    // SVC & IVC
    tube(g, [[-0.035, 1.02, 0.05], [-0.03, 0.82, 0.06]], 0.02, m);
    tube(g, [[-0.03, 0.7, 0.04], [-0.035, 0.3, -0.07], [-0.04, -0.1, -0.06]], 0.023, m);
    // Hepatic portal vein
    tube(g, [[0.03, 0.25, 0.03], [-0.04, 0.45, 0.03], [-0.12, 0.5, 0.04]], 0.012, M(0x5e60ce));
    S(s => {
      // Internal jugular & Subclavian
      tube(g, [[s * 0.07, 1.48, 0.03], [s * 0.05, 1.05, 0.04], [-0.035, 1.02, 0.05]], 0.011, m);
      tube(g, [[s * 0.48, 0.58, 0.04], [s * 0.35, 1.05, 0.03], [s * 0.05, 1.05, 0.04]], 0.01, m);
      // Iliac -> Femoral & Great Saphenous
      tube(g, [[-0.04, -0.1, -0.06], [s * 0.14, -0.24, 0.02], [s * 0.18, -1.0, -0.02], [s * 0.18, -1.7, -0.01]], 0.013, m);
      tube(g, [[s * 0.13, -0.24, 0.06], [s * 0.12, -1.0, 0.03], [s * 0.14, -1.72, 0.03]], 0.007, M(0x4ea8de));
    });
  });

/* ============================================================================
   7. LYMPHATIC & IMMUNE SYSTEM
   ============================================================================ */
add('thymus', 'Thymus Gland', 'Thymus', 'lymphatic',
  'Bilobed primary lymphoid organ in the superior/anterior mediastinum where bone-marrow-derived thymocytes undergo positive and negative selection to become immunocompetent T lymphocytes.',
  { histology: 'Cortex (immature T cells), Medulla (Hassall corpuscles); involutes into fibrofatty tissue after puberty', clinical: 'DiGeorge syndrome (22q11.2 deletion) causes thymic aplasia and T-cell deficiency; thymoma is associated with myasthenia gravis.' },
  g => {
    const m = M(LYMPH, 0.88);
    S(s => ell(g, [s * 0.026, 0.99, 0.15], [0.024, 0.055, 0.02], m));
  });

add('spleen', 'Spleen', 'Lien / Splen', 'lymphatic',
  'Largest secondary lymphoid organ, intraperitoneal in the left upper quadrant (ribs 9–11). Red pulp filters senescent RBCs and stores platelets; white pulp (PALS & lymphoid follicles) mounts adaptive immune responses to encapsulated bacteria.',
  { landmarks: 'Gastrosplenic and splenorenal ligaments; diaphragmatic and visceral (gastric, renal, colic) impressions', clinical: 'Most frequently injured organ in blunt abdominal trauma (Kehr sign = referred left shoulder pain via phrenic nerve).' },
  g => {
    const spl = ell(g, [0.24, 0.48, -0.05], [0.05, 0.085, 0.065], M(0x7209b7, 0.9));
    spl.rotation.z = -0.35;
  });

add('tonsils_malt', 'Waldeyer Tonsillar Ring & Peyer Patches (MALT)', 'Anulus lymphoideus pharyngis', 'lymphatic',
  'Mucosa-associated lymphoid tissue guarding mucosal portals: pharyngeal (adenoid), tubal, palatine, and lingual tonsils in the pharynx, plus ileal Peyer patches and vermiform appendix.',
  { histology: 'Non-encapsulated lymphoid follicles with specialized M (microfold) cells sampling luminal antigens', clinical: 'Palatine tonsils lie between palatoglossal and palatopharyngeal arches; peritonsillar abscess ("quinsy") deviates the uvula.' },
  g => {
    const m = M(LYMPH);
    S(s => ell(g, [s * 0.032, 1.44, 0.05], [0.014, 0.018, 0.014], m));
    ell(g, [0, 1.49, 0.03], [0.018, 0.014, 0.014], m);
  });

add('lymph_nodes_ducts', 'Thoracic Duct, Right Lymphatic Duct & Regional Lymph Nodes', 'Ductus thoracicus et Nodi lymphatici', 'lymphatic',
  'Thoracic duct originates at the cisterna chyli (L1–L2), ascends through the aortic hiatus (T12), and drains ~75% of body lymph (all below diaphragm + left upper body) into the left venous angle; right lymphatic duct drains the right upper quadrant.',
  { landmarks: 'Cervical, axillary (pectoral, central, apical), mediastinal, para-aortic, and inguinal lymph node chains', clinical: 'Enlarged left supraclavicular node (Virchow node / Troisier sign) heralds gastric or abdominal malignancy.' },
  g => {
    const m = M(LYMPH, 0.85);
    // Cisterna chyli & Thoracic duct
    ell(g, [0.015, 0.35, -0.11], [0.016, 0.035, 0.016], m);
    tube(g, [[0.015, 0.35, -0.11], [0.01, 0.85, -0.1], [0.04, 1.07, 0.02]], 0.007, m);
    // Right lymphatic duct
    tube(g, [[-0.06, 1.12, 0.03], [-0.04, 1.06, 0.04]], 0.006, m);
    S(s => {
      // Cervical, axillary, inguinal node clusters
      for (let i = 0; i < 3; i++) {
        ell(g, [s * 0.075, 1.38 - i * 0.06, 0.02], [0.011, 0.014, 0.011], m);
        ell(g, [s * (0.31 + i * 0.02), 0.96 + i * 0.03, 0.02], [0.013, 0.013, 0.013], m);
        ell(g, [s * (0.12 + i * 0.02), -0.18, 0.09], [0.013, 0.011, 0.011], m);
      }
    });
  });

/* ============================================================================
   8. RESPIRATORY SYSTEM
   ============================================================================ */
add('nasal_pharynx', 'Nasal Cavity, Paranasal Sinuses & Pharynx', 'Cavitas nasi et Pharynx', 'respiratory',
  'Superior, middle, and inferior nasal conchae warm, humidify, and filter inspired air; connected to frontal, ethmoid, sphenoid, and maxillary sinuses and naso-/oro-/laryngopharynx.',
  { landmarks: 'Kiesselbach plexus (Little area) on anterior nasal septum; Eustachian tube opening in nasopharynx', clinical: 'Kiesselbach plexus is the most common site of anterior epistaxis (nosebleeds).' },
  g => {
    const m = M(0xf4acb7, 0.85);
    ell(g, [0, 1.54, 0.13], [0.026, 0.038, 0.038], m);
    tube(g, [[0, 1.52, 0.06], [0, 1.37, 0.03]], 0.024, m);
  });

add('larynx', 'Larynx (Thyroid, Cricoid, Epiglottis & Vocal Folds)', 'Larynx', 'respiratory',
  'Cartilaginous voice box (C3–C6) guarding the lower airway during swallowing via the epiglottis and generating phonation through true vocal folds controlled by intrinsic laryngeal muscles.',
  { innervation: 'All intrinsic muscles innervated by recurrent laryngeal nerve EXCEPT cricothyroid (external branch of superior laryngeal nerve)', clinical: 'Cricoid cartilage (C6) is the only complete cartilaginous ring in the airway; cricothyrotomy pierces the median cricothyroid ligament.' },
  g => {
    const m = M(0x9ecae1, 0.92);
    ell(g, [0, 1.29, 0.08], [0.034, 0.034, 0.032], m);
    ring(g, [0, 1.24, 0.075], 0.026, 0.008, Math.PI / 2, 0, 0, 1, 1, m);
  });

add('trachea_bronchi', 'Trachea, Carina & Bronchial Tree', 'Trachea et Bronchi', 'respiratory',
  '16–20 C-shaped hyaline cartilage rings bridged posteriorly by trachealis smooth muscle, bifurcating at the carina (T4/T5) into right (wider, shorter, more vertical) and left main bronchi -> lobar -> segmental bronchi.',
  { histology: 'Pseudostratified ciliated columnar epithelium with goblet cells (mucociliary escalator)', clinical: 'Aspirated foreign bodies preferentially lodge in the right main bronchus due to its steeper vertical angle.' },
  g => {
    const m = M(0xe9d3da);
    tube(g, [[0, 1.22, 0.06], [0, 0.96, 0.02]], 0.022, m);
    // Right main bronchus (steeper) & Left main bronchus
    tube(g, [[0, 0.96, 0.02], [-0.11, 0.86, 0.01], [-0.18, 0.76, 0.0]], 0.015, m);
    tube(g, [[0, 0.96, 0.02], [0.12, 0.89, 0.01], [0.19, 0.78, 0.0]], 0.013, m);
  });

add('lungs_pleura', 'Lungs (Right 3 Lobes, Left 2 Lobes + Lingula) & Pleura', 'Pulmones et Pleura', 'respiratory',
  'Right lung has superior, middle, and inferior lobes (horizontal & oblique fissures); Left lung has superior and inferior lobes (oblique fissure), cardiac notch, and lingula. Surrounded by visceral and parietal pleurae.',
  { histology: '~300 million alveoli lined by Type I pneumocytes (gas diffusion) and Type II pneumocytes (surfactant synthesis)', clinical: 'Thoracentesis is performed above the 9th rib in the midaxillary line (costodiaphragmatic recess) to avoid neurovascular bundle & lung.' },
  g => {
    const m = M(0xf2a6b8, 0.78);
    // Right lung (3 lobes representation)
    ell(g, [-0.165, 0.8, -0.01], [0.125, 0.25, 0.135], m);
    // Left lung (2 lobes + cardiac notch)
    ell(g, [0.175, 0.81, -0.015], [0.115, 0.245, 0.13], m);
    // Oblique fissures
    ring(g, [-0.165, 0.79, -0.01], 0.12, 0.004, 1.2, 0.4, 0, 1, 1.1, M(0xd66885));
    ring(g, [0.175, 0.79, -0.015], 0.11, 0.004, 1.2, -0.4, 0, 1, 1.1, M(0xd66885));
  });

/* ============================================================================
   9. DIGESTIVE SYSTEM
   ============================================================================ */
add('salivary_oral', 'Oral Cavity, Tongue & Salivary Glands (Parotid, Submandibular, Sublingual)', 'Cavitas oris et Glandulae salivariae', 'digestive',
  'Mechanical mastication and enzymatic initiation via salivary alpha-amylase and lingual lipase. Parotid gland (CN IX, Stensen duct opposite 2nd upper molar), Submandibular (CN VII, Wharton duct), and Sublingual.',
  { innervation: 'Tongue motor: CN XII (except palatoglossus, CN X); Anterior 2/3 taste: CN VII, general: CN V3; Posterior 1/3: CN IX', clinical: 'Facial nerve (CN VII) courses through the parotid gland (without innervating it) and can be injured by parotid tumors/surgery.' },
  g => {
    const mt = M(0xe07a5f), ms = M(0xf2cc8f);
    ell(g, [0, 1.46, 0.11], [0.032, 0.018, 0.045], mt);
    S(s => {
      ell(g, [s * 0.12, 1.49, 0.04], [0.022, 0.032, 0.025], ms);
      ell(g, [s * 0.065, 1.41, 0.08], [0.02, 0.014, 0.022], ms);
    });
  });

add('esophagus', 'Esophagus', 'Oesophagus', 'digestive',
  '25 cm fibromuscular tube descending posterior to the trachea through the posterior mediastinum and esophageal hiatus (T10) to join the stomach at the gastroesophageal junction.',
  { histology: 'Non-keratinized stratified squamous epithelium; upper 1/3 skeletal muscle, middle 1/3 mixed, lower 1/3 smooth muscle', clinical: '3 anatomical constrictions: cricopharyngeus (C6), aortic arch/left bronchus (T4), and diaphragmatic hiatus (T10).' },
  g => {
    tube(g, [[0, 1.32, 0.01], [0, 0.9, -0.03], [0.02, 0.56, -0.02], [0.07, 0.49, 0.04]], 0.018, M(0xd48c70));
  });

add('stomach', 'Stomach (Cardia, Fundus, Body, Antrum & Pylorus)', 'Gaster / Ventriculus', 'digestive',
  'J-shaped intraperitoneal organ in the epigastric/left hypochondriac region. Parietal cells secrete HCl & Intrinsic Factor (for Vitamin B12 absorption); Chief cells secrete pepsinogen; G cells secrete gastrin.',
  { blood_supply: 'Left/right gastric arteries (lesser curvature) and left/right gastro-omental + short gastric arteries (greater curvature)', clinical: 'Posterior duodenal/gastric ulcer perforation erodes into the gastroduodenal or splenic artery causing severe hemorrhage.' },
  g => {
    const st = ell(g, [0.13, 0.47, 0.065], [0.095, 0.125, 0.075], M(0xd98a7a));
    st.rotation.z = 0.55;
  });

add('liver_gallbladder', 'Liver (4 Lobes, Porta Hepatis) & Gallbladder', 'Hepar et Vesica biliaris', 'digestive',
  'Largest internal organ (~1.5 kg), divided into Right, Left, Caudate, and Quadrate lobes. Receives dual blood supply (75% portal vein, 25% proper hepatic artery). Gallbladder stores and concentrates bile released via cystic -> common bile duct.',
  { landmarks: 'Portal triad (Hepatic artery, Portal vein, Common bile duct) in hepatoduodenal ligament; Calot triangle', clinical: 'Pringle maneuver compresses the hepatoduodenal ligament to control hepatic bleeding; Murphy sign tests acute cholecystitis.' },
  g => {
    const liv = ell(g, [-0.13, 0.51, 0.065], [0.19, 0.095, 0.1], M(0x7a3a2b));
    liv.rotation.z = -0.15;
    ell(g, [-0.1, 0.43, 0.11], [0.022, 0.038, 0.022], M(0x4f772d));
  });

add('pancreas_duodenum', 'Duodenum (C-Loop) & Exocrine Pancreas', 'Duodenum et Pancreas', 'digestive',
  'C-shaped duodenum (4 parts: superior, descending, horizontal, ascending) wraps around the head of the pancreas. Main pancreatic duct and common bile duct unite at the hepatopancreatic ampulla (of Vater) entering the 2nd part of duodenum.',
  { landmarks: 'Major duodenal papilla (Sphincter of Oddi); ligament of Treitz marks duodenojejunal flexure (upper vs. lower GI bleed)', clinical: 'Pancreatic head adenocarcinoma compresses the common bile duct, causing painless obstructive jaundice (Courvoisier sign).' },
  g => {
    tube(g, [[0.09, 0.4, 0.06], [0.02, 0.35, 0.05], [0.04, 0.28, 0.04], [0.12, 0.33, 0.04]], 0.022, M(0xe09f7d));
    const pan = ell(g, [0.06, 0.4, 0.01], [0.11, 0.032, 0.03], M(0xf4d58d));
    pan.rotation.z = 0.12;
  });

add('small_intestine', 'Jejunum & Ileum (Small Intestine)', 'Intestinum tenue (Jejunum et Ileum)', 'digestive',
  '~6 meters long intraperitoneal bowel suspended by the mesentery proper. Jejunum (thick wall, prominent plicae circulares, long vasa recta) absorbs most nutrients; Ileum (Peyer patches, more fat/arcades) absorbs vitamin B12 and bile salts.',
  { blood_supply: 'Superior mesenteric artery (SMA) via jejunal and ileal arcades', clinical: 'Meckel diverticulum ("rule of 2s": 2 inches, 2 feet from ileocecal valve, 2% population) is a persistent vitelline duct.' },
  g => {
    const pts = [];
    for (let i = 0; i < 44; i++) {
      pts.push([Math.sin(i * 1.35) * 0.18, 0.25 - i * 0.0105, 0.065 + Math.cos(i * 0.9) * 0.038]);
    }
    tube(g, pts, 0.019, M(0xe3a0a0));
  });

add('large_intestine', 'Cecum, Appendix, Colon & Rectum', 'Intestinum crassum', 'digestive',
  'Cecum + vermiform appendix -> Ascending colon -> Hepatic flexure -> Transverse colon -> Splenic flexure -> Descending colon -> Sigmoid colon -> Rectum & Anal canal. Characterized by teniae coli, haustra, and epiploic appendages.',
  { blood_supply: 'SMA (cecum to proximal 2/3 transverse colon) & IMA (distal 1/3 transverse colon to upper rectum); marginal artery of Drummond', clinical: 'McBurney point (1/3 distance from right ASIS to umbilicus) localizes acute appendicitis tenderness.' },
  g => {
    const m = M(0xc98a6a);
    tube(g, [
      [-0.24, -0.14, 0.06],
      [-0.25, 0.24, 0.06],
      [-0.1, 0.31, 0.08],
      [0.12, 0.31, 0.08],
      [0.25, 0.22, 0.06],
      [0.23, -0.12, 0.06],
      [0.08, -0.19, 0.03],
      [0.0, -0.23, -0.05]
    ], 0.031, m);
    // Vermiform appendix
    tube(g, [[-0.24, -0.14, 0.06], [-0.21, -0.21, 0.05]], 0.008, M(0xb56576));
  });

/* ============================================================================
   10. URINARY (EXCRETORY) SYSTEM
   ============================================================================ */
add('kidneys', 'Kidneys (Cortex, Medulla & Nephron Filtration)', 'Renes', 'urinary',
  'Paired retroperitoneal organs (T12–L3; right slightly lower due to liver). Each contains ~1.2 million nephrons filtering ~180 L/day, secreting renin (JGA) and erythropoietin (EPO), and activating Vitamin D (1-alpha-hydroxylase).',
  { landmarks: 'Renal hilum (anterior-to-posterior: Vein, Artery, Pelvis - "VAP"); Gerota fascia & perirenal fat', clinical: 'Left renal vein passes between SMA and aorta ("nutcracker" entrapment) and receives left gonadal and adrenal veins.' },
  g => {
    const m = M(0x9a4a6a);
    S(s => {
      ell(g, [s * 0.13, 0.25, -0.095], [0.048, 0.082, 0.04], m);
    });
  });

add('ureters_bladder_urethra', 'Ureters, Urinary Bladder & Urethra', 'Ureteres, Vesica urinaria et Urethra', 'urinary',
  'Muscular retroperitoneal ureters propel urine via peristalsis into the subperitoneal urinary bladder (detrusor smooth muscle + urothelium), exiting via the internal (involuntary) and external (pudendal-innervated) urethral sphincters.',
  { landmarks: '3 ureteric constrictions: ureteropelvic junction (UPJ), pelvic brim (crossing iliac vessels), ureterovesical junction (UVJ)', clinical: 'Kidney stones lodge at the 3 ureteric constrictions, causing severe loin-to-groin renal colic; "water under the bridge" (ureter passes under uterine artery/vas deferens).' },
  g => {
    const mu = M(0xb892ff), mb = M(0xc9a6e8);
    S(s => {
      tube(g, [[s * 0.1, 0.24, -0.09], [s * 0.09, 0.0, -0.08], [s * 0.04, -0.18, 0.05]], 0.007, mu);
    });
    ell(g, [0, -0.19, 0.075], [0.065, 0.055, 0.055], mb);
    tube(g, [[0, -0.24, 0.075], [0, -0.31, 0.06]], 0.008, mu);
  });

/* ============================================================================
   11. MALE REPRODUCTIVE SYSTEM
   ============================================================================ */
add('testes_epididymis', 'Testes, Epididymis & Spermatic Cord (Vas Deferens)', 'Testes, Epididymis et Ductus deferens', 'male_repro',
  'Testes reside in the scrotum (~2–3°C cooler than core temperature for spermatogenesis in seminiferous tubules; Leydig cells produce testosterone). Sperm mature in the epididymis and ascend via the ductus deferens through the inguinal canal.',
  { blood_supply: 'Testicular arteries (from abdominal aorta at L2); pampiniform venous plexus (left drains to left renal vein, right to IVC)', clinical: 'Left-sided varicocele is far more common due to perpendicular drainage of left testicular vein into left renal vein.' },
  g => {
    const mt = M(0x4ea8de), mv = M(0x90e0ef);
    S(s => {
      ell(g, [s * 0.042, -0.36, 0.07], [0.024, 0.032, 0.022], mt);
      tube(g, [[s * 0.045, -0.34, 0.05], [s * 0.09, -0.22, 0.09], [s * 0.06, -0.14, 0.03], [s * 0.02, -0.23, 0.02]], 0.006, mv);
    });
  });

add('prostate_seminal', 'Prostate Gland, Seminal Vesicles & Bulbourethral Glands', 'Prostata et Vesiculae seminales', 'male_repro',
  'Seminal vesicles secrete fructose-rich alkaline fluid (~60% of semen volume); the walnut-sized prostate surrounds the prostatic urethra inferior to the bladder neck and secretes PSA and citrate.',
  { landmarks: 'Peripheral zone (most common site of prostate adenocarcinoma) vs. Transitional zone (benign prostatic hyperplasia - BPH)', clinical: 'BPH compresses the prostatic urethra causing urinary hesitancy/nocturia; posterior prostate is palpable on digital rectal exam.' },
  g => {
    ell(g, [0, -0.255, 0.055], [0.034, 0.026, 0.03], M(0x3a86ff));
    S(s => ell(g, [s * 0.028, -0.225, 0.025], [0.015, 0.025, 0.012], M(0x48cae4)));
  });

/* ============================================================================
   12. FEMALE REPRODUCTIVE SYSTEM
   ============================================================================ */
add('ovaries_tubes', 'Ovaries & Uterine (Fallopian) Tubes', 'Ovaria et Tubae uterinae', 'female_repro',
  'Ovaries suspend in the ovarian fossa via the suspensory ligament (carrying ovarian vessels) and ovarian ligament; fimbriae sweep the ovulated oocyte into the infundibulum -> ampulla (usual site of fertilization) -> isthmus.',
  { blood_supply: 'Ovarian arteries (from abdominal aorta at L2) anastomosing with uterine arteries in the broad ligament', clinical: '95% of ectopic pregnancies implant in the ampulla of the fallopian tube, risking life-threatening rupture and hemoperitoneum.' },
  g => {
    const mo = M(0xf78fb3), mt = M(0xffb3c6);
    S(s => {
      ell(g, [s * 0.085, -0.16, 0.01], [0.022, 0.016, 0.015], mo);
      tube(g, [[s * 0.035, -0.15, 0.025], [s * 0.075, -0.145, 0.02], [s * 0.095, -0.165, 0.01]], 0.006, mt);
    });
  });

add('uterus_vagina', 'Uterus (Fundus, Body, Cervix) & Vagina', 'Uterus et Vagina', 'female_repro',
  'Normally anteverted and anteflexed hollow muscular organ (perimetrium, smooth-muscle myometrium, functional & basal endometrium) positioned posterosuperior to the bladder and anterior to the rectum.',
  { landmarks: 'Pouch of Douglas (rectouterine pouch - lowest point of peritoneal cavity); cardinal & uterosacral ligaments', clinical: 'Culdocentesis samples fluid from the rectouterine pouch; cervical transformation zone is screened via Pap smear for HPV dysplasia.' },
  g => {
    const m = M(0xf72585, 0.88);
    const ut = ell(g, [0, -0.15, 0.025], [0.04, 0.052, 0.032], m);
    ut.rotation.x = 0.45;
    tube(g, [[0, -0.19, 0.01], [0, -0.28, 0.025]], 0.016, M(0xff758f, 0.88));
  });

add('mammary_glands', 'Mammary Glands', 'Glandulae mammariae', 'female_repro',
  'Modified apocrine sweat glands overlying pectoralis major and serratus anterior (ribs 2–6), composed of 15–20 lactiferous lobes, Cooper suspensory ligaments, and lactiferous ducts opening at the nipple.',
  { lymphatic_drainage: '>75% drains to axillary lymph nodes (pectoral/anterior group); medial quadrants drain to parasternal nodes', clinical: 'Tumor infiltration of Cooper ligaments causes skin dimpling; dermal lymphatic blockage produces peau d’orange.' },
  g => {
    const m = M(0xffccd5, 0.42);
    S(s => {
      ell(g, [s * 0.16, 0.88, 0.25], [0.085, 0.085, 0.055], m);
      ell(g, [s * 0.16, 0.88, 0.305], [0.016, 0.016, 0.012], M(0xe5989b, 0.85));
    });
  });

/* ============================================================================
   GHOST BODY OUTLINE & 3D PINS
   ============================================================================ */
const ghost = new THREE.Group();
scene.add(ghost);
{
  const m = new THREE.MeshStandardMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.08, depthWrite: false, roughness: 1 });
  const t = limb(ghost, [0, 1.15, 0], [0, -0.15, 0], 0.42, 0.36, m);
  t.scale.z = 0.65;
  ell(ghost, [0, 1.61, 0], [0.19, 0.23, 0.2], m);
  limb(ghost, [0, 1.35, 0], [0, 1.2, 0], 0.08, 0.1, m);
  S(s => {
    limb(ghost, [s * 0.45, 1.08, 0], [s * 0.52, 0.55, 0], 0.075, 0.06, m);
    limb(ghost, [s * 0.52, 0.55, 0], [s * 0.57, 0.08, 0.03], 0.06, 0.04, m);
    ell(ghost, [s * 0.58, 0, 0.03], [0.045, 0.1, 0.03], m);
    limb(ghost, [s * 0.17, -0.15, 0], [s * 0.18, -1, 0.02], 0.15, 0.09, m);
    limb(ghost, [s * 0.18, -1, 0.02], [s * 0.17, -1.72, 0], 0.08, 0.05, m);
    ell(ghost, [s * 0.17, -1.78, 0.06], [0.06, 0.04, 0.12], m);
  });
}

// Optional 3D pins at center of structures
const pinGroup = new THREE.Group();
pinGroup.visible = false;
scene.add(pinGroup);
const pinGeo = new THREE.SphereGeometry(0.014, 10, 10);
for (const id in P) {
  const b = new THREE.Box3().setFromObject(P[id].g);
  const c = b.getCenter(new V());
  const pm = new THREE.Mesh(pinGeo, new THREE.MeshBasicMaterial({ color: SYS[P[id].sys][1] }));
  pm.position.copy(c);
  pm.userData.id = id;
  pinGroup.add(pm);
  P[id].pin = pm;
}

/* ============================================================================
   UI: SYSTEMS, SEARCH, FILTER, SELECTION & DETAILS
   ============================================================================ */
let sel = null, isolate = false, quiz = null;
const chips = $('#chips'), sysFilter = $('#sysFilter');

function updateSysCount() {
  const active = Object.keys(SYS).filter(k => sysRoot[k].visible).length;
  $('#visCount').textContent = `${active} / ${Object.keys(SYS).length} active`;
  pinGroup.children.forEach(pm => {
    const p = P[pm.userData.id];
    pm.visible = sysRoot[p.sys].visible && p.g.visible;
  });
}

for (const k in SYS) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.sys = k;
  b.style.setProperty('--c', SYS[k][1]);
  b.innerHTML = '<i></i>' + SYS[k][0];
  b.setAttribute('aria-pressed', 'true');
  b.onclick = () => {
    const on = !sysRoot[k].visible;
    sysRoot[k].visible = on;
    b.classList.toggle('off', !on);
    b.setAttribute('aria-pressed', on);
    updateSysCount();
  };
  chips.appendChild(b);

  const opt = document.createElement('option');
  opt.value = k;
  opt.textContent = `${SYS[k][0]} System`;
  sysFilter.appendChild(opt);
}

$('#toggleAllSys').onclick = () => {
  for (const k in SYS) sysRoot[k].visible = true;
  document.querySelectorAll('.chip').forEach(c => { c.classList.remove('off'); c.setAttribute('aria-pressed', 'true'); });
  updateSysCount();
};
$('#hideAllSys').onclick = () => {
  for (const k in SYS) sysRoot[k].visible = false;
  document.querySelectorAll('.chip').forEach(c => { c.classList.add('off'); c.setAttribute('aria-pressed', 'false'); });
  updateSysCount();
};

function buildList() {
  const f = $('#q').value.trim().toLowerCase();
  const sf = sysFilter.value;
  const ul = $('#plist');
  ul.innerHTML = '';
  const items = Object.values(P).filter(p => {
    if (sf !== 'all' && p.sys !== sf) return false;
    if (!f) return true;
    const blob = [p.name, p.latin, SYS[p.sys][0], p.desc, JSON.stringify(p.med)].join(' ').toLowerCase();
    return blob.includes(f);
  });
  $('#structCount').textContent = items.length;
  items.forEach(p => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    if (p.id === sel) b.classList.add('sel');
    b.innerHTML = `<span>${p.name}</span><small>${SYS[p.sys][0]}</small>`;
    b.style.setProperty('--c', SYS[p.sys][1]);
    b.dataset.id = p.id;
    b.onclick = () => {
      if (quiz) return;
      if (!sysRoot[p.sys].visible) {
        sysRoot[p.sys].visible = true;
        const chip = document.querySelector(`.chip[data-sys="${p.sys}"]`);
        if (chip) { chip.classList.remove('off'); chip.setAttribute('aria-pressed', 'true'); }
        updateSysCount();
      }
      select(p.id, true);
    };
    li.appendChild(b);
    ul.appendChild(li);
  });
}
$('#q').oninput = buildList;
sysFilter.onchange = buildList;
buildList();
updateSysCount();

function glow(id, on) {
  if (!P[id]) return;
  P[id].g.traverse(o => {
    if (o.material) o.material.emissive.setHex(on ? 0x5c4a12 : 0);
  });
}

function select(id, focus) {
  if (sel) glow(sel, false);
  sel = id;
  if (id) {
    glow(id, true);
    if (focus) focusOn(id);
  }
  applyIsolate();
  document.querySelectorAll('.plist button').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
  if (!quiz) renderInfo();
}

function applyIsolate() {
  for (const id in P) {
    P[id].g.visible = !(isolate && sel && id !== sel);
  }
  updateSysCount();
}

let goalT = null, goalC = null;
function focusOn(id) {
  const b = new THREE.Box3().setFromObject(P[id].g);
  const c = b.getCenter(new V()), sz = b.getSize(new V());
  const dist = Math.max(0.85, Math.max(sz.x, sz.y, sz.z) * 2.4 + 0.55);
  const dir = cam.position.clone().sub(ctl.target).normalize();
  goalT = c;
  goalC = c.clone().add(dir.multiplyScalar(dist));
}

function renderMedCard(med) {
  if (!med) return '';
  const labels = {
    origin: 'Origin',
    insertion: 'Insertion',
    action: 'Action',
    innervation: 'Innervation',
    blood_supply: 'Blood Supply',
    lymphatic_drainage: 'Lymphatic Drainage',
    landmarks: 'Anatomical Landmarks',
    histology: 'Histology & Microanatomy',
    function: 'Physiological Function'
  };
  let rows = '';
  for (const key in labels) {
    if (med[key]) rows += `<div><b>${labels[key]}:</b> ${med[key]}</div>`;
  }
  let html = rows ? `<div class="med-card">${rows}</div>` : '';
  if (med.clinical) {
    html += `<div class="clin-note"><strong>Clinical Pearl</strong>${med.clinical}</div>`;
  }
  return html;
}

function renderInfo() {
  const r = $('#right');
  if (!sel) {
    let sysHtml = '<div class="sys-overview"><h2>All 12 Systems Overview</h2>';
    for (const k in SYS) {
      sysHtml += `<div class="sys-item"><strong style="color:${SYS[k][1]}">● ${SYS[k][0]}:</strong> ${SYS[k][2]}</div>`;
    }
    sysHtml += '</div>';
    r.innerHTML = `<h2>Anatomical Reference</h2>
      <p class="hint">Click any structure in the 3D model or search the index on the left to inspect its Terminologia Anatomica name, attachments, neurovascular supply, histology, and clinical correlations.</p>
      <p class="hint">Ready for board-style active recall? Click <b>Medical Quiz</b> below.</p>
      ${sysHtml}`;
    return;
  }
  const p = P[sel], c = SYS[p.sys];
  r.innerHTML = `<h2>Structure Details</h2>
    <span class="badge" style="--c:${c[1]}">${c[0]} System</span>
    <h3>${p.name}</h3>
    <div class="latin">${p.latin || ''}</div>
    <p>${p.desc}</p>
    ${renderMedCard(p.med)}
    <div class="row">
      <button class="b" id="foc">Zoom To</button>
      <button class="b ${isolate ? 'on' : ''}" id="iso">${isolate ? 'Show All' : 'Isolate'}</button>
      <button class="b" id="clr">Clear</button>
    </div>`;
  $('#foc').onclick = () => focusOn(sel);
  $('#iso').onclick = () => { isolate = !isolate; applyIsolate(); renderInfo(); };
  $('#clr').onclick = () => { isolate = false; select(null); };
}
renderInfo();

/* ============================================================================
   VIEWPORT CONTROLS & RAYCASTING
   ============================================================================ */
$('#reset').onclick = () => {
  goalT = new V(0, 0, 0);
  goalC = HOME.clone();
  if (sel && !quiz) { isolate = false; select(null); }
};
$('#spin').onclick = e => {
  ctl.autoRotate = !ctl.autoRotate;
  e.target.classList.toggle('on', ctl.autoRotate);
};
$('#ghost').onclick = e => {
  ghost.visible = !ghost.visible;
  e.target.classList.toggle('on', ghost.visible);
};
$('#labelsToggle').onclick = e => {
  pinGroup.visible = !pinGroup.visible;
  e.target.classList.toggle('on', pinGroup.visible);
};
$('#op').oninput = e => {
  mats.forEach(m => m.opacity = m.userData.base * e.target.value);
};

const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let down = null;
const vis = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };

function pickAt(ev) {
  const r = cv.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, cam);
  const targets = pinGroup.visible ? [pinGroup, ...Object.values(sysRoot)] : Object.values(sysRoot);
  const hits = ray.intersectObjects(targets, true).filter(h => vis(h.object) && (!h.object.material || h.object.material.opacity > 0.12));
  if (!hits.length) return null;
  let o = hits[0].object;
  while (o && !o.userData.id) o = o.parent;
  return o ? o.userData.id : null;
}

cv.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
cv.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const id = pickAt(e);
  if (quiz) {
    const q = quiz.qs[quiz.i];
    if (q && q.type === 'find' && !quiz.done && id) answer(id === q.id, id);
    return;
  }
  select(id, false);
});

const tip = $('#tip');
cv.addEventListener('pointermove', e => {
  if (e.buttons) return;
  const id = pickAt(e);
  if (id && !(quiz && quiz.qs[quiz.i] && quiz.qs[quiz.i].type === 'find' && !quiz.done)) {
    const r = main.getBoundingClientRect();
    tip.innerHTML = `<b>${P[id].name}</b> · <span style="color:${SYS[P[id].sys][1]}">${SYS[P[id].sys][0]}</span>`;
    tip.style.left = Math.min(r.width - 220, e.clientX - r.left + 14) + 'px';
    tip.style.top = e.clientY - r.top + 14 + 'px';
    tip.style.display = 'block';
    cv.style.cursor = 'pointer';
  } else {
    tip.style.display = 'none';
    cv.style.cursor = 'grab';
  }
});
cv.addEventListener('pointerleave', () => tip.style.display = 'none');

/* ============================================================================
   MEDICAL STUDENT QUIZ ENGINE
   ============================================================================ */
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

function startQuiz() {
  isolate = false;
  select(null);
  $('#toggleAllSys').click();
  const keys = Object.keys(P);
  quiz = {
    i: 0,
    score: 0,
    done: false,
    qs: shuffle(keys).slice(0, 10).map((id, k) => {
      const p = P[id];
      const modes = ['sys', 'find'];
      if (p.med.innervation) modes.push('innervation');
      if (p.med.action) modes.push('action');
      if (p.med.clinical) modes.push('clinical');
      const type = modes[k % modes.length];
      return { id, type };
    })
  };
  $('#quizBtn').textContent = 'Exit Quiz';
  renderQuiz();
}

function endQuiz() {
  quiz = null;
  $('#quizBtn').textContent = 'Medical Quiz';
  select(null);
  renderInfo();
}
$('#quizBtn').onclick = () => quiz ? endQuiz() : startQuiz();

function renderQuiz() {
  const r = $('#right'), n = quiz.qs.length;
  quiz.done = false;
  if (quiz.i >= n) {
    const pct = quiz.score / n;
    r.innerHTML = `<h2>Assessment Complete</h2>
      <div class="score">${quiz.score} / ${n}</div>
      <p>${pct >= 0.8 ? 'Honors-level performance! Strong command of anatomy and clinical correlates.' : pct >= 0.5 ? 'Solid foundation. Review the clinical pearls for missed structures and retest.' : 'Keep studying the 3D layers and medical cards, then try again.'}</p>
      <div class="row"><button class="b pri" id="again">New Quiz</button><button class="b" id="exit">Back to Explorer</button></div>`;
    $('#again').onclick = startQuiz;
    $('#exit').onclick = endQuiz;
    return;
  }
  const q = quiz.qs[quiz.i], p = P[q.id];
  let h = `<h2>Question ${quiz.i + 1} of ${n} · Score ${quiz.score}</h2>
    <div class="prog"><div style="width:${(quiz.i / n) * 100}%"></div></div>`;

  if (q.type === 'find') {
    h += `<h3 style="font:700 18px Fraunces,serif;margin:0 0 8px">Locate Structure in 3D</h3>
      <p>Click on the <b>${p.name}</b> <span class="latin">(${p.latin || ''})</span> in the 3D model. Adjust opacity or rotate if obscured.</p>
      <div class="row"><button class="b" id="skip">Reveal Structure</button></div>`;
    r.innerHTML = h + '<div id="fb"></div>';
    $('#skip').onclick = () => { if (!quiz.done) answer(false, q.id); };
    return;
  }

  let prompt = '', ans = '', pool = [];
  if (q.type === 'sys') {
    prompt = `Which of the 12 body systems contains the <b>${p.name}</b>?`;
    ans = SYS[p.sys][0] + ' System';
    pool = Object.keys(SYS).map(k => SYS[k][0] + ' System');
  } else if (q.type === 'innervation') {
    prompt = `What is the primary innervation of the <b>${p.name}</b>?`;
    ans = p.med.innervation;
    pool = [...new Set(Object.values(P).map(x => x.med.innervation).filter(Boolean))];
  } else if (q.type === 'action') {
    prompt = `What is the primary action of the <b>${p.name}</b>?`;
    ans = p.med.action;
    pool = [...new Set(Object.values(P).map(x => x.med.action).filter(Boolean))];
  } else if (q.type === 'clinical') {
    prompt = `Which structure is directly associated with this clinical correlate?<br><div class="clin-note" style="margin-top:8px">${p.med.clinical}</div>`;
    ans = p.name;
    pool = [...new Set(Object.values(P).map(x => x.name))];
  }

  const opts = shuffle([ans, ...shuffle(pool.filter(x => x !== ans)).slice(0, 3)]);
  h += `<div style="font-size:15px;margin-bottom:8px">${prompt}</div>` +
    opts.map((o, idx) => `<button class="opt" data-i="${idx}">${o}</button>`).join('');
  r.innerHTML = h + '<div id="fb"></div>';
  r.querySelectorAll('.opt').forEach((b, idx) => {
    b.onclick = () => {
      if (quiz.done) return;
      r.querySelectorAll('.opt').forEach((o, j) => {
        o.disabled = true;
        if (opts[j] === ans) o.classList.add('ok');
      });
      if (opts[idx] !== ans) b.classList.add('no');
      answer(opts[idx] === ans, null);
    };
  });
}

function answer(ok, clicked) {
  quiz.done = true;
  const q = quiz.qs[quiz.i], p = P[q.id];
  if (ok) quiz.score++;
  if (q.type === 'find') select(q.id, true);
  const fb = $('#fb');
  const sk = $('#skip');
  if (sk) sk.remove();
  const wrongMsg = (q.type === 'find' && !ok && clicked && clicked !== q.id)
    ? `You clicked <b>${P[clicked].name}</b>. `
    : '';
  fb.className = 'fb';
  fb.innerHTML = `<b style="color:${ok ? 'var(--good)' : 'var(--bad)'}">${ok ? 'Correct!' : 'Incorrect.'}</b> ${wrongMsg}
    <b>${p.name}</b> (${SYS[p.sys][0]} System): ${p.desc}
    <div class="row"><button class="b pri" id="next">${quiz.i + 1 >= quiz.qs.length ? 'See Final Score' : 'Next Question'}</button></div>`;
  $('#next').onclick = () => { select(null); quiz.i++; renderQuiz(); };
}

/* ============================================================================
   RENDER LOOP
   ============================================================================ */
function resize() {
  const w = main.clientWidth, h = main.clientHeight;
  renderer.setSize(w, h, false);
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(main);
resize();

(function loop() {
  requestAnimationFrame(loop);
  if (goalT) {
    ctl.target.lerp(goalT, 0.12);
    cam.position.lerp(goalC, 0.12);
    if (ctl.target.distanceTo(goalT) < 0.002 && cam.position.distanceTo(goalC) < 0.01) goalT = null;
  }
  ctl.update();
  renderer.render(scene, cam);
})();
