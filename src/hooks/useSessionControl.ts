import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useTeachingStore } from '../stores/teachingStore';
import { useSettingsStore, DEFAULT_TTS_LANGUAGE } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { getCourseContent } from '../data/courseRegistry';
import { defaultSteps } from '../data/courses/defaultCourse';
import { findTopicInfo, formatTopicName } from '../utils/topicUtils';
import { ensureSegmentHasVisual, validateSessionVisuals, extractMarkerIdsFromSteps } from '../utils/visualSyncEngine';
import { getVisualsForTopic, validateTopicVisualsForPublish } from '../data/visualRegistry';
import { preloadService } from '../utils/visualPreloadService';
import { studentRoutes } from '../utils/routes';
import { toast } from '../stores/toastStore';
import type { Question } from '../data/competitiveQuestions';
import type { TeachingSession, Topic } from '../types';

/** Theme passed via router state (icon omitted for structured clone). */
type SerializableCompetitiveTheme = {
    color: string;
    bgColor: string;
    gradient: string;
    bgImage: string;
};

export function useSessionControl(topicId: string | undefined) {
    const navigate = useNavigate();
    const location = useLocation();
    
    const {
        currentSession,
        startSession,
    } = useTeachingStore(useShallow(state => ({
        currentSession: state.currentSession,
        startSession: state.startSession,
    })));

    const { settings } = useSettingsStore(useShallow(state => ({ settings: state.settings })));
    const { user } = useAuthStore(useShallow(state => ({ user: state.user })));
    const { profile } = useUserStore(useShallow(state => ({ profile: state.profile })));

    const [topicUnavailable, setTopicUnavailable] = useState(false);
    const [isPreloading, setIsPreloading] = useState(false);
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        return () => {
            // Latest timeout ids at unmount (not a render-cycle ref to a DOM node)
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const ids = timeoutRefs.current;
            ids.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        const init = async () => {
            if (!topicId) {
                toast.warning('No topic selected. Redirecting to dashboard...');
                const redirectTimeoutId = setTimeout(() => navigate(studentRoutes.dashboard), 2000);
                timeoutRefs.current.push(redirectTimeoutId);
                return;
            }

            const targetLanguage = settings.accessibility?.ttsLanguage || DEFAULT_TTS_LANGUAGE;
            const stateData = location.state as
                | { competitiveQuestion?: Question; theme?: SerializableCompetitiveTheme }
                | undefined;

            // Competitive Intercept
            if (stateData?.competitiveQuestion && topicId?.startsWith('competitive-')) {
                const question = stateData.competitiveQuestion;
                setTopicUnavailable(false);

                const steps = (question.explanation || '').split('\n').filter((s: string) => s.trim().length > 0);
                const formattedExplanation = steps.length > 0
                    ? steps.map((s: string, i: number) => `**Step ${i + 1}:** ${s.trim()}`).join('\n\n')
                    : (question.explanation || '');

                const teachingSteps = [
                    {
                        id: `step-${question.id}-concept`,
                        stepNumber: 1,
                        title: 'Concept Overview',
                        content: `### Topic: ${question.topic}\n\nThis problem tests your understanding of **${question.topic}**.\n\nLet us understand the key concept before solving the problem step-by-step.`,
                        spokenContent: `Hello! Today we are going to solve a ${question.difficulty} level question on the topic of ${question.topic}. Let me first explain the key concept behind this problem.`,
                        visualType: 'text' as const,
                        visualDomain: 'competitive',
                        durationSeconds: 60,
                        completed: false,
                        complexity: 'intermediate' as const
                    },
                    {
                        id: `step-${question.id}-solution`,
                        stepNumber: 2,
                        title: 'Step-by-Step Solution',
                        content: `### Question:\n${question.text}\n\n---\n\n### Solution:\n${formattedExplanation}`,
                        spokenContent: `Now let us solve the problem step by step. The question asks: ${question.text}. ${steps.length > 0 ? steps.join('. ') : (question.explanation || '')}`,
                        visualType: 'text' as const,
                        visualDomain: 'competitive',
                        durationSeconds: 120,
                        completed: false,
                        complexity: question.difficulty === 'Hard' ? 'advanced' as const : (question.difficulty === 'Medium' ? 'intermediate' as const : 'basic' as const)
                    },
                    {
                        id: `step-${question.id}-answer`,
                        stepNumber: 3,
                        title: 'Final Answer & Verification',
                        content: `### All Options:\n${question.options.map((opt: string, idx: number) => `**${String.fromCharCode(65 + idx)}.** ${opt}`).join('\n')}\n\n---\n\n### ✅ Correct Answer: **${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}**`,
                        spokenContent: `Now let us verify the answer. The correct answer is Option ${String.fromCharCode(65 + question.correctAnswer)}: ${question.options[question.correctAnswer]}.`,
                        visualType: 'text' as const,
                        visualDomain: 'competitive',
                        durationSeconds: 45,
                        completed: false,
                        complexity: 'basic' as const
                    }
                ];

                startSession({
                    id: 'session_' + Date.now(),
                    userId: user?.id || 'user_1',
                    topicId: topicId,
                    topicName: `${question.topic} – Competitive Q&A`,
                    startTime: new Date().toISOString(),
                    status: 'active',
                    currentStep: 0,
                    totalSteps: teachingSteps.length,
                    progress: 0,
                    teachingSteps: teachingSteps,
                    doubts: [],
                    language: targetLanguage,
                });
                return;
            }

            // Resume or Regenerate
            if (currentSession?.topicId === topicId) {
                if (currentSession.language === targetLanguage) {
                    return;
                }
            }

            const topicContext = findTopicInfo(topicId);
            const registryEntry = getVisualsForTopic(topicId);
            
            if (!registryEntry || !topicContext.topic) {
                setTopicUnavailable(true);
                return;
            }

            const topicName = topicContext.topic.name || formatTopicName(topicId || '');
            const topicDescription = (topicContext.topic as Topic)?.description;
            const subjectArea = topicContext.subjectName;
            const streamName = topicContext.streamName;
            const topicDomain = registryEntry.domain;

            setTopicUnavailable(false);

            let teachingSteps = await getCourseContent(
                topicId,
                topicName,
                topicDescription,
                subjectArea || undefined,
                registryEntry.topic_id,
                streamName || undefined,
                targetLanguage
            ) || [];

            teachingSteps = teachingSteps.map(step => ({ ...step, visualDomain: topicDomain }));

            // Profession enhancement
            const userProfession = profile?.profession?.name;
            if (userProfession && teachingSteps.length > 0) {
                const welcomeStep = teachingSteps[0];
                if (welcomeStep && welcomeStep.id.includes('intro')) {
                    const professionText = `As someone in ${userProfession}, you'll find this particularly relevant.`;
                    teachingSteps[0] = {
                        ...welcomeStep,
                        content: `${welcomeStep.content}\n\n${professionText}`,
                        spokenContent: `${welcomeStep.spokenContent} ${professionText}`,
                    };
                }
            }

            if (teachingSteps.length === 0) {
                teachingSteps = defaultSteps;
                toast.warning(`Using default content for ${topicName}.`);
            }

            teachingSteps = teachingSteps.map((step, i) => ensureSegmentHasVisual(step, topicId || '', i));
            
            // Visual validation
            validateSessionVisuals({
                id: 'preview',
                userId: user?.id || 'user_1',
                topicId: topicId || '',
                topicName: topicName || '',
                startTime: new Date().toISOString(),
                status: 'active',
                currentStep: 0,
                totalSteps: teachingSteps.length,
                progress: 0,
                teachingSteps,
                doubts: [],
            });

            const markerIds = extractMarkerIdsFromSteps(teachingSteps);
            if (registryEntry) {
                validateTopicVisualsForPublish(registryEntry, markerIds);
            }

            const finalSession: TeachingSession = {
                id: 'session_' + Date.now(),
                userId: user?.id || 'user_1',
                topicId: topicId,
                topicName: topicName,
                startTime: new Date().toISOString(),
                status: 'active',
                currentStep: 0,
                totalSteps: teachingSteps.length,
                progress: 0,
                teachingSteps: teachingSteps,
                doubts: [],
                language: targetLanguage,
            };

            // Preload and Start
            if (registryEntry) {
                setIsPreloading(true);
                try {
                    await preloadService.warmUpVisuals(topicId);
                    await preloadService.preloadPriorityVisuals(registryEntry, 1);
                } finally {
                    setIsPreloading(false);
                    startSession(finalSession);
                }
            } else {
                startSession(finalSession);
            }
        };

        init();
    // Intentionally narrow deps: full store/session deps would re-run init too often and fight startSession.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- topic + TTS language + navigation state drive session bootstrap
    }, [topicId, settings.accessibility?.ttsLanguage, location.state?.competitiveQuestion?.id, location.state?.theme?.color]);

    return { topicUnavailable, isPreloading };
}
