import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Volume2, VolumeX,
    CheckCircle2, BookOpen, BrainCircuit, Lightbulb,
    FlaskConical, Calculator, Target, RefreshCw, Loader2,
    PlayCircle, BarChart3, HelpCircle, XCircle
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { useSpeech } from '../hooks/useSpeech';
import { useTeachingStore } from '../stores/teachingStore';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CompetitiveQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    topic: string;
    difficulty: string;
    examYear: string;
    subjectId: string;
    subjectName: string;
}

interface ThemeConfig {
    color: string;
    bgColor: string;
    gradient: string;
}

interface AITeachingStep {
    id: number;
    title: string;
    subtitle: string;
    content: string;           // Rich markdown-style text
    speech: string;            // Voice narration script
    visualType: 'concept' | 'formula' | 'solution' | 'answer' | 'insight';
    icon: string;
    highlights?: string[];
}

// ─── Grade & Style Helper ───────────────────────────────────────────────────
function getGradeAndStyle(examId: string): { grade: string; styleDescription: string } {
    const id = (examId || '').toLowerCase();
    if (id.includes('jee-advanced')) {
        return { grade: 'Class 11-12 (JEE Advanced)', styleDescription: 'Deep conceptual reasoning, rigorous proof/derivation, and advanced problem-solving techniques.' };
    }
    if (id.includes('jee')) {
        return { grade: 'Class 11-12 (JEE Main)', styleDescription: 'Highly conceptual and exam-oriented explanation, focusing on application of formulas and quick calculation tricks.' };
    }
    if (id.includes('neet')) {
        return { grade: 'Class 11-12 (NEET)', styleDescription: 'Medical concept explanation, emphasizing biological mechanisms, chemical reactions, physical concepts, and clear terminology.' };
    }
    if (id.includes('olympiad')) {
        return { grade: 'Class 8-10 (Olympiad)', styleDescription: 'Higher-order thinking, logical puzzles, analytical explanation, and rigorous concept application.' };
    }
    if (id.includes('rgukt') || id.includes('polycet') || id.includes('eamcet')) {
        return { grade: 'Class 10-12 (State Board / Entrance)', styleDescription: 'Exam-oriented, clear conceptual focus, step-by-step mathematics, and clear formula explanation.' };
    }
    if (id.includes('nmms')) {
        return { grade: 'Class 8', styleDescription: 'Slightly more detailed, encouraging tone, simple analogies, step-by-step logic.' };
    }
    if (id.includes('sainik') || id.includes('navodaya') || id.includes('kv') || id.includes('emrs')) {
        return { grade: 'Class 6-8', styleDescription: 'Very simple language, encouraging tone, colorful explanations, and basic math/logical connections.' };
    }
    return { grade: 'Secondary School', styleDescription: 'Encouraging, clear, concept-focused teaching style with simple explanations.' };
}

// ─── Visual Highlighting Function ──────────────────────────────────────────
function highlightText(text: string, highlights?: string[], color?: string): React.ReactNode {
    if (!highlights || highlights.length === 0 || !text) return text;
    const sorted = [...highlights].filter(Boolean).sort((a, b) => b.length - a.length);
    if (sorted.length === 0) return text;
    
    const escaped = sorted.map(h => h.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    return parts.map((part, i) => {
        const matches = sorted.some(h => h.toLowerCase() === part.toLowerCase());
        if (matches) {
            return (
                <motion.mark
                    key={i}
                    initial={{ backgroundColor: 'rgba(253, 224, 71, 0)' }}
                    animate={{ backgroundColor: 'rgba(253, 224, 71, 0.25)' }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="px-1 py-0.5 rounded font-bold dark:text-yellow-200 border-b-2"
                    style={{ 
                        borderColor: color || '#f59e0b',
                        color: color || '#d97706',
                        background: 'transparent'
                    }}
                >
                    {part}
                </motion.mark>
            );
        }
        return part;
    });
}

// ─── Visual Aid Components ────────────────────────────────────────────────────
function ConceptVisual({ question, themeColor }: { question: CompetitiveQuestion; themeColor: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}05)` }}
        >
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg" style={{ backgroundColor: themeColor }}>
                        🧠
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Concept</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{question.topic}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Key Principle', 'Exam Relevance', 'Difficulty'].map((label, i) => (
                        <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                                {i === 0 ? question.topic : i === 1 ? question.subjectName : question.difficulty}
                            </p>
                        </div>
                    ))}
                </div>
                {question.examYear && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                        <Target className="w-3.5 h-3.5" />
                        Appeared in {question.examYear}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function FormulaVisual({ content, themeColor, highlights }: { content: string; themeColor: string; highlights?: string[] }) {
    // Extract any formula-like lines from content
    const lines = content.split('\n').filter(l => l.includes('=') || l.includes('∴') || l.includes('∵') || l.match(/\d+\s*[+\-×÷*/]\s*\d+/));
    const displayLines = lines.slice(0, 4);

    if (displayLines.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 p-5 font-mono"
            style={{ borderColor: `${themeColor}40`, background: `linear-gradient(135deg, ${themeColor}08, transparent)` }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: themeColor }}>Key Formula / Calculation</span>
            </div>
            <div className="space-y-2">
                {displayLines.map((line, i) => (
                    <div key={i} className="px-4 py-2 rounded-lg bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 text-sm font-semibold">
                        {highlightText(line.trim(), highlights, themeColor)}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function SolutionVisual({ steps, themeColor, highlights }: { steps: string[]; themeColor: string; highlights?: string[] }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >
            {steps.slice(0, 5).map((step, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-3 items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5" style={{ backgroundColor: themeColor }}>
                        {i + 1}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                        {highlightText(step, highlights, themeColor)}
                    </p>
                </motion.div>
            ))}
        </motion.div>
    );
}

function AnswerVisual({ question, userAnswer }: { question: CompetitiveQuestion; userAnswer?: number }) {
    return (
        <div className="space-y-3">
            {question.options.map((opt, i) => {
                const isCorrect = i === question.correctAnswer;
                const isUserSelected = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1 && i === userAnswer;
                
                let borderColor = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900';
                let bgBadge = 'bg-slate-100 dark:bg-slate-800 text-slate-500';
                let textColor = 'text-slate-600 dark:text-slate-400';
                
                if (isCorrect) {
                    borderColor = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                    bgBadge = 'bg-emerald-500 text-white';
                    textColor = 'text-emerald-800 dark:text-emerald-300';
                } else if (isUserSelected) {
                    borderColor = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20';
                    bgBadge = 'bg-rose-500 text-white';
                    textColor = 'text-rose-800 dark:text-rose-300';
                } else if (userAnswer !== undefined && userAnswer !== -1) {
                    borderColor = 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 opacity-50';
                }

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${borderColor}`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${bgBadge}`}>
                            {String.fromCharCode(65 + i)}
                        </div>
                        <p className={`flex-1 text-sm font-semibold ${textColor}`}>{opt}</p>
                        {isCorrect && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span>Correct</span>
                            </div>
                        )}
                        {!isCorrect && isUserSelected && (
                            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                <span>Your Answer</span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}

function InsightVisual({ content, themeColor, highlights }: { content: string; themeColor: string; highlights?: string[] }) {
    const bullets = content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('*')).slice(0, 4);
    const displayItems = bullets.length > 0 ? bullets.map(b => b.replace(/^[-•*]\s*/, '')) : [content.substring(0, 200)];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5"
            style={{ background: `linear-gradient(135deg, ${themeColor}12, ${themeColor}04)`, border: `1.5px solid ${themeColor}30` }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" style={{ color: themeColor }} />
                <span className="text-sm font-black" style={{ color: themeColor }}>Pro Tips for Exams</span>
            </div>
            <div className="space-y-3">
                {displayItems.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60">
                        <span className="text-base flex-shrink-0">💡</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {highlightText(item, highlights, themeColor)}
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Markdown Content Renderer ───────────────────────────────────────────────
function ContentRenderer({ text, highlights, themeColor }: { text: string; highlights?: string[]; themeColor?: string }) {
    const lines = text.split('\n');
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                if (line.startsWith('## ')) return (
                    <h2 key={i} className="text-xl font-black text-slate-900 dark:text-white mt-4 mb-2">
                        {highlightText(line.replace('## ', ''), highlights, themeColor)}
                    </h2>
                );
                if (line.startsWith('### ')) return (
                    <h3 key={i} className="text-lg font-black text-slate-800 dark:text-slate-200 mt-3 mb-1">
                        {highlightText(line.replace('### ', ''), highlights, themeColor)}
                    </h3>
                );
                if (line.startsWith('---')) return <hr key={i} className="my-3 border-slate-200 dark:border-slate-700" />;

                // Process inline bold/italic
                const processed = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1
                        ? <strong key={j} className="font-black text-slate-900 dark:text-white">{highlightText(part, highlights, themeColor)}</strong>
                        : highlightText(part, highlights, themeColor)
                );

                return (
                    <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                        {processed}
                    </p>
                );
            })}
        </div>
    );
}

// ─── AI Generation ────────────────────────────────────────────────────────────
async function generateAITeachingSteps(
    question: CompetitiveQuestion,
    examName?: string,
    userAnswer?: number
): Promise<AITeachingStep[]> {
    const { grade, styleDescription } = getGradeAndStyle(examName || question.subjectId);
    const hasUserAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1;
    const isUserCorrect = hasUserAnswer && userAnswer === question.correctAnswer;
    const userSelectedLabel = hasUserAnswer ? String.fromCharCode(65 + userAnswer!) : 'None';
    
    // Inferred spoken pace guidance:
    let wordCountGuidance = '20-25 words per step';
    let durationLabel = 'Simple (30-45 seconds total explanation)';
    if (question.difficulty === 'Medium') {
        wordCountGuidance = '30-45 words per step';
        durationLabel = 'Medium (45-75 seconds total explanation)';
    } else if (question.difficulty === 'Hard') {
        wordCountGuidance = '50-70 words per step';
        durationLabel = 'Advanced (75-120 seconds total explanation)';
    }

    const prompt = `You are an expert competitive exam professor teaching in a classroom. Explain this question step-by-step.
Your tone should be: professional, encouraging, concept-focused, natural, and easy to understand. Teach the concept, not just the answer.

--- COMPLETE CONTEXT ---
Exam Name: ${examName || 'Competitive Exam'}
Subject: ${question.subjectName}
Topic/Chapter: ${question.topic}
Difficulty Level: ${question.difficulty} (Target Speech Duration: ${durationLabel})
Target Student Grade/Level: ${grade} (${styleDescription})

Question: "${question.text}"
Options:
${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}
Correct Answer: Option ${String.fromCharCode(65 + question.correctAnswer)} (${question.options[question.correctAnswer]})
Student's Selected Option: ${hasUserAnswer ? `Option ${userSelectedLabel} (${question.options[userAnswer!]})` : 'Unattempted'}
Student's Result: ${hasUserAnswer ? (isUserCorrect ? 'Correct!' : 'Incorrect') : 'N/A'}

--- SUBJECT-SPECIFIC DIRECTIVE ---
${
  question.subjectId === 'math' ? 'MATHEMATICS: Show step-by-step calculations and derivations. Explain any arithmetic shortcuts or logical simplification.' :
  question.subjectId === 'phy' ? 'PHYSICS: Derive/state relevant equations, explain physical concepts behind variables, and relate to physical laws.' :
  question.subjectId === 'chem' ? 'CHEMISTRY: Detail chemical reactions, balanced structures, reaction mechanisms, periodic trends, or electron configurations.' :
  question.subjectId === 'bio' || question.subjectId === 'zoo' || question.subjectId === 'bot' ? 'BIOLOGY: Explain biological processes, morphological terminology, anatomical connections, and structural relations.' :
  question.subjectId === 'eng' || question.subjectId === 'lang' ? 'ENGLISH: Explain grammatical rules, contextual vocabulary cues, and comprehension logic.' :
  'SOCIAL STUDIES: Provide historical context, timeline connections, geographical facts, or civic relationships.'
}

--- SPEECH Transcripts Directive ---
Generate spoken speech text ("speech" fields) that sounds like a natural lecture. Speak clearly, pause naturally, emphasize important concepts, and encourage the student.
For each step, write exactly ${wordCountGuidance} of spoken narration. Make sure it flows naturally as a single contiguous lecture.
Do NOT use robotic templates. Every explanation must be generated completely dynamically.

--- DYNAMIC VISUAL HIGHLIGHTS ---
Identify 2-5 key mathematical equations, chemical names, vocabulary terms, or option labels that appear in the explanation, and return them in the "highlights" array. These will be highlighted on the virtual blackboard as you explain.

Generate exactly 8 steps in JSON format — teach like a premium classroom lecture, not an answer key:

[
  {
    "id": 1,
    "title": "Concept Introduction",
    "subtitle": "What this question is really testing",
    "visualType": "concept",
    "content": "## Framing the idea\\n\\n[Introduce the core concept/topic before touching options. Define the key idea in 2-4 sentences.]",
    "speech": "[Open like a lecturer: name the concept, why it matters in ${examName || 'this exam'}, and what skill is being tested.]",
    "highlights": ["${question.topic}"]
  },
  {
    "id": 2,
    "title": "Answer Announcement",
    "subtitle": "Reviewing the result",
    "visualType": "answer",
    "content": "## ${hasUserAnswer ? (isUserCorrect ? 'Correct' : 'Learning opportunity') : 'Solution'}\\n\\nThe correct option is **Option ${String.fromCharCode(65 + question.correctAnswer)}**: ${question.options[question.correctAnswer]}.\\n\\n${
      hasUserAnswer
        ? (isUserCorrect
            ? 'Strong work — reinforce the method so it sticks under timed pressure.'
            : `You chose Option ${userSelectedLabel}. We will diagnose the trap and rebuild the correct path.`)
        : 'We will derive this carefully so the method transfers to similar questions.'
    }",
    "speech": "[Announce the correct option clearly. ${hasUserAnswer && !isUserCorrect ? `Address why Option ${userSelectedLabel} felt tempting.` : 'Acknowledge difficulty and set expectations for the walkthrough.'}]",
    "highlights": ["Option ${String.fromCharCode(65 + question.correctAnswer)}"]
  },
  {
    "id": 3,
    "title": "Step-by-step Solution",
    "subtitle": "Derivation / reasoning path",
    "visualType": "solution",
    "content": "## Worked solution\\n\\n[Numbered steps. Show equations, reactions, or logic clearly. End with how the correct option falls out.]",
    "speech": "[Walk through each step aloud at a measured pace. Emphasize pivots where students usually slip.]",
    "highlights": []
  },
  {
    "id": 4,
    "title": "Option Analysis",
    "subtitle": "Why each choice is right or wrong",
    "visualType": "insight",
    "content": "## Deconstructing the options\\n\\n- **Option A**: [correct/incorrect reason]\\n- **Option B**: [...]\\n- **Option C**: [...]\\n- **Option D**: [...]\\n\\nCall out the designed distractors.",
    "speech": "[Explain distractors as an experienced examiner would — what misconception each wrong option targets.]",
    "highlights": []
  },
  {
    "id": 5,
    "title": "Common Mistakes",
    "subtitle": "Traps to avoid in the hall",
    "visualType": "insight",
    "content": "## Frequent errors\\n\\n- [Mistake 1]\\n- [Mistake 2]\\n- [Mistake 3]\\n\\nHow to spot them in under 10 seconds.",
    "speech": "[List the classic mistakes for this question type with a coaching tone.]",
    "highlights": []
  },
  {
    "id": 6,
    "title": "Shortcuts & Exam Tips",
    "subtitle": "Speed under pressure",
    "visualType": "insight",
    "content": "## Tricks & strategy\\n\\n- **Shortcut**: [when applicable]\\n- **Elimination tip**: [...]\\n- **Time box**: target seconds for this difficulty",
    "speech": "[Share a practical shortcut or elimination order useful in a timed paper.]",
    "highlights": []
  },
  {
    "id": 7,
    "title": "Memory & Real-world Link",
    "subtitle": "Retention + analogy",
    "visualType": "concept",
    "content": "## Stick the concept\\n\\n- **Mnemonic / memory hook**: [...]\\n- **Analogy**: [relatable real-world picture when it helps]\\n- **Alternative method**: [second valid approach if one exists]",
    "speech": "[Give a memorable hook and, if natural, a real-world analogy. Mention an alternate method when useful.]",
    "highlights": []
  },
  {
    "id": 8,
    "title": "Summary & Next Practice",
    "subtitle": "Close the loop",
    "visualType": "answer",
    "content": "## Takeaways\\n\\n1. [Key takeaway]\\n2. [Key takeaway]\\n3. [Key takeaway]\\n\\n**Follow-up practice**: suggest one related topic or question pattern to attempt next.",
    "speech": "[Summarize crisply and end with one concrete practice suggestion plus encouragement.]",
    "highlights": []
  }
]

Return ONLY the raw JSON array (no markdown backticks, no extra text):`;

    try {
        const raw = await aiService.callAI(prompt);
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON array in response');
        const parsed = JSON.parse(jsonMatch[0]) as AITeachingStep[];
        const iconMap: Record<string, string> = { 
            concept: '🧠', 
            formula: '📐', 
            solution: '⚙️', 
            answer: '✅', 
            insight: '💡' 
        };
        return parsed.map(s => ({ ...s, icon: iconMap[s.visualType] || '📖' }));
    } catch (err) {
        console.warn('[CompetitiveTeachingPage] AI failed, falling back to static steps:', err);
        return buildStaticSteps(question, examName, userAnswer);
    }
}

function buildStaticSteps(
    question: CompetitiveQuestion,
    examName?: string,
    userAnswer?: number
): AITeachingStep[] {
    const correct = question.options[question.correctAnswer];
    const hasUserAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1;
    const isUserCorrect = hasUserAnswer && userAnswer === question.correctAnswer;
    const userSelectedLabel = hasUserAnswer ? String.fromCharCode(65 + userAnswer!) : 'None';

    return [
        {
            id: 1, icon: '✅', visualType: 'answer',
            title: 'Answer Announcement',
            subtitle: 'Reviewing the result',
            content: `## ${hasUserAnswer ? (isUserCorrect ? '🎉 Correct!' : '💡 Learning Opportunity') : '📌 Solution & Result'}\n\nThe correct option is **Option ${String.fromCharCode(65 + question.correctAnswer)}**: ${correct}.\n\n${
                hasUserAnswer 
                    ? (isUserCorrect 
                        ? 'Excellent job! You correctly identified the right choice. Let us review the concept to reinforce your understanding.' 
                        : `You selected Option ${userSelectedLabel}. Let us look at why this option is attractive, address the common misconception, and work through the correction.`)
                    : 'Let us dive into the details to understand why this choice is correct.'
            }`,
            speech: `Let's review the result. The correct answer is Option ${String.fromCharCode(65 + question.correctAnswer)}: ${correct}. ${
                hasUserAnswer 
                    ? (isUserCorrect 
                        ? 'Well done on getting this right!' 
                        : `You selected Option ${userSelectedLabel}. Let's examine this options analysis to see where the misconception happened.`)
                    : ''
            } Let's dive in step-by-step.`,
            highlights: [`Option ${String.fromCharCode(65 + question.correctAnswer)}`]
        },
        {
            id: 2, icon: '⚙️', visualType: 'solution',
            title: 'Why It Is Correct',
            subtitle: 'Detailed derivation and validation',
            content: `## Detailed Solution Walkthrough\n\n${question.explanation || 'Let us apply the core principle to arrive at the answer.'}\n\n### Explanation\nThis option satisfies all the conditions stated in the problem. The correct option is verified mathematically and logically.`,
            speech: `Now, let's look at why this option is correct. ${
                (question.explanation || '').replace(/\n/g, '. ').substring(0, 300)
            } This confirms that option ${String.fromCharCode(65 + question.correctAnswer)} is indeed the right choice.`,
            highlights: [correct]
        },
        {
            id: 3, icon: '📐', visualType: 'formula',
            title: 'Why Others Are Incorrect',
            subtitle: 'Comparing and eliminating choices',
            content: `## Distractor Option Analysis\n\n${question.options
                .map((_, i) => i !== question.correctAnswer ? `- **Option ${String.fromCharCode(65 + i)}**: This choice does not satisfy the core equation because it leads to inconsistent conditions.` : '')
                .filter(Boolean)
                .join('\n')}\n\n### Summary\nUnderstanding the errors in the wrong options helps build solid conceptual boundaries.`,
            speech: `It's critical to understand why the other options are wrong. Distractors in competitive exams are designed to highlight common mistakes, such as sign errors or incorrect formulas. Make sure to carefully eliminate them.`,
            highlights: ['Distractor Option Analysis']
        },
        {
            id: 4, icon: '🧠', visualType: 'concept',
            title: 'Core Concept',
            subtitle: 'Deep-dive into the lesson',
            content: `## Understanding ${question.topic}\n\nThis **${question.difficulty}** question tests your understanding of **${question.topic}** in ${question.subjectName}.\n\n### Core Topic\n**${question.topic}** — a fundamental concept that forms the backbone of ${question.subjectName} questions.\n\n### Why It's Important\nMastering this topic allows you to solve a wide class of problems efficiently under exam time pressure.`,
            speech: `Let's focus on the underlying concept: ${question.topic}. Understanding this principle thoroughly is key, as it forms the basis for many other questions you will face in ${examName || 'this exam'}.`,
            highlights: [question.topic]
        },
        {
            id: 5, icon: '💡', visualType: 'concept',
            title: 'Real-World Connection',
            subtitle: 'The concept in practice',
            content: `## Practical Real-World Connection\n\nConcepts in **${question.topic}** are not just theoretical! They are used directly in:\n- Modern engineering and physics designs\n- Biological systems and chemical industrial synthesis\n- Daily observations and logical puzzle-solving\n\nRecognizing these connections helps make abstract concepts concrete.`,
            speech: `To help this sink in, consider how ${question.topic} is used in the real world. In daily life and industry, this exact principle helps scientists and engineers solve practical problems!`,
            highlights: [question.topic]
        },
        {
            id: 6, icon: '💡', visualType: 'insight',
            title: 'Memory Tip',
            subtitle: 'Mnemonics and exam strategies',
            content: `## Exam Strategies for ${question.topic}\n\n- **Identify the concept first**: Before calculating, recognize what principle is being tested.\n- **Eliminate wrong options**: Often 2 options can be quickly eliminated, improving your odds.\n- **Check units and signs**: Many marks are lost to silly errors in arithmetic.\n- **Practice variations**: Solve 5-10 similar questions to build speed and confidence.\n- **Time management**: If stuck, mark and come back — move to questions you know first.`,
            speech: `Here are powerful exam strategies for ${question.topic}. Always identify the concept being tested before diving into calculation. Eliminate clearly wrong options first, and watch out for unit and sign errors. Practice similar questions to build speed!`,
            highlights: ['Exam Strategies']
        }
    ];
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompetitiveTeachingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const stateData = location.state as { 
        competitiveQuestion?: CompetitiveQuestion; 
        theme?: ThemeConfig;
        userAnswer?: number;
        examName?: string;
    } | null;
    const question = stateData?.competitiveQuestion;
    const theme = stateData?.theme || { color: '#6366f1', bgColor: 'rgba(99,102,241,0.15)', gradient: 'from-indigo-500 to-purple-600' };
    const userAnswer = stateData?.userAnswer;
    const examName = stateData?.examName;

    const [steps, setSteps] = useState<AITeachingStep[]>([]);
    const [isGenerating, setIsGenerating] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [playbackTrigger, setPlaybackTrigger] = useState(0);

    // Reset store states on mount and unmount to prevent double speech & paused states
    useEffect(() => {
        const store = useTeachingStore.getState();
        store.resume();
        store.setSpeaking(false);
        return () => {
            window.dispatchEvent(new CustomEvent('stop-speech'));
        };
    }, []);

    // ── Generate AI steps on mount (re-run only when question identity / id changes, not every field edit)
    useEffect(() => {
        if (!question) { setIsGenerating(false); return; }
        setIsGenerating(true);
        generateAITeachingSteps(question, examName, userAnswer).then(aiSteps => {
            setSteps(aiSteps);
            setIsGenerating(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate steps when question ref/id changes
    }, [question?.id, examName, userAnswer]);

    const currentStepData = steps[currentStep];

    const { isMuted, setIsMuted } = useSpeech(
        currentStepData ? { id: String(currentStepData.id), spokenContent: currentStepData.speech } : null,
        playbackTrigger
    );

    const isSpeaking = useTeachingStore(s => s.isSpeaking);

    const totalSteps = steps.length;
    const progressPct = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    // Helper to parse solution steps
    const getSolutionSteps = (content: string): string[] => {
        const lines = content.split('\n').filter(l => l.trim());
        return lines
            .filter(l => /^Step \d+/.test(l.trim()) || l.trim().startsWith('Step'))
            .map(l => l.replace(/^Step \d+:\s*/i, '').trim())
            .filter(Boolean);
    };

    // ── No question guard
    if (!question && !isGenerating) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Question Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Please go back and select a question to explain.</p>
                    <button onClick={() => navigate(-1)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // ── AI Loading Screen
    if (isGenerating) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-sm"
                >
                    <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                        style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <BrainCircuit className="w-10 h-10 text-white" />
                        </motion.div>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">AI Teacher Preparing</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Generating a personalized step-by-step explanation for this {question?.difficulty} question…
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.color }} />
                        <span className="text-sm font-semibold" style={{ color: theme.color }}>Analyzing question…</span>
                    </div>

                    {/* Animated dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {['Concept', 'Solution', 'Strategy'].map((lbl, i) => (
                            <motion.div
                                key={i}
                                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: theme.color }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                            >
                                {lbl}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">

            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
                    style={{ background: theme.color }}
                />
                <div
                    className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10"
                    style={{ background: theme.color }}
                />
            </div>

            {/* ── Header ── */}
            <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => { navigate(-1); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-sm flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Exam badge */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0" style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}>
                        🎯
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight">{question?.topic}</h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{question?.subjectName} · {totalSteps} Steps · AI Explanation</p>
                    </div>

                    {/* Step counter */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <PlayCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{currentStep + 1} / {totalSteps}</span>
                    </div>

                    {/* Speaking indicator */}
                    <AnimatePresence>
                        {isSpeaking && (
                            <div
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                                style={{ backgroundColor: theme.color }}
                            >
                                <div className="flex items-center gap-1 h-3">
                                    <span className="block w-0.5 h-full bg-white rounded-full animate-voice-bar-1" />
                                    <span className="block w-0.5 h-full bg-white rounded-full animate-voice-bar-2" />
                                    <span className="block w-0.5 h-full bg-white rounded-full animate-voice-bar-3" />
                                </div>
                                <span className="ml-1">Speaking</span>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Mute button */}
                    <button
                        onClick={() => {
                            setIsMuted(!isMuted);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                        title={isMuted ? 'Unmute voice' : 'Mute voice'}
                    >
                        {isMuted
                            ? <VolumeX className="w-4 h-4" />
                            : <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-indigo-500' : ''}`} />
                        }
                    </button>
                </div>
            </header>

            {/* ── Progress Bar ── */}
            <div className="h-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: theme.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* ── Step Tab Bar ── */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex gap-1 py-2.5 overflow-x-auto scrollbar-hide">
                        {steps.map((step, idx) => {
                            const isDone = idx < currentStep;
                            const isActive = idx === currentStep;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => { setCurrentStep(idx); }}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${isActive
                                        ? 'text-white shadow-md'
                                        : isDone
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    style={isActive ? { backgroundColor: theme.color, boxShadow: `0 4px 12px -2px ${theme.color}50` } : {}}
                                >
                                    {isDone
                                        ? <CheckCircle2 className="w-3 h-3" />
                                        : <span className="text-[10px]">{step.icon}</span>
                                    }
                                    <span>{step.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-10 relative z-10">
                <AnimatePresence mode="wait">
                    {currentStepData && (
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            {/* Step header */}
                            <div className="flex items-start gap-4">
                                <motion.div
                                    initial={{ scale: 0.5, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0"
                                    style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}
                                >
                                    {currentStepData.icon}
                                </motion.div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: theme.color }}>
                                        Step {currentStep + 1} of {totalSteps}
                                    </p>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight break-words">
                                        {currentStepData.title}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 break-words">
                                        {currentStepData.subtitle}
                                    </p>
                                </div>

                                {/* Replay button — top right */}
                                <button
                                    onClick={() => {
                                        if (isMuted) setIsMuted(false);
                                        setPlaybackTrigger(prev => prev + 1);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex-shrink-0 mt-1"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Replay</span>
                                </button>
                            </div>

                            {/* Main 2-column layout on tablet+ */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                                {/* Left: Content (3/5 on large) */}
                                <div className="lg:col-span-3">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm h-full">
                                        <ContentRenderer text={currentStepData.content} highlights={currentStepData.highlights} themeColor={theme.color} />
                                    </div>
                                </div>

                                {/* Right: Visual Aid (2/5 on large) */}
                                <div className="lg:col-span-2 space-y-4">
                                    {currentStepData.visualType === 'concept' && question && (
                                        <ConceptVisual question={question} themeColor={theme.color} />
                                    )}
                                    {currentStepData.visualType === 'formula' && (
                                        <>
                                            {question && (
                                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <BookOpen className="w-4 h-4" style={{ color: theme.color }} />
                                                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.color }}>The Question</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed mb-4">{question.text}</p>
                                                    <div className="space-y-2">
                                                        {question.options.map((opt, i) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                                <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                                                                    {String.fromCharCode(65 + i)}
                                                                </span>
                                                                <span>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <FormulaVisual content={currentStepData.content} themeColor={theme.color} highlights={currentStepData.highlights} />
                                        </>
                                    )}
                                    {currentStepData.visualType === 'solution' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <FlaskConical className="w-4 h-4" style={{ color: theme.color }} />
                                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.color }}>Visual Walkthrough</span>
                                            </div>
                                            <SolutionVisual
                                                steps={getSolutionSteps(currentStepData.content).length > 0
                                                    ? getSolutionSteps(currentStepData.content)
                                                    : ['Identify the concept being tested', 'Apply the relevant formula or reasoning', 'Check each answer option', 'Eliminate wrong options', 'Confirm final answer']}
                                                themeColor={theme.color}
                                                highlights={currentStepData.highlights}
                                            />
                                        </div>
                                    )}
                                    {currentStepData.visualType === 'answer' && question && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 px-1">
                                                <BarChart3 className="w-4 h-4" style={{ color: theme.color }} />
                                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.color }}>Answer Breakdown</span>
                                            </div>
                                            <AnswerVisual question={question} userAnswer={userAnswer} />
                                        </div>
                                    )}
                                    {currentStepData.visualType === 'insight' && (
                                        <InsightVisual content={currentStepData.content} themeColor={theme.color} highlights={currentStepData.highlights} />
                                    )}

                                    {/* Difficulty badge */}
                                    {question && (
                                        <div
                                            className="flex items-center gap-3 p-4 rounded-2xl border"
                                            style={{ borderColor: `${theme.color}30`, background: `${theme.color}08` }}
                                        >
                                            <Target className="w-4 h-4 flex-shrink-0" style={{ color: theme.color }} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</p>
                                                <p className="text-sm font-black" style={{ color: theme.color }}>{question.difficulty}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</p>
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300">{question.subjectName}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between mt-8 gap-3">
                    <motion.button
                        onClick={() => { setCurrentStep(Math.max(0, currentStep - 1)); }}
                        disabled={currentStep === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </motion.button>

                    {/* Step dots */}
                    <div className="flex items-center gap-2">
                        {steps.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setCurrentStep(idx); }}
                                className={`rounded-full transition-all duration-300 ${idx === currentStep ? 'w-5 h-2.5' : 'w-2.5 h-2.5 opacity-40 hover:opacity-70'}`}
                                style={{ backgroundColor: theme.color }}
                            />
                        ))}
                    </div>

                    {currentStep < totalSteps - 1 ? (
                        <motion.button
                            onClick={() => { setCurrentStep(currentStep + 1); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all"
                            style={{ backgroundColor: theme.color, boxShadow: `0 8px 20px -5px ${theme.color}50` }}
                        >
                            <span>Next Step</span>
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={() => { navigate(-1); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all"
                            style={{ backgroundColor: '#10b981', boxShadow: '0 8px 24px -5px rgba(16,185,129,0.45)' }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Done!</span>
                        </motion.button>
                    )}
                </div>
            </main>
        </div>
    );
}
