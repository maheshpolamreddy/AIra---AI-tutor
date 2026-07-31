import type {
    GeneratedNote,
    NoteDiagram,
    NoteDiagramType,
    NoteSection,
    NotesGenerationContext,
} from '../types';

const DIAGRAM_TYPES: NoteDiagramType[] = ['process', 'hierarchy', 'cycle', 'compare', 'concept-map'];

function stripAiJsonWrappers(s: string): string {
    return s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function stripTrailingCommasInJson(s: string): string {
    return s.replace(/,(\s*[\]}])/g, '$1');
}

function extractBalancedJsonObject(raw: string): string | null {
    const start = raw.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < raw.length; i++) {
        const ch = raw[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (inString) {
            if (ch === '\\') escape = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return raw.slice(start, i + 1);
        }
    }
    return null;
}

function normalizeDiagram(raw: unknown): NoteDiagram | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;
    const type = DIAGRAM_TYPES.includes(d.type as NoteDiagramType)
        ? (d.type as NoteDiagramType)
        : 'process';
    const title = typeof d.title === 'string' ? d.title.trim() : '';
    const nodesRaw = Array.isArray(d.nodes) ? d.nodes : [];
    const nodes = nodesRaw
        .map((n, i) => {
            if (!n || typeof n !== 'object') return null;
            const node = n as Record<string, unknown>;
            const label = typeof node.label === 'string' ? node.label.trim() : '';
            if (!label) return null;
            return {
                id: typeof node.id === 'string' && node.id.trim() ? node.id.trim() : `n${i + 1}`,
                label,
                detail: typeof node.detail === 'string' ? node.detail.trim() : undefined,
            };
        })
        .filter(Boolean) as NoteDiagram['nodes'];

    if (!title || nodes.length < 2) return null;

    const edges = Array.isArray(d.edges)
        ? d.edges
              .map(e => {
                  if (!e || typeof e !== 'object') return null;
                  const edge = e as Record<string, unknown>;
                  const from = typeof edge.from === 'string' ? edge.from : '';
                  const to = typeof edge.to === 'string' ? edge.to : '';
                  if (!from || !to) return null;
                  return {
                      from,
                      to,
                      label: typeof edge.label === 'string' ? edge.label : undefined,
                  };
              })
              .filter(Boolean) as NoteDiagram['edges']
        : undefined;

    return {
        type,
        title,
        caption: typeof d.caption === 'string' ? d.caption.trim() : undefined,
        nodes: nodes.slice(0, 8),
        edges,
    };
}

function normalizeSection(raw: unknown): NoteSection | null {
    if (!raw || typeof raw !== 'object') return null;
    const s = raw as Record<string, unknown>;
    const heading = typeof s.heading === 'string' ? s.heading.trim() : '';
    const content = typeof s.content === 'string' ? s.content.trim() : '';
    if (!heading || !content) return null;
    const highlights = Array.isArray(s.highlights)
        ? s.highlights.filter((h): h is string => typeof h === 'string' && h.trim().length > 0).map(h => h.trim())
        : [];
    const diagrams = Array.isArray(s.diagrams)
        ? s.diagrams.map(normalizeDiagram).filter(Boolean) as NoteDiagram[]
        : undefined;
    return {
        heading,
        content,
        highlights: highlights.slice(0, 8),
        diagrams: diagrams && diagrams.length > 0 ? diagrams.slice(0, 2) : undefined,
    };
}

export function parseNotesAiResponse(response: string): { title?: string; sections: NoteSection[]; qualityScore?: number } {
    const cleaned = stripAiJsonWrappers(response);
    const candidates = [cleaned, extractBalancedJsonObject(cleaned)].filter(Boolean) as string[];
    for (const base of candidates) {
        for (const chunk of [base, stripTrailingCommasInJson(base)]) {
            try {
                const parsed = JSON.parse(chunk) as Record<string, unknown>;
                const sectionsRaw = Array.isArray(parsed.sections) ? parsed.sections : [];
                const sections = sectionsRaw.map(normalizeSection).filter(Boolean) as NoteSection[];
                if (sections.length === 0) continue;
                return {
                    title: typeof parsed.title === 'string' ? parsed.title : undefined,
                    sections,
                    qualityScore: typeof parsed.qualityScore === 'number' ? parsed.qualityScore : undefined,
                };
            } catch {
                /* try next */
            }
        }
    }
    throw new Error('Could not parse notes JSON');
}

export function buildNotesPrompt(
    topicName: string,
    fullContent: string,
    context: NotesGenerationContext = {},
): string {
    const subject = context.subjectArea || 'General';
    const grade = context.gradeLevel || 'School';
    const chapter = context.chapterName || '';
    const topicDesc = context.topicDescription || '';
    const subjectDesc = context.subjectDescription || '';
    const concepts = (context.keyConcepts || []).filter(Boolean).slice(0, 16);

    return `You are an expert curriculum teacher and study-notes designer for ${subject} at ${grade} level.
Create DETAILED, exam-ready study notes that are STRICTLY about this topic — never pad with unrelated general advice.

TOPIC: "${topicName}"
SUBJECT: ${subject}
GRADE / LEVEL: ${grade}
${chapter ? `CHAPTER: ${chapter}` : ''}
${topicDesc ? `OFFICIAL TOPIC DESCRIPTION: ${topicDesc}` : ''}
${subjectDesc ? `SUBJECT CONTEXT: ${subjectDesc}` : ''}
${concepts.length ? `KEY CONCEPTS FROM THE LESSON: ${concepts.join('; ')}` : ''}

LESSON SOURCE MATERIAL (ground every claim in this — do not invent off-topic content):
"""
${fullContent}
"""

REQUIREMENTS:
1. Content must be fully about "${topicName}" in ${subject}. Reject filler like "professional applications in general" unless the lesson actually covers it.
2. Write for a real student: precise definitions, mechanisms, worked reasoning, common misconceptions, and memory hooks.
3. Use light markdown inside "content" strings only (bold with **word**, short bullet lines with - ). No HTML. No code fences wrapping the whole JSON.
4. Include 5–7 sections covering: overview, core definitions, detailed explanation / mechanism, worked examples or applications from THIS topic, comparison or contrast when useful, common mistakes, and key takeaways / revision checklist.
5. Add 2–4 diagrams total across the notes (not every section needs one). Prefer process / hierarchy / cycle / compare / concept-map diagrams that clarify THIS topic. Each diagram needs 2–8 short labeled nodes. For concept-map and process, include edges when relationships matter.
6. Highlights must be concrete, testable facts — not vague slogans.
7. qualityScore: integer 80–98 reflecting depth and topic fidelity.

Return ONLY a valid JSON object in this exact shape:
{
  "title": "${topicName} — Detailed Study Notes",
  "sections": [
    {
      "heading": "Section title",
      "content": "Detailed markdown-capable paragraph(s)...",
      "highlights": ["specific fact 1", "specific fact 2"],
      "diagrams": [
        {
          "type": "process",
          "title": "Short diagram title",
          "caption": "One sentence explaining what the diagram shows",
          "nodes": [
            {"id": "n1", "label": "Step / concept", "detail": "optional short note"},
            {"id": "n2", "label": "Next step"}
          ],
          "edges": [{"from": "n1", "to": "n2", "label": "optional"}]
        }
      ]
    }
  ],
  "qualityScore": 92
}

Allowed diagram types: process, hierarchy, cycle, compare, concept-map.
If a section has no diagram, omit the diagrams field or use [].`;
}

export function buildFallbackDiagram(topicName: string, concepts: string[]): NoteDiagram {
    const nodes = [
        { id: 'n1', label: topicName.slice(0, 36) || 'Topic' },
        ...concepts.slice(0, 4).map((c, i) => ({
            id: `n${i + 2}`,
            label: c.slice(0, 36),
        })),
    ];
    if (nodes.length < 2) {
        nodes.push({ id: 'n2', label: 'Core idea' }, { id: 'n3', label: 'Application' });
    }
    return {
        type: 'hierarchy',
        title: `${topicName} — concept map`,
        caption: `How the main ideas in ${topicName} connect.`,
        nodes,
        edges: nodes.slice(1).map(n => ({ from: 'n1', to: n.id })),
    };
}

export function attachMeta(
    note: GeneratedNote,
    context: NotesGenerationContext,
): GeneratedNote {
    return {
        ...note,
        subjectArea: context.subjectArea,
        gradeLevel: context.gradeLevel,
        chapterName: context.chapterName,
    };
}
