import type { GeneratedNote, MindMap, MindMapNode, Flashcard, GeneratedSummary } from '../types';

/**
 * MOCK GENERATORS
 * These act as fallbacks when AI services are unavailable or for rapid testing.
 */

// ─── NOTES ──────────────────────────────────────────────────────────────────

export const generateMockNotes = (sessionId: string, topicName: string, content: string[]): GeneratedNote => {
    const fullContent = content.join('\n\n');
    const sentences = fullContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyConcepts = extractKeyConcepts(fullContent, topicName);
    const mainPoints = extractMainPoints(fullContent, sentences);
    const sections = generateNoteSections(topicName, fullContent, keyConcepts, mainPoints);

    return {
        id: `note_${Date.now()}`,
        sessionId,
        topicName,
        title: `${topicName} - Comprehensive Study Notes`,
        content: fullContent,
        sections: sections,
        userDoubts: [],
        createdAt: new Date().toISOString(),
        qualityScore: calculateQualityScore(sections, fullContent),
    };
};

function extractKeyConcepts(content: string, topicName: string): string[] {
    const topicWords = topicName.toLowerCase().split(/\s+/);
    const words = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return Array.from(new Set(words)).filter(w =>
        w.length > 3 &&
        !topicWords.some(tw => w.toLowerCase().includes(tw)) &&
        !['The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'How', 'Why'].includes(w)
    ).slice(0, 8);
}

function extractMainPoints(_content: string, sentences: string[]): string[] {
    const keyIndicators = ['important', 'key', 'essential', 'critical', 'fundamental', 'main', 'primary', 'significant'];
    return sentences
        .filter(s => {
            const lower = s.toLowerCase();
            return keyIndicators.some(indicator => lower.includes(indicator)) ||
                (s.length > 50 && s.length < 200);
        })
        .slice(0, 10)
        .map(s => s.trim());
}

function generateNoteSections(topicName: string, _content: string, keyConcepts: string[], mainPoints: string[]): GeneratedNote['sections'] {
    const sections: GeneratedNote['sections'] = [];

    sections.push({
        heading: 'Introduction & Overview',
        content: `This comprehensive guide covers ${topicName}, providing you with essential knowledge and practical insights. ${mainPoints[0] || `Understanding ${topicName} is fundamental to mastering this subject area.`}`,
        highlights: [
            `Core topic: ${topicName}`,
            keyConcepts[0] || 'Fundamental concepts',
            'Practical applications'
        ],
    });

    if (keyConcepts.length > 0) {
        sections.push({
            heading: 'Key Concepts & Definitions',
            content: `The main concepts in ${topicName} include: ${keyConcepts.slice(0, 5).join(', ')}. Each of these plays a crucial role in understanding the broader topic. ${mainPoints[1] || `These concepts form the foundation of ${topicName}.`}`,
            highlights: keyConcepts.slice(0, 5).map(c => `${c}: Essential concept`),
        });
    }

    if (mainPoints.length > 2) {
        sections.push({
            heading: 'Detailed Explanation',
            content: `${mainPoints[2] || `Let's explore ${topicName} in detail.`} ${mainPoints[3] || `Understanding these details is crucial for practical application.`} ${mainPoints[4] || `This knowledge will help you apply these concepts effectively.`}`,
            highlights: ['In-depth understanding required', 'Practical application focus', 'Real-world relevance'],
        });
    }

    sections.push({
        heading: 'Applications & Real-World Examples',
        content: `${topicName} has numerous practical applications. ${mainPoints[5] || `These concepts are used in various professional settings.`} Understanding how to apply this knowledge is essential for success.`,
        highlights: ['Professional applications', 'Real-world scenarios', 'Practical implementation'],
    });

    sections.push({
        heading: 'Key Takeaways & Summary',
        content: `To master ${topicName}, remember: ${mainPoints[6] || `Focus on understanding the core principles.`} ${mainPoints[7] || `Practice applying these concepts regularly.`} These takeaways will help you succeed in this subject area.`,
        highlights: ['Master core principles', 'Regular practice essential', 'Apply knowledge actively'],
    });

    return sections;
}

function calculateQualityScore(sections: GeneratedNote['sections'], content: string): number {
    let score = 70;
    const length = content.trim().length;
    if (length >= 500) score += 8;
    if (length >= 1200) score += 7;
    if (sections.length >= 4) score += 5;
    if (sections.length >= 5) score += 5;
    const totalHighlights = sections.reduce((sum, s) => sum + s.highlights.length, 0);
    if (totalHighlights >= 10) score += 5;
    return Math.min(100, score);
}

// ─── MIND MAP ────────────────────────────────────────────────────────────────

export const generateMockMindMap = (sessionId: string, topicName: string, concepts?: string[]): MindMap => {
    const categories = generateTopicCategories(topicName, concepts);
    const nodes: MindMapNode[] = [
        {
            id: 'central',
            label: topicName,
            type: 'central',
            color: '#8b5cf6',
            children: categories.map((category, index) => ({
                id: `category-${index}`,
                label: category.name,
                type: 'category',
                color: category.color,
                children: category.concepts.map((concept, cIndex: number) => ({
                    id: `concept-${index}-${cIndex}`,
                    label: concept.label,
                    description: concept.description,
                    type: 'concept',
                    color: concept.color,
                    children: [],
                })),
            })),
        },
    ];

    return {
        id: `mindmap_${Date.now()}`,
        sessionId,
        topicName,
        centralTopic: topicName,
        nodes,
        createdAt: new Date().toISOString(),
    };
};

function generateTopicCategories(topicName: string, concepts?: string[]): Array<{ name: string; color: string; concepts: Array<{ label: string; description: string; color: string }> }> {
    const lowerTopic = topicName.toLowerCase();
    const categories: Array<{ name: string; color: string; concepts: Array<{ label: string; description: string; color: string }> }> = [];

    if (lowerTopic.includes('ecg') || lowerTopic.includes('heart') || lowerTopic.includes('cardiac')) {
        categories.push(
            { name: 'Waves & Components', color: '#3b82f6', concepts: [{ label: 'P Wave', description: 'Atrial depolarization', color: '#60a5fa' }, { label: 'QRS Complex', description: 'Ventricular depolarization', color: '#60a5fa' }, { label: 'T Wave', description: 'Ventricular repolarization', color: '#60a5fa' }] },
            { name: 'Intervals', color: '#10b981', concepts: [{ label: 'PR Interval', description: '0.12-0.20 sec', color: '#34d399' }, { label: 'QT Interval', description: 'Varies with HR', color: '#34d399' }, { label: 'RR Interval', description: 'Determines HR', color: '#34d399' }] },
            { name: 'Clinical Applications', color: '#f59e0b', concepts: [{ label: 'Arrhythmias', description: 'Abnormal rhythms', color: '#fbbf24' }, { label: 'Ischemia', description: 'Blood flow issues', color: '#fbbf24' }, { label: 'Electrolyte Issues', description: 'Imbalance detection', color: '#fbbf24' }] }
        );
    } else {
        categories.push(
            { name: 'Fundamentals', color: '#3b82f6', concepts: [{ label: 'Core Concepts', description: 'Basic principles', color: '#60a5fa' }, { label: 'Key Definitions', description: 'Important terms', color: '#60a5fa' }, { label: 'Foundations', description: 'Building blocks', color: '#60a5fa' }] },
            { name: 'Advanced Topics', color: '#10b981', concepts: [{ label: 'Complex Scenarios', description: 'Advanced cases', color: '#34d399' }, { label: 'Specialized Areas', description: 'Niche topics', color: '#34d399' }, { label: 'Expert Level', description: 'Mastery concepts', color: '#34d399' }] },
            { name: 'Applications', color: '#f59e0b', concepts: [{ label: 'Real-World Use', description: 'Practical application', color: '#fbbf24' }, { label: 'Case Studies', description: 'Examples', color: '#fbbf24' }, { label: 'Best Practices', description: 'Recommended approaches', color: '#fbbf24' }] }
        );
    }

    if (concepts && concepts.length > 0) {
        concepts.slice(0, 3).forEach((concept, index) => {
            if (categories[0].concepts[index]) categories[0].concepts[index].label = concept;
        });
    }

    return categories;
}

// ─── FLASHCARDS ─────────────────────────────────────────────────────────────

export const createFlashcard = (
    sessionId: string,
    baseTime: number,
    index: number,
    question: string,
    answer: string,
    explanation: string,
    hint: string,
    difficulty: 'easy' | 'medium' | 'hard',
    tags: string[]
): Flashcard => ({
    id: `fc_${baseTime}_${index}`,
    sessionId,
    question,
    answer,
    explanation,
    hint,
    difficulty,
    tags,
    nextReviewDate: new Date().toISOString(),
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
});

export const generateMockFlashcards = (sessionId: string, topicName?: string, content?: string[]): Flashcard[] => {
    const baseTime = Date.now();
    if (!topicName) {
        return [
            createFlashcard(sessionId, baseTime, 1, 'What is the main concept?', 'The main concept involves understanding fundamental principles', 'This topic covers essential knowledge that forms the foundation for advanced learning.', 'Think about the core principles.', 'easy', ['General']),
            createFlashcard(sessionId, baseTime, 2, 'How is this applied in practice?', 'This is applied through real-world scenarios', 'Practical application involves understanding how theoretical concepts translate to actual situations.', 'Consider real-world examples.', 'medium', ['General']),
        ];
    }

    const lowerTopic = topicName.toLowerCase();
    if (lowerTopic.includes('ecg') || lowerTopic.includes('heart') || lowerTopic.includes('cardiac')) {
        return [
            createFlashcard(sessionId, baseTime, 1, 'What does the P wave represent on an ECG?', 'Atrial depolarization', 'First deflection, electrical split through atria.', 'Atrial action.', 'easy', ['ECG', 'Atrial']),
            createFlashcard(sessionId, baseTime, 2, 'What does the QRS complex represent?', 'Ventricular depolarization', 'Spread through ventricles.', 'Main pumping.', 'easy', ['ECG', 'Ventricular']),
        ];
    }

    // Generic fallback based on content
    const concepts = content ? extractFlashcardConcepts(content) : [];
    return concepts.slice(0, 3).map((c, i) => createFlashcard(
        sessionId, baseTime, i + 1,
        `What is ${c}?`, `${c} is a key concept in ${topicName}`, `Foundational knowledge for ${topicName}.`, `Relates to ${topicName}.`, 'medium', [topicName]
    ));
};

function extractFlashcardConcepts(content: string[]): string[] {
    const fullText = content.join(' ');
    const matches = fullText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return Array.from(new Set(matches)).filter(c => c.length > 3).slice(0, 10);
}

// ─── SUMMARY ────────────────────────────────────────────────────────────────

export const generateMockSummary = (sessionId: string, topicName: string, content: string[]): GeneratedSummary => ({
    id: `sum_${Date.now()}`,
    sessionId,
    topicName,
    title: `${topicName} Executive Summary`,
    overview: content.join(' ').substring(0, 300) + '...',
    keyTakeaways: [
        `Mastered the primary definitions of ${topicName}.`,
        `Explored complex relationships within ${topicName}.`,
        `Analyzed real-world case studies.`,
    ],
    furtherReading: [`Advanced concepts in ${topicName}`, `Historical evolution`, `Latest trends`],
    createdAt: new Date().toISOString(),
});
