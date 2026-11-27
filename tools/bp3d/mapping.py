# App structure id -> (system, [regex on BodyParts3D English part name], default colour)
# Order matters: the first rule that matches a part name claims it.
SIDE = r'(left |right )?'
NUM = r'(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)'

BONE, CART, MUS = 0xe8e2d0, 0x9ecae1, 0xb8453a
ART, VEIN, NERVE = 0xd62839, 0x3b6fd6, 0xf5d547

RULES = [
    # ---------------- integumentary
    ('epidermis_dermis', 'integumentary', [r'^skin$'], 0xf4a261),
    ('scalp_hair', 'integumentary', [r'^hair of head$', r'^eyebrow$'], 0x5c3a21),

    # ---------------- digestive (teeth / gingiva before skull bones)
    ('salivary_oral', 'digestive', [r'tooth$', r'^gingiva', r'^tongue$', r'submandibular gland', r'sublingual gland',
                                    r'^lip$', r'genioglossus', r'hyoglossus', r'uvular muscle', r'veli palatini'], 0xe07a5f),

    # ---------------- skeletal
    ('cranium', 'skeletal', [r'^frontal bone$', r'parietal bone$', r'temporal bone$', r'^occipital bone$',
                             r'^sphenoid bone$', r'^ethmoid$'], BONE),
    ('viscerocranium', 'skeletal', [r'^mandible$', r'maxilla$', r'zygomatic bone$', r'nasal bone$', r'lacrimal bone$',
                                    r'palatine bone$', r'inferior nasal concha$', r'^vomer$'], BONE),
    ('hyoid', 'skeletal', [r'^hyoid bone$'], BONE),
    ('cervical_spine', 'skeletal', [r'^atlas$', r'^axis$', r'cervical vertebra$', r'disk of axis$',
                                    r'disk of \w+ cervical vertebra$'], BONE),
    ('thoracic_spine', 'skeletal', [r'thoracic vertebra$'], BONE),
    ('lumbar_spine', 'skeletal', [r'lumbar vertebra$', r'^intervertebral disk$'], BONE),
    ('sacrum_coccyx', 'skeletal', [r'^sacrum$', r'coccyx'], BONE),
    ('sternum_ribs', 'skeletal', [r'^manubrium$', r'^body of sternum$', r'^xiphoid process$', SIDE + NUM + r' rib$',
                                  SIDE + NUM + r' costal cartilage$'], BONE),
    ('clavicle_scapula', 'skeletal', [r'clavicle$', r'scapula$'], BONE),
    ('humerus', 'skeletal', [r'humerus$'], BONE),
    ('radius_ulna', 'skeletal', [r'(left|right) radius$', r'(left|right) ulna$', r'interosseous membrane of \w+ forearm'], BONE),
    ('hand_bones', 'skeletal', [r'(scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$',
                                r'metacarpal bone$', r'phalanx of (left|right) (thumb|index finger|middle finger|ring finger|little finger)$',
                                r'flexor retinaculum'], BONE),
    ('pelvic_girdle', 'skeletal', [r'hip bone$'], BONE),
    ('femur', 'skeletal', [r'femur$'], BONE),
    ('patella_knee', 'skeletal', [r'patella$'], BONE),
    ('tibia_fibula', 'skeletal', [r'(left|right) tibia$', r'(left|right) fibula$', r'interosseous membrane of \w+ leg'], BONE),
    ('foot_bones', 'skeletal', [r'calcaneus$', r'talus$', r'navicular bone of', r'cuboid bone$', r'cuneiform bone$',
                                r'metatarsal bone$', r'phalanx of (left|right) (big|second|third|fourth|little) toe$',
                                r'sesamoid bone of', r'long plantar ligament'], BONE),

    # ---------------- nervous
    ('cranial_nerves', 'nervous', [r'optic (nerve|tract|chiasm)', r'^optic chiasm$', r'oculomotor nerve', r'trochlear nerve',
                                   r'ophthalmic nerve', r'frontal nerve', r'lacrimal nerve', r'nasociliary nerve',
                                   r'ethmoidal nerve', r'ciliary nerve', r'ciliary ganglion', r'supra-orbital nerve',
                                   r'supratrochlear nerve', r'infratrochlear nerve'], NERVE),
    ('cerebellum_brainstem', 'nervous', [r'^cerebellum$', r'^pons$', r'^medulla oblongata$', r'^midbrain$', r'colliculus$',
                                         r'^peduncle of midbrain$', r'brachium of \w+ (inferior|superior) colliculus'], 0xc9a227),
    ('pituitary_hypothal', 'endocrine', [r'^pituitary gland$', r'^tuber cinereum$', r'^pineal body$'], 0xe76f51),
    ('diencephalon', 'nervous', [r'thalamus$', r'^hypothalamus$', r'^habenula$', r'geniculate body$', r'^mammillary body$',
                                 r'stria medullaris', r'^interpeduncular fossa$'], 0xe9c46a),
    ('cerebrum', 'nervous', [r'gyrus$', r'gyri', r'occipital lobe$', r'insula$', r'hippocampus$', r'amygdala$', r'lobule$',
                             r'white matter of', r'caudate nucleus$', r'putamen$', r'globus pallidus$', r'^corpus callosum$',
                             r'fornix of forebrain$', r'internal capsule$'], 0xf2c6a0),

    # ---------------- endocrine
    ('adrenals', 'endocrine', [r'adrenal gland$'], 0xe76f51),

    # ---------------- circulatory: heart first, then pulmonary vessels -> lungs, then rest
    ('heart_chambers', 'circulatory', [r'^wall of (left|right) atrium$', r'^wall of ventricle$', r'(cusp|leaflet) of', r'papillary muscle',
                                       r'coronary artery', r'interventricular (branch|vein)', r'cardiac vein$', r'^coronary sinus$',
                                       r'ventricular branch of', r'conus (artery|branch)', r'marginal (vein|branch of right coronary)',
                                       r'vein of left ventricle', r'^pulmonary trunk$'], 0xc42035),
    ('lungs_pleura', 'respiratory', [r'bronchial tree$', r'pulmonary (artery|vein)$', r'segmental (artery|vein)$',
                                     r'(basal|apical|posterior|anterior|lateral|medial|superior) segmental (artery|vein)',
                                     r'part of (right|left|medial|lateral)? ?\w* ?segmental (artery|vein)', r'lingular (artery|vein)',
                                     r'branch of (right|left)? ?\w* ?(basal|superior|anterior|posterior|lateral|medial) segmental artery',
                                     r'branch of (lateral|medial) segmental artery', r'upper lobar artery',
                                     r'segmental vein$', r'trunk of right apical segmental vein'], 0xf2a6b8),
    ('trachea_bronchi', 'respiratory', [r'^trachea$', r'main bronchus'], CART),
    ('liver_gallbladder', 'digestive', [r'^hepatovenous segment', r'^caudate lobe of liver$', r'^gallbladder$', r'^cystic duct$',
                                        r'hepatic duct$', r'hepatic biliary tree$', r'duct of caudate lobe', r'^common hepatic duct$'], 0x7a3a2b),
    ('vena_cava_veins', 'circulatory', [r'vein$', r'vena cava$', r'venous (arch|network)', r'^pre-hepatic portal vein$',
                                        r'branch of (left|right) portal vein', r'veins$', r'vein'], VEIN),
    ('aorta_arteries', 'circulatory', [r'aorta$', r'arter(y|ies)$', r'trunk$', r'arterial arch$', r'plantar arch$', r'palmar arch$',
                                       r'branch of', r'^arteria ', r'^celiac', r'arter(y|ies)'], ART),

    # ---------------- lymphatic
    ('thymus', 'lymphatic', [r'lobe of thymus$'], 0x4cc9f0),
    ('spleen', 'lymphatic', [r'^spleen$'], 0x7b2d43),

    # ---------------- respiratory
    ('larynx', 'respiratory', [r'^thyroid cartilage$', r'^cricoid cartilage$', r'arytenoid', r'corniculate cartilage$',
                               r'cuneiform cartilage$', r'^epiglottis$', r'vocal ligament$', r'vocalis$', r'cricothyroid',
                               r'conus elasticus$', r'thyrohyoid (membrane|ligament)', r'hyo-epiglottic', r'thyro-epiglottic',
                               r'aryepiglotticus'], CART),
    ('nasal_pharynx', 'respiratory', [r'nasal cartilage$', r'alar cartilage$', r'pharyngeal constrictor$', r'^pharyngeal raphe$',
                                      r'palatopharyngeus$', r'salpingopharyngeus$', r'stylopharyngeus$', r'pterygomandibular raphe$'], 0xf2a6b8),

    # ---------------- digestive
    ('esophagus', 'digestive', [r'^esophagus$'], 0xd4954f),
    ('stomach', 'digestive', [r'^stomach$'], 0xd98a7a),
    ('pancreas_duodenum', 'digestive', [r'^pancreas$', r'parenchyma of pancreas', r'pancreatic duct', r'^duodenum$'], 0xe9b872),
    ('small_intestine', 'digestive', [r'jejunum$', r'ileum$', r'^ileocecal junction$'], 0xe5a07a),
    ('large_intestine', 'digestive', [r'^appendix$', r'colon$', r'^rectum$', r'^taenia ', r'external anal sphincter$', r'^cecum$'], 0xb5651d),

    # ---------------- urinary
    ('kidneys', 'urinary', [r'(left|right) kidney$'], 0x9a4a6a),
    ('ureters_bladder_urethra', 'urinary', [r'ureter$', r'^urinary bladder$', r'^urethra$'], 0x9a7be0),

    # ---------------- male reproductive
    ('testes_epididymis', 'male_repro', [r'testis$', r'epididymis$', r'deferent duct$', r'penis$', r'^glans penis$'], 0x4ea8de),
    ('prostate_seminal', 'male_repro', [r'^prostate$', r'seminal vesicle$'], 0x48cae4),

    # ---------------- muscles (app ids from MUSCLES_DATA)
    ('scm', 'muscular', [r'sternocleidomastoid$'], MUS),
    ('scalenes', 'muscular', [r'scalenus (anterior|medius|posterior)$'], MUS),
    ('pecmaj', 'muscular', [r'pectoralis major$'], MUS),
    ('pecmin', 'muscular', [r'pectoralis minor$'], MUS),
    ('serratus', 'muscular', [r'(left|right) serratus anterior$'], MUS),
    ('trap', 'muscular', [r'trapezius$'], MUS),
    ('rhom', 'muscular', [r'rhomboid (major|minor)$'], MUS),
    ('erector', 'muscular', [r'iliocostalis', r'longissimus', r'(left|right) spinalis thoracis$', r'^spinalis$'], MUS),
    ('extobl', 'muscular', [r'external oblique$'], MUS),
    ('diaph', 'muscular', [r'^diaphragm$'], 0xa8453a),
    ('delt_a', 'muscular', [r'^clavicular part of \w+ deltoid$'], MUS),
    ('delt_l', 'muscular', [r'^acromial part of \w+ deltoid$'], MUS),
    ('delt_p', 'muscular', [r'^spinal part of \w+ deltoid$'], MUS),
    ('supra', 'muscular', [r'supraspinatus$'], MUS),
    ('infra', 'muscular', [r'infraspinatus muscle$'], MUS),
    ('tminor', 'muscular', [r'teres minor$'], MUS),
    ('subscap', 'muscular', [r'subscapularis$'], MUS),
    ('tmajor', 'muscular', [r'teres major$'], MUS),
    ('bic_l', 'muscular', [r'head of (left|right) biceps brachii$'], MUS),
    ('brachialis', 'muscular', [r'(left|right) brachialis$'], MUS),
    ('cora', 'muscular', [r'coracobrachialis$'], MUS),
    ('triceps', 'muscular', [r'triceps brachii$'], MUS),
    ('brachrad', 'muscular', [r'brachioradialis$'], MUS),
    ('pronteres', 'muscular', [r'pronator teres$'], MUS),
    ('flex_forearm', 'muscular', [r'flexor carpi (radialis|ulnaris)$', r'flexor digitorum (superficialis|profundus)$',
                                  r'flexor pollicis longus$', r'palmaris longus$', r'pronator quadratus$'], MUS),
    ('ext_forearm', 'muscular', [r'extensor carpi', r'(left|right) extensor digitorum$', r'extensor digiti minimi$',
                                 r'extensor indicis$', r'extensor pollicis', r'abductor pollicis longus$', r'supinator$',
                                 r'anconeus$'], MUS),
    ('thenar_hypo', 'muscular', [r'abductor pollicis brevis$', r'flexor pollicis brevis$', r'opponens pollicis$', r'adductor pollicis$',
                                 r'digiti minimi( brevis)? of (left|right) hand$', r'lumbricals of (left|right) hand$',
                                 r'interossei of (left|right) hand$'], MUS),
    ('psoas', 'muscular', [r'psoas major$', r'(left|right) iliacus$'], MUS),
    ('glutmax', 'muscular', [r'gluteus maximus$'], MUS),
    ('glutmed', 'muscular', [r'gluteus (medius|minimus)$'], MUS),
    ('piriformis', 'muscular', [r'piriformis$', r'gemellus', r'obturator (internus|externus)$', r'quadratus femoris$'], MUS),
    ('tfl', 'muscular', [r'tensor fasciae latae$', r'iliotibial tract$'], MUS),
    ('sart', 'muscular', [r'sartorius$'], MUS),
    ('rectfem', 'muscular', [r'rectus femoris$'], MUS),
    ('vlat', 'muscular', [r'vastus lateralis$'], MUS),
    ('vmed', 'muscular', [r'vastus medialis$'], MUS),
    ('vint', 'muscular', [r'vastus intermedius$'], MUS),
    ('addlong', 'muscular', [r'adductor (longus|brevis)$'], MUS),
    ('addmag', 'muscular', [r'adductor (magnus|minimus)$'], MUS),
    ('gracilis', 'muscular', [r'gracilis$'], MUS),
    ('bifem', 'muscular', [r'head of (left|right) biceps femoris$'], MUS),
    ('semiten', 'muscular', [r'semitendinosus$'], MUS),
    ('semimem', 'muscular', [r'semimembranosus$'], MUS),
    ('gastroc', 'muscular', [r'head of (left|right) gastrocnemius$', r'calcaneal tendon$', r'plantaris$'], MUS),
    ('soleus', 'muscular', [r'soleus$'], MUS),
    ('tibant', 'muscular', [r'tibialis anterior$'], MUS),
    ('fibl', 'muscular', [r'fibularis (longus|brevis)$'], MUS),
]

# Per-part colour overrides inside a structure (regex on part name -> colour)
PART_COLOURS = [
    (r'disk', CART), (r'costal cartilage', CART), (r'cartilage', CART), (r'retinaculum|interosseous membrane|ligament', 0xcfd8dc),
    (r'tooth', 0xfdfcf5), (r'gingiva', 0xe5989b),
    (r'coronary artery|interventricular branch|ventricular branch|conus|marginal branch|circumflex', 0xff4d6d),
    (r'cardiac vein|coronary sinus|interventricular vein|vein of left ventricle|marginal vein', 0x4361ee),
    (r'cusp|leaflet', 0xf1c0c8), (r'papillary', 0x9e1b32), (r'^pulmonary trunk$', 0x3b6fd6),
    (r'bronchial tree', 0xfadadd), (r'pulmonary vein|segmental vein|lingular vein', 0xd62839),
    (r'pulmonary artery|segmental artery|lingular artery|lobar artery|segmental artery', 0x3b6fd6),
    (r'white matter', 0xf5e6d3), (r'gallbladder|cystic duct|hepatic duct|biliary', 0x4f772d),
    (r'tendon|tract$', 0xe9d8c4), (r'portal', 0x5e60ce), (r'pancreatic duct', 0xf4d35e), (r'duodenum', 0xd98a7a),
]
