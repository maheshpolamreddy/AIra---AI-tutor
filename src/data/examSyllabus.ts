/**
 * Syllabus and difficulty hints for competitive exam AI generation.
 * Used to align generated MCQs with official exam scope and level.
 */

/** Per-exam overall difficulty / style guidance */
export const EXAM_DIFFICULTY_PROFILE: Record<string, string> = {
  'jee-main':
    'JEE Main standard: single-concept and two-step problems; ~30% Easy, ~50% Medium, ~20% Hard. No Olympiad-only tricks.',
  'jee-advanced':
    'JEE Advanced standard: multi-step reasoning, subtle distractors; ~15% Medium, ~55% Hard, ~30% very challenging. Prefer linked concepts and assertion–reason style where appropriate.',
  neet:
    'NEET (UG) standard: NCERT-aligned, factual plus applied; ~35% Easy, ~45% Medium, ~20% Hard. Biology must match NCERT depth.',
  eamcet:
    'EAMCET (Engineering) style: brisk numericals and direct theory; strong emphasis on speed and intermediate calculations.',
  polycet:
    'Diploma-level POLYCET: straightforward to moderate; clear wording; fewer multi-page derivations.',
  ntse:
    'NTSE MAT/SAT: age-appropriate for Class 10; MAT uses reasoning patterns; SAT aligns with NCERT Science/Social/Math.',
  'rjc-cet':
    'Intermediate-level CET: board + light competitive mix; balanced language and quantitative skills.',
  gate:
    'GATE-style: engineering depth, numerical and conceptual; General Aptitude follows GATE GA patterns.',
  'nmms':
    'NMMS Class 8 Scholarship standard: MAT tests logical and pattern-based reasoning; SAT tests basic Class 7-8 NCERT Science, Social Science, and Mathematics; ~40% Easy, ~45% Medium, ~15% Hard.',
  'olympiad':
    'Olympiads Class 6-10 standard: higher-order thinking skills (HOTS), logical reasoning, and conceptual depth; ~20% Easy, ~50% Medium, ~30% Hard.',
  'rgukt-iiit':
    'RGUKT IIIT Entrance standard: Class 10 State Board / CBSE syllabus; tests application of concepts in Mathematics, Physical Science, and Biological Science; ~30% Easy, ~50% Medium, ~20% Hard.',
};

const DEFAULT_SUBJECT_SYLLABUS =
  'Use the standard national board + competitive syllabus for this subject. Stay within high-school / early UG scope unless the exam demands otherwise.';

/** Key units/chapters to anchor AI coverage (not exhaustive—prompts the model to stay on-scope). */
export const SUBJECT_SYLLABUS_CONTEXT: Record<string, Record<string, string>> = {
  'jee-main': {
    phy: 'Mechanics, waves, thermodynamics, electrostatics, current electricity, magnetism, EMI/AC, optics, modern physics (NCERT Class 11–12).',
    chem: 'Physical, organic, inorganic chemistry per JEE Main weightage; NCERT-based reactions and periodic trends.',
    math: 'Algebra, coordinate geometry, calculus, trigonometry, probability, vectors & 3D as per JEE Main.',
  },
  'jee-advanced': {
    phy: 'IIT-level mechanics, rotation, waves, thermal, electrodynamics, optics, modern physics with multi-step problems.',
    chem: 'Advanced organic mechanisms, thermo/kinetics, electrochemistry, qualitative inorganic reasoning.',
    math: 'Rigorous calculus, algebra, combinatorics, complex numbers, analytical geometry suitable for Advanced.',
  },
  neet: {
    phy: 'NCERT Class 11–12 Physics: mechanics, properties of matter, thermodynamics, waves, electricity, magnetism, optics, modern physics.',
    chem: 'NCERT Physical / Organic / Inorganic for NEET; biomolecules, polymers, everyday chemistry where relevant.',
    bot: 'NCERT Botany: cell biology, plant physiology, reproduction, genetics, ecology, biotechnology.',
    zoo: 'NCERT Zoology: animal physiology, reproduction, evolution, human health, ecology.',
  },
  eamcet: {
    math: 'Intermediate Mathematics: algebra, trigonometry, coordinate geometry, calculus, probability.',
    phy: 'Mechanics, properties of matter, heat, sound, electricity, magnetism, optics, modern physics at EAMCET level.',
    chem: 'Atomic structure, bonding, stoichiometry, organic nomenclature and reactions, acids/bases, electrochemistry.',
  },
  polycet: {
    math: 'Diploma-level mathematics: arithmetic, algebra, geometry, trigonometry.',
    phy: 'Basic mechanics, heat, sound, electricity, magnetism at diploma entrance level.',
    chem: 'Fundamentals: matter, atomic structure, periodic table, chemical bonding, basic organic and inorganic.',
  },
  ntse: {
    mat: 'Verbal/non-verbal reasoning, series, analogies, coding-decoding, pattern recognition suitable for NTSE MAT.',
    'sat-sci': 'NCERT Class 9–10 Science: physics, chemistry, life sciences integrated.',
    'sat-sst': 'NCERT Class 9–10 History, Civics, Geography; factual and interpretive.',
    'sat-math': 'NCERT Class 9–10 Mathematics: arithmetic, basic algebra, geometry.',
  },
  'rjc-cet': {
    math: 'Intermediate board mathematics with CET-style MCQs.',
    sci: 'Integrated science: physics, chemistry, biology basics at intermediate level.',
    eng: 'Reading comprehension, grammar, vocabulary, error spotting.',
  },
  gate: {
    ga: 'GATE General Aptitude: verbal, numerical ability, reasoning, data interpretation.',
    eng: 'Engineering mathematics: linear algebra, calculus, probability, transforms as per GATE common syllabus.',
    cs: 'GATE CS: discrete math, DS/Algo, CN, OS, DBMS, TOC, digital logic, compilers (typical GATE CS scope).',
  },
  'nmms': {
    mat: 'Verbal/non-verbal reasoning, series completion, analogies, classification, coding-decoding, and pattern recognition (Class 8 standard).',
    'sat-sci': 'Class 7-8 Science: physics (light, force, pressure, heat), chemistry (synthetic fibres, metals, chemical effects of current), and biology (crop production, microorganisms, cell structure).',
    'sat-sst': 'Class 7-8 History, Geography, and Civics: Indian national movement, resources, agriculture, constitution, and judiciary.',
    'sat-math': 'Class 7-8 Mathematics: rational numbers, linear equations, quadrilaterals, square/cube roots, mensuration, and algebra.',
  },
  'olympiad': {
    math: 'Olympiad Mathematics: number system, algebra, geometry, mensuration, data handling, and higher-order thinking problems.',
    sci: 'Olympiad Science: physical and chemical changes, heat, motion, force, cells, plants, human physiology, and pollution.',
    eng: 'Olympiad English: grammar, sentence structure, comprehension, vocabulary, and everyday communication.',
    mat: 'Olympiad Logical Reasoning: verbal and non-verbal reasoning, analogies, patterns, coding, and spatial relationships.',
  },
  'rgukt-iiit': {
    math: 'Class 10 Mathematics: real numbers, polynomials, linear equations, quadratic equations, progressions, coordinate geometry, trigonometry, and mensuration.',
    phy: 'Class 10 Physics: light reflection and refraction, human eye, electricity, and magnetic effects of current.',
    chem: 'Class 10 Chemistry: chemical reactions, acids and bases, metals and non-metals, carbon compounds, and classification.',
    bio: 'Class 10 Biology: life processes, control and coordination, reproduction, heredity, and environment.',
  },
};

/**
 * How real papers for this exam usually look — used to steer stems away from generic templates.
 */
export const EXAM_PATTERN_GUIDE: Record<string, string> = {
  'jee-main':
    'Typical JEE Main stems: single-correct, numeric answers expressed as one of four values; occasional Assertion–Reason; chemistry reaction sequences; math short computation. Avoid NEET-style pure fact recall unless in Chemistry/Biology crossover.',
  'jee-advanced':
    'Typical Advanced stems: multi-constraint mechanics, linked comprehension, integer/numeric feel in options, deep organic sequences, non-routine proofs-style multiple choice.',
  neet:
    'Typical NEET stems: NCERT-faithful facts, applied biology, reaction conditions, graph-less quantitative where needed; Assertion–Reason appears; options are often statement bundles.',
  eamcet:
    'Typical EAMCET: fast numeric plug-in, direct formulae, Telangana/Andhra intermediate flavour; fewer paragraph-long English stems.',
  polycet:
    'Typical POLYCET: straightforward computation, definitions, simple applications; minimal ornate wording.',
  ntse:
    'Typical NTSE MAT: patterns, analogies, series; SAT: short NCERT-based fact and interpretation.',
  'rjc-cet':
    'Typical RJC: board-level language, mixed science, reading passages with MCQs.',
  gate:
    'Typical GATE: technical MCQs with engineering data, GA with verbal + quantitative reasoning.',
  'nmms':
    'Typical NMMS: Direct Scholastic and Mental Ability questions suited for Class 8 scholarship seekers.',
  'olympiad':
    'Typical Olympiad: Challenging, conceptual, and non-routine problem solving with logical reasoning.',
  'rgukt-iiit':
    'Typical RGUKT IIIT: CBSE/State Board Class 10 standard multiple choice questions focusing on fundamental application.',
};

export function getExamDifficultyGuidance(examId: string): string {
  return EXAM_DIFFICULTY_PROFILE[examId] ?? 'Match the official difficulty distribution for this examination.';
}

export function getExamPatternGuide(examId: string): string {
  return EXAM_PATTERN_GUIDE[examId] ?? 'Match the authentic style and pacing of the named examination — not a generic school test.';
}

export function getSubjectSyllabusContext(examId: string, subjectId: string): string {
  const byExam = SUBJECT_SYLLABUS_CONTEXT[examId];
  if (byExam?.[subjectId]) return byExam[subjectId];
  const fallback = SUBJECT_SYLLABUS_CONTEXT[examId]?.['default'];
  if (fallback) return fallback;
  return DEFAULT_SUBJECT_SYLLABUS;
}

/**
 * Per exam + subject: accuracy rules and “what not to do” so items stay on-discipline
 * and do not blur into other subjects (major cause of generic / repetitive output).
 */
export const SUBJECT_DISCIPLINE_RULES: Record<string, Record<string, string>> = {
  'jee-main': {
    phy: 'Physics only: use SI units; sign/direction matters for vectors; include varied chapters (mechanics, E&M, optics, modern) — do not ask biology or chemistry disguised as physics.',
    chem: 'Chemistry only: balance mentally where needed; name reactions and conditions per NCERT/JEE; avoid pure physics word problems.',
    math: 'Mathematics only: calculus/algebra/geometry appropriate to JEE Main; avoid biology/chemistry narratives.',
  },
  'jee-advanced': {
    phy: 'Advanced physics: multi-step, subtle distractors; rotation, constraints, fields — stay rigorous; no NEET-style one-line facts unless physics-based.',
    chem: 'Advanced chemistry: mechanism depth, stereochemistry, thermo/kinetics; avoid generic definitions repeated across questions.',
    math: 'Advanced math: non-routine but fair; avoid repeating the same trick (e.g. same substitution) across items in one batch.',
  },
  neet: {
    phy: 'NEET Physics: NCERT-aligned numericals and concepts; avoid JEE-only olympiad setups.',
    chem: 'NEET Chemistry: NCERT reactions, biomolecules, everyday chemistry; options as short statements typical of NEET.',
    bot: 'Botany ONLY: plants, tissues, physiology, genetics, ecology of plants — do NOT ask animal/human physiology here.',
    zoo: 'Zoology ONLY: animals, human physiology, evolution, health — do NOT ask pure plant taxonomy here.',
  },
  eamcet: {
    math: 'EAMCET Math: intermediate-level speed maths; varied subtopics across algebra, trig, calculus, probability.',
    phy: 'EAMCET Physics: formula application and short numericals; Andhra/Telangana intermediate flavour.',
    chem: 'EAMCET Chemistry: brisk theory + numeric; stoichiometry and organic recognition common.',
  },
  polycet: {
    math: 'Diploma math: arithmetic through basic trig; avoid JEE Advanced calculus depth.',
    phy: 'Diploma physics: simple labs and definitions; avoid long derivations.',
    chem: 'Diploma chemistry: basics and straightforward applications.',
  },
  ntse: {
    mat: 'Mental Ability: reasoning patterns, series, coding, non-verbal — not school science.',
    'sat-sci': 'Integrated Class 9–10 science; rotate physics/chemistry/life science contexts.',
    'sat-sst': 'History/Civics/Geography NCERT; avoid engineering math.',
    'sat-math': 'Class 9–10 math only; clear numbers and diagrams in words if needed.',
  },
  'rjc-cet': {
    math: 'Intermediate mathematics for CET; varied stem openings.',
    sci: 'Integrated science: rotate physics/chemistry/biology items; label topic clearly in topic field.',
    eng: 'English: grammar, vocabulary, reading comprehension — single-best answer MCQs.',
  },
  gate: {
    ga: 'GATE GA: verbal + quantitative + reasoning; no core engineering technicals unless GA-style.',
    eng: 'Engineering mathematics: linear algebra, ODE, probability, transforms — exam-appropriate difficulty.',
    cs: 'CS technical: algorithms, DS, OS, networks, DB, TOC — plausible wrong options from common bugs/misconceptions.',
  },
  'nmms': {
    mat: 'Mental Ability: reasoning and logic puzzles. No school syllabus questions.',
    'sat-sci': 'Science SAT: direct Class 8 science concepts.',
    'sat-sst': 'Social Science SAT: direct history, civics, and geography.',
    'sat-math': 'Mathematics SAT: Class 8 level algebra, geometry, and arithmetic.',
  },
  'olympiad': {
    math: 'Olympiad Math: HOTS arithmetic, algebra, and geometry.',
    sci: 'Olympiad Science: deep conceptual science questions.',
    eng: 'Olympiad English: advanced grammar and usage.',
    mat: 'Olympiad Logical Reasoning: logical puzzles and series.',
  },
  'rgukt-iiit': {
    math: 'RGUKT Math: Class 10 board level questions.',
    phy: 'RGUKT Physics: basic mechanics, optics, and electricity.',
    chem: 'RGUKT Chemistry: basic reactions and periodic table.',
    bio: 'RGUKT Biology: basic plant and animal physiology.',
  },
};

export function getSubjectDisciplineRules(examId: string, subjectId: string): string {
  return SUBJECT_DISCIPLINE_RULES[examId]?.[subjectId] ??
    'Stay strictly within this subject; use terminology and difficulty typical of the named exam — not a generic trivia quiz.';
}

/** Full block for prompts: syllabus + discipline + subject lock. */
export function getSubjectGenerationBrief(examId: string, subjectId: string, subjectName: string): string {
  const syllabus = getSubjectSyllabusContext(examId, subjectId);
  const discipline = getSubjectDisciplineRules(examId, subjectId);
  return [
    `SUBJECT LOCK: Generate ONLY questions for "${subjectName}" (code: ${subjectId}) in "${examId}". Every stem and option must clearly belong to this subject. Do not mix in questions meant for other subjects.`,
    `SYLLABUS ANCHORS (cover varied units across the paper, not one chapter repeated):\n${syllabus}`,
    `DISCIPLINE & REALISM:\n${discipline}`,
  ].join('\n\n');
}
