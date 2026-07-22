import { aiService } from './aiService';
import { Question } from '../data/competitiveQuestions';
import { getExamDifficultyGuidance, getExamPatternGuide, getSubjectGenerationBrief } from '../data/examSyllabus';
import {
  getRecentTopicHints,
  getRecentStemHints,
  makeSessionEntropy,
  recordQuestionTopics,
  recordQuestionStems,
  stemFingerprint,
} from './examSessionDiversity';

/** Parameters for full competitive exam paper generation (one subject at a time). */
export interface AIExamPaperParams {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  count: number;
  examYear: string;
  /** mock = general practice; pyq = previous-year style wording */
  mode?: 'mock' | 'pyq';
}

interface RawExamQuestion {
  text?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  questionFormat?: string;
}

/** Rotates through paper — each id must produce a structurally different stem. */
const FORMAT_IDS = [
  'NUMERICAL_WORD',
  'ASSERTION_REASON',
  'STATEMENT_PAIR',
  'CONCEPTUAL_DIRECT',
  'QUALITATIVE_COMPARE',
  'GRAPH_OR_LIMIT_SCENARIO',
  'NEGATIVE_OR_EXCEPTION',
  'SUBJECTIVE_STYLE_MCQ',
  'DATA_COMPREHENSION',
  'CASE_APPLICATION',
] as const;

const FORMAT_RULES: Record<(typeof FORMAT_IDS)[number], string> = {
  NUMERICAL_WORD:
    'Word problem leading to a definite numeric or symbolic result; four options are distinct values/expressions (no “all of the above”).',
  ASSERTION_REASON:
    'Assertion (A) and Reason (R) with the standard four AR truth choices (both true, R explains / not, etc.).',
  STATEMENT_PAIR:
    'Statement I and Statement II; choose the correct option about their truth (IIT/JEE/NEET style).',
  CONCEPTUAL_DIRECT:
    'Pure concept MCQ with minimal calculation; tests definition, condition, or classification.',
  QUALITATIVE_COMPARE:
    'Compare, rank, or identify largest/smallest/strongest among four scenarios (no long arithmetic).',
  GRAPH_OR_LIMIT_SCENARIO:
    'Describe a graph, limit, or physical situation in words; options are interpretations (no figure required).',
  NEGATIVE_OR_EXCEPTION:
    '“Which is NOT correct / incorrect / exception” — one option is wrong in the requested sense.',
  SUBJECTIVE_STYLE_MCQ:
    'SUBJECTIVE-STYLE but still MCQ: four options are short paragraphs (2–4 sentences each); choose the BEST or MOST COMPLETE answer as in board/competitive rubrics.',
  DATA_COMPREHENSION:
    'Include a short data paragraph (2–5 sentences) or small table in the stem, then one MCQ whose answer follows only from that data.',
  CASE_APPLICATION:
    'Short real/lab/situational case; choose the best explanation, diagnosis, or next step.',
};

/** Stable hash for rotating format order per exam+subject so papers don’t always open with the same types. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function computeBatchSizes(total: number): number[] {
  if (total <= 0) return [];
  if (total <= 12) return [total];
  /* Smaller batches → more independent generations → higher diversity across the paper. */
  const maxBatch = total > 35 ? 5 : total > 24 ? 7 : total > 15 ? 9 : 12;
  const sizes: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    const n = Math.min(maxBatch, remaining);
    sizes.push(n);
    remaining -= n;
  }
  return sizes;
}

function extractJsonArray(raw: string): unknown[] | null {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function assignedFormatsForBatch(
  globalOffset: number,
  batchSize: number,
  formatRotationOffset: number
): (typeof FORMAT_IDS)[number][] {
  const out: (typeof FORMAT_IDS)[number][] = [];
  const n = FORMAT_IDS.length;
  for (let i = 0; i < batchSize; i++) {
    out.push(FORMAT_IDS[(globalOffset + i + formatRotationOffset) % n]);
  }
  return out;
}

function mapRawToQuestion(
  q: RawExamQuestion,
  i: number,
  base: {
    examName: string;
    subjectName: string;
    subjectId: string;
    examYear: string;
    idPrefix: string;
  }
): Question {
  const opts = Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
  const ca =
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0;
  const diffRaw = q.difficulty;
  const difficulty: Question['difficulty'] =
    diffRaw === 'Easy' || diffRaw === 'Medium' || diffRaw === 'Hard' ? diffRaw : 'Medium';

  const fmt = q.questionFormat && String(q.questionFormat).trim() ? String(q.questionFormat).trim() : undefined;

  return {
    id: `${base.idPrefix}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    text: (q.text && String(q.text).trim()) || `Question ${i + 1}`,
    options: opts,
    correctAnswer: ca,
    explanation: (q.explanation && String(q.explanation).trim()) || 'See standard reference for this topic.',
    topic: (q.topic && String(q.topic).trim()) || `${base.subjectName} concepts`,
    questionFormat: fmt,
    difficulty,
    examYear: base.examYear,
    subjectId: base.subjectId,
    subjectName: base.subjectName,
  };
}

function normalizeRawQuestion(item: unknown): RawExamQuestion | null {
  if (!item || typeof item !== 'object') return null;
  return item as RawExamQuestion;
}

function buildBatchPrompt(args: {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  year: string;
  mode: 'mock' | 'pyq';
  sessionEntropy: string;
  batchIndex: number;
  batchCount: number;
  batchSize: number;
  totalCount: number;
  globalQuestionStart: number;
  subjectBrief: string;
  difficultyGuide: string;
  patternGuide: string;
  historyHints: string;
  stemHints: string;
  topicsCoveredInPaper: string;
  formats: (typeof FORMAT_IDS)[number][];
}): string {
  const {
    examId,
    examName,
    subjectId,
    subjectName,
    year,
    mode,
    sessionEntropy,
    batchIndex,
    batchCount,
    batchSize,
    totalCount,
    globalQuestionStart,
    subjectBrief,
    difficultyGuide,
    patternGuide,
    historyHints,
    stemHints,
    topicsCoveredInPaper,
    formats,
  } = args;

  const pyqNote =
    mode === 'pyq'
      ? `Previous-year practice flavour for calendar year ${year}. Original stems only — do not copy NTA/AP/board copyrighted text.`
      : 'Fresh mock: original stems and options only.';

  const formatLines = formats
    .map((fid, i) => {
      const g = globalQuestionStart + i + 1;
      return `  • Global Q${g}: REQUIRED_FORMAT="${fid}" — ${FORMAT_RULES[fid]}`;
    })
    .join('\n');

  return `You are a senior item writer for "${examName}" ONLY (exam_id=${examId}, subject=${subjectName}, code=${subjectId}).
${pyqNote}

EXAM IDENTITY (critical): Write items that look like REAL ${examName} papers — not generic MCQs. Do NOT reuse templates from other examinations (e.g. do not write JEE-style rotation problems if this is NEET Biology).

SESSION_ENTROPY=${sessionEntropy}
BATCH=${batchIndex}/${batchCount} | questions_in_batch=${batchSize} | subject_total=${totalCount} | global_Q_start=${globalQuestionStart + 1}

OFFICIAL-STYLE HINT:
${patternGuide}

SCOPE & SYLLABUS (mandatory — every item must satisfy SUBJECT LOCK and syllabus anchors):
${subjectBrief}

DIFFICULTY TARGETS:
${difficultyGuide}

MANDATORY FORMAT ROTATION — each question MUST follow its REQUIRED_FORMAT exactly (different structure per row):
${formatLines}

OBJECTIVE vs SUBJECTIVE-STYLE:
- OBJECTIVE: direct single-best-answer items (including numerical and AR) with crisp options.
- SUBJECTIVE_STYLE_MCQ: four paragraph-style options; assess depth, completeness, and reasoning as in board/competitive marking schemes.

DIVERSITY & QUALITY RULES:
1. cognitive_mix: across this batch use different skills — compute, interpret, predict, compare, justify, spot errors.
2. stems: vary openings; max 20% of questions may start with "Which of the following"; vary between statements, data, cases, and AR.
3. options: four distinct meanings; distractors = plausible mistakes (units, sign, misread graphs, half-true statements), never filler.
4. SUBJECTIVE_STYLE_MCQ: each option 2–4 sentences; one clearly best under standard rubrics.
5. DATA_COMPREHENSION: embed the mini passage/table IN the question text before the options.
6. topic field: precise subtopic label (unique within this batch); include chapter/unit hint where helpful.
7. difficulty: Easy / Medium / Hard — spread across the batch per targets above; no two consecutive questions identical in difficulty AND format.
8. Cross-batch: do NOT repeat subtopics listed below.
9. accuracy: numerically verifiable items must be internally consistent; biology/chemistry facts must match NCERT-level truth for this exam.

SELF-CHECK BEFORE OUTPUT:
- No duplicate or near-duplicate topic labels in this batch.
- correctAnswer index matches the option that is actually correct.
- Every question clearly belongs to ${subjectName} for ${examName} only.

${topicsCoveredInPaper ? `TOPICS_ALREADY_USED_IN_THIS_PAPER:\n${topicsCoveredInPaper}\n` : ''}
${historyHints ? `TOPICS_TO_AVOID_FROM_PRIOR_SESSIONS:\n${historyHints}\n` : ''}
${stemHints ? `STEM_OPENINGS_TO_AVOID (do not echo these openings):\n${stemHints}\n` : ''}

OUTPUT: JSON array ONLY, length EXACTLY ${batchSize}. Each object MUST include:
"text","options"(4 strings),"correctAnswer"(0-3),"explanation","topic","difficulty"(Easy|Medium|Hard),"questionFormat"(same REQUIRED_FORMAT id string as assigned for that position in the batch order).

Example shape:
{"text":"...","options":["","","",""],"correctAnswer":0,"explanation":"...","topic":"...","difficulty":"Medium","questionFormat":"CONCEPTUAL_DIRECT"}`;
}

export const aiExamGenerator = {
  /**
   * Generates exam questions using AI with syllabus alignment, batched calls for large papers,
   * format rotation, and session-based topic + stem diversity.
   */
  async generateAIExamPaper(params: AIExamPaperParams): Promise<Question[]> {
    const {
      examId,
      examName,
      subjectId,
      subjectName,
      count: totalCount,
      examYear: year,
      mode = 'mock',
    } = params;

    const sessionEntropy = makeSessionEntropy();
    const subjectBrief = getSubjectGenerationBrief(examId, subjectId, subjectName);
    const difficultyGuide = getExamDifficultyGuidance(examId);
    const patternGuide = getExamPatternGuide(examId);
    const historyHints = getRecentTopicHints(examId, subjectId);
    const stemHints = getRecentStemHints(examId, subjectId);
    const formatRotationOffset = hashString(`${examId}|${subjectId}|${sessionEntropy}`) % FORMAT_IDS.length;

    const batches = computeBatchSizes(totalCount);
    const aggregated: Question[] = [];
    let topicsCoveredInBatchRun = '';

    for (let b = 0; b < batches.length; b++) {
      const batchSize = batches[b];
      const globalOffset = aggregated.length;
      const formats = assignedFormatsForBatch(globalOffset, batchSize, formatRotationOffset);
      const batchHash = hashString(`${sessionEntropy}-b${b}`);
      const batchTemperature = 0.72 + (batchHash % 9) * 0.017;

      const prompt = buildBatchPrompt({
        examId,
        examName,
        subjectId,
        subjectName,
        year,
        mode,
        sessionEntropy: `${sessionEntropy}-b${b}`,
        batchIndex: b + 1,
        batchCount: batches.length,
        batchSize,
        totalCount,
        globalQuestionStart: globalOffset,
        subjectBrief,
        difficultyGuide,
        patternGuide,
        historyHints,
        stemHints,
        topicsCoveredInPaper: topicsCoveredInBatchRun,
        formats,
      });

      const baseId = { examName, subjectName, subjectId, examYear: year, idPrefix: `ai-${examId}-${subjectId}` };

      try {
        const response = await aiService.callAI(prompt, 3, 2200, { temperature: batchTemperature });
        const arr = extractJsonArray(response);
        if (!arr || arr.length === 0) {
          console.error('[aiExamGenerator] Empty or invalid JSON batch; using fallback slice');
          aggregated.push(...this.generateFallbackQuestions(examName, subjectName, batchSize, year, undefined, subjectId));
          topicsCoveredInBatchRun = aggregated
            .slice(-Math.min(aggregated.length, 40))
            .map((q) => q.topic)
            .join('; ');
          continue;
        }

        const slice = arr.slice(0, batchSize);
        const batchQuestions: Question[] = [];

        for (let i = 0; i < slice.length && batchQuestions.length < batchSize; i++) {
          const raw = normalizeRawQuestion(slice[i]);
          if (!raw) continue;
          const expected = formats[i];
          if (expected && String(raw.questionFormat ?? '').trim() !== expected) {
            raw.questionFormat = expected;
          }
          batchQuestions.push(mapRawToQuestion(raw, aggregated.length + batchQuestions.length, baseId));
        }

        while (batchQuestions.length < batchSize) {
          const need = batchSize - batchQuestions.length;
          const filler = this.generateFallbackQuestions(examName, subjectName, need, year, undefined, subjectId);
          batchQuestions.push(...filler);
        }

        aggregated.push(...batchQuestions);

        topicsCoveredInBatchRun = aggregated
          .slice(-Math.min(aggregated.length, 40))
          .map((q) => q.topic)
          .join('; ');
      } catch (error) {
        console.error('[aiExamGenerator] Batch failed:', error);
        aggregated.push(...this.generateFallbackQuestions(examName, subjectName, batchSize, year, undefined, subjectId));
      }
    }

    const trimmed = aggregated.slice(0, totalCount);
    if (trimmed.length < totalCount) {
      const need = totalCount - trimmed.length;
      trimmed.push(...this.generateFallbackQuestions(examName, subjectName, need, year, undefined, subjectId));
    }

    const finalQs = trimmed.slice(0, totalCount);

    recordQuestionTopics(
      examId,
      subjectId,
      finalQs.map((q) => q.topic)
    );
    recordQuestionStems(
      examId,
      subjectId,
      finalQs.map((q) => q.text)
    );

    return finalQs;
  },

  /**
   * Topic/chapter quiz — AI with chapter focus and session diversity.
   */
  async generateAITopicQuiz(subjectName: string, chapterName: string, count: number = 10): Promise<Question[]> {
    const sessionEntropy = makeSessionEntropy();
    const historyKey = `topic-quiz-${subjectName}-${chapterName}`;
    const historyHints = getRecentTopicHints(historyKey, 'chapter');
    const stemHints = getRecentStemHints(historyKey, 'chapter');
    const formatRotationOffset = hashString(`${historyKey}|${sessionEntropy}`) % FORMAT_IDS.length;
    const formats = assignedFormatsForBatch(0, count, formatRotationOffset);

    const formatLines = formats
      .map((fid, i) => `  • Q${i + 1}: REQUIRED_FORMAT="${fid}" — ${FORMAT_RULES[fid]}`)
      .join('\n');

    const prompt = `You are an expert examiner for "${subjectName}".
Generate EXACTLY ${count} questions ONLY from the chapter "${chapterName}". Questions must feel like a real competitive/board paper, not generic drills.

SESSION_ENTROPY=${sessionEntropy}
${historyHints ? `Avoid these subtopics from earlier runs: ${historyHints}` : ''}
${stemHints ? `Avoid similar stem openings: ${stemHints}` : ''}

MANDATORY FORMATS (one per question, in order) — each format changes stem structure:
${formatLines}

Rules: stay inside "${chapterName}"; varied stems and cognitive skills; 4 options; correctAnswer 0–3; distractors = typical student errors; include at least one SUBJECTIVE_STYLE_MCQ (paragraph options) if count>=6.
SELF-CHECK: unique topic labels per question; correctAnswer matches the correct option.

OUTPUT: JSON array only. Each object: text, options[4], correctAnswer, explanation, topic, difficulty, questionFormat (format id).

Example:
{"text":"...","options":["","","",""],"correctAnswer":0,"explanation":"...","topic":"...","difficulty":"Medium","questionFormat":"NUMERICAL_WORD"}`;

    try {
      const response = await aiService.callAI(prompt, 3, 2200, { temperature: 0.74 + (hashString(sessionEntropy) % 8) * 0.018 });
      const arr = extractJsonArray(response);

      if (!arr || arr.length === 0) {
        return this.generateFallbackQuestions('Topic Quiz', subjectName, count, new Date().getFullYear().toString(), chapterName);
      }

      const parsed = arr.slice(0, count);
      const out: Question[] = parsed.map((item, i) => {
        const raw = normalizeRawQuestion(item) ?? {};
        const expected = formats[i];
        if (expected && String(raw.questionFormat ?? '').trim() !== expected) {
          raw.questionFormat = expected;
        }
        return mapRawToQuestion(raw, i, {
          examName: 'Topic Quiz',
          subjectName,
          subjectId: subjectName.toLowerCase().slice(0, 8),
          examYear: new Date().getFullYear().toString(),
          idPrefix: `ai-quiz-${chapterName.replace(/\s+/g, '-')}`,
        });
      });

      recordQuestionTopics(
        historyKey,
        'chapter',
        out.map((q) => q.topic)
      );
      recordQuestionStems(
        historyKey,
        'chapter',
        out.map((q) => q.text)
      );

      return out;
    } catch (error) {
      console.error('[aiExamGenerator] Error generating topic quiz questions:', error);
      return this.generateFallbackQuestions('Topic Quiz', subjectName, count, new Date().getFullYear().toString(), chapterName);
    }
  },

  /**
   * Fallback procedurally generated questions if AI fails
   */
  generateFallbackQuestions(
    examName: string,
    subjectName: string,
    count: number,
    year: string,
    topicName?: string,
    subjectIdOverride?: string
  ): Question[] {
    const sid = subjectIdOverride ?? subjectName.toLowerCase().substring(0, 3);
    return Array.from({ length: count }).map((_, i) => ({
      id: `fallback-${examName}-${subjectName}-${Date.now()}-${i}`,
      text: `[Fallback] Practice Question ${i + 1} for ${topicName || subjectName}. Evaluate the given parameters.`,
      options: [
        `Option A (${Math.floor(Math.random() * 100)})`,
        `Option B (${Math.floor(Math.random() * 100)})`,
        `Option C (${Math.floor(Math.random() * 100)})`,
        `Option D (${Math.floor(Math.random() * 100)})`,
      ],
      correctAnswer: i % 4,
      explanation: `Procedurally generated fallback — the AI service was unavailable or returned an invalid format. Retry for full explanations.`,
      topic: topicName || `${subjectName} General`,
      difficulty: (i % 3 === 0 ? 'Hard' : i % 2 === 0 ? 'Medium' : 'Easy') as Question['difficulty'],
      examYear: year,
      subjectId: sid,
      subjectName: subjectName,
    }));
  },
};

// Export for tests / advanced callers
export { FORMAT_IDS, FORMAT_RULES, stemFingerprint };
