import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useTeachingStore } from '../stores/teachingStore';
import { useResourceStore } from '../stores/resourceStore';
import { useDoubtStore } from '../stores/doubtStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { useAnalyticsStore } from '../stores/analyticsStore';
const NotesViewer = lazy(() => import('../components/studio/NotesViewer'));
const MindMapViewer = lazy(() => import('../components/studio/MindMapViewer'));
const FlashcardViewer = lazy(() => import('../components/studio/FlashcardViewer'));
const VerificationQuiz = lazy(() => import('../components/teaching/VerificationQuiz'));
const QuizVisual = lazy(() => import('../components/teaching/QuizVisual'));
const SummaryViewer = lazy(() => import('../components/studio/SummaryViewer'));
const AnalyzerViewer = lazy(() => import('../components/studio/AnalyzerViewer'));
import { useSpeech, unlockAudioContext } from '../hooks/useSpeech';
import { useSessionControl } from '../hooks/useSessionControl';
import type { ChatMessage, Topic } from '../types';

type StudioTabId = 'notes' | 'map' | 'flashcards' | 'quiz' | 'summary' | 'analyzer';
import {
    ChevronLeft, ChevronRight, Square, Maximize2, Minimize2, Settings, HelpCircle,
    FileText, CreditCard, Sparkles, Loader2, MessageCircle, Layers,
    Map as LucideMap, ArrowUp, Volume2, VolumeX, Home, Scan
} from 'lucide-react';
const QuizViewer = lazy(() => import('../components/studio/QuizViewer'));
import { toast } from '../stores/toastStore';
import { studentRoutes } from '../utils/routes';
const SettingsPage = lazy(() => import('./SettingsPage'));
const ProfilePage = lazy(() => import('./ProfilePage'));
import { aiService } from '../services/aiService';
import { extractTextFromFile } from '../utils/documentParser';
const DiagramCanvas = lazy(() => import('../components/teaching/DiagramCanvas'));
import Breadcrumbs, { BreadcrumbItem } from '../components/common/Breadcrumbs';
import EmojiMascot from '../components/mascot/EmojiMascot';
import { findTopicInfo } from '../utils/topicUtils';
import { GREEN_BOARD_FADE_DURATION_MS, subscribeToVisualMarkers } from '../utils/visualSyncEngine';
import { getFirstActiveDiagramId, getVisualsForTopic, parseDiagramMarkerKey } from '../data/visualRegistry';
import { isImageLikeFile } from '../utils/imageVision';


export default function TeachingPage() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<'none' | 'settings' | 'profile'>('none');

    const {
        currentSession,
        currentStep,
        isPaused,
        isSpeaking,
        pause,
        resume,
        isInDoubtMode,
    } = useTeachingStore(useShallow(state => ({
        currentSession: state.currentSession,
        currentStep: state.currentStep,
        isPaused: state.isPaused,
        isSpeaking: state.isSpeaking,
        pause: state.pause,
        resume: state.resume,
        isInDoubtMode: state.isInDoubtMode
    })));
    const { user, role } = useAuthStore(useShallow(state => ({ user: state.user, role: state.role })));

    const {
        notes,
        mindMaps,
        flashcards,
        isGeneratingNotes,
        isGeneratingMindMap,
        isGeneratingFlashcards,
        generateNotes,
        generateMindMap,
        generateFlashcards,
        updateFlashcardPerformance,
        summaries,
        isGeneratingSummary,
        generateSummary,
        analyzedImage,
        isAnalyzing,
    } = useResourceStore(useShallow(state => ({
        notes: state.notes,
        mindMaps: state.mindMaps,
        flashcards: state.flashcards,
        isGeneratingNotes: state.isGeneratingNotes,
        isGeneratingMindMap: state.isGeneratingMindMap,
        isGeneratingFlashcards: state.isGeneratingFlashcards,
        generateNotes: state.generateNotes,
        generateMindMap: state.generateMindMap,
        generateFlashcards: state.generateFlashcards,
        updateFlashcardPerformance: state.updateFlashcardPerformance,
        summaries: state.summaries,
        isGeneratingSummary: state.isGeneratingSummary,
        generateSummary: state.generateSummary,
        analyzedImage: state.analyzedImage,
        isAnalyzing: state.isAnalyzing,
    })));

    const {
        showVerificationQuiz,
        currentQuiz,
        hideQuiz,
        confirmUnderstanding,
        activeDoubt,
    } = useDoubtStore(useShallow(state => ({
        showVerificationQuiz: state.showVerificationQuiz,
        currentQuiz: state.currentQuiz,
        hideQuiz: state.hideQuiz,
        confirmUnderstanding: state.confirmUnderstanding,
        activeDoubt: state.activeDoubt
    })));

    const { addSession } = useAnalyticsStore();
    const [sessionStartTime] = useState<number>(Date.now());

    const { settings } = useSettingsStore(useShallow(state => ({ settings: state.settings })));
    const reduceAnimations = settings?.accessibility?.reduceAnimations ?? false;
    const { profile } = useUserStore(useShallow(state => ({ profile: state.profile })));
    // Get user's profession and sub-profession for contextual teaching

    // Initialize chat with contextual greeting based on topic
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    /** Only reset chat when the route topic changes — not when session reloads, TTS language, or profile hydrates. */
    const chatSeededForTopicIdRef = useRef<string | null>(null);

    // Set initial chat message when topic loads (once per topicId)
    useEffect(() => {
        if (!topicId) {
            chatSeededForTopicIdRef.current = null;
            setChatMessages([]);
            return;
        }
        if (!currentSession?.topicName) return;

        if (chatSeededForTopicIdRef.current === topicId) return;

        chatSeededForTopicIdRef.current = topicId;
        const professionContext = profile?.profession?.name
            ? ` As someone in ${profile.profession.name}, I'll tailor the explanations to your field.`
            : '';
        setChatMessages([{
            id: `welcome-${topicId}`,
            type: 'ai',
            content: `Hello! I'm here to help you learn ${currentSession.topicName}.${professionContext} Feel free to ask any questions as we go through the lesson!`,
            timestamp: new Date().toISOString()
        }]);
    }, [topicId, currentSession?.topicName, profile?.profession?.name]);

    const [inputMessage, setInputMessage] = useState('');
    // Chat file upload state
    const [uploadedChatFiles, setUploadedChatFiles] = useState<Array<{ name: string; dataUrl?: string; type: string }>>([]);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    // Studio Panel viewer state
    const [studioInViewer, setStudioInViewer] = useState(false);
    // Hard Rule 15 — activeDiagramId drives DiagramCanvas; optional sub-part for SVG sync (e.g. mitochondria)
    const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
    const [activeHighlightPart, setActiveHighlightPart] = useState<string | null>(null);
    const [lastUserAction, setLastUserAction] = useState<string | null>(null);
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
    const isMountedRef = useRef(true);
    const [isMobile, setIsMobile] = useState(false);
    const [playbackTrigger, setPlaybackTrigger] = useState(0);
    /** True after user clicks Stop listening / board stop — Resume must bump playbackTrigger to restart TTS. */
    const needsPlaybackRestartRef = useRef(false);

    useEffect(() => {
        needsPlaybackRestartRef.current = false;
    }, [topicId]);

    const currentStepData = currentSession?.teachingSteps?.[currentStep] ?? null;
    const attachmentStillLoading = uploadedChatFiles.some(f => !f.dataUrl);
    const { topicUnavailable, isPreloading } = useSessionControl(topicId);
    const { isMuted, setIsMuted, isFetchingAudio } = useSpeech(currentStepData, playbackTrigger);

    useEffect(() => {
        const handleFallbackNotice = (e: Event) => {
            const msg = (e as CustomEvent).detail?.message;
            if (msg) toast.info(msg);
        };
        window.addEventListener('tts-fallback-notice', handleFallbackNotice);
        return () => window.removeEventListener('tts-fallback-notice', handleFallbackNotice);
    }, []);

    // Visual Freeze Guarantee: Strictly pause all animations when paused
    useEffect(() => {
        if (isPaused || isInDoubtMode || isPreloading) {
            document.body.classList.add('visual-freeze-active');
        } else {
            document.body.classList.remove('visual-freeze-active');
        }
        return () => {
            document.body.classList.remove('visual-freeze-active');
        };
    }, [isPaused, isInDoubtMode, isPreloading]);

    // Extract user context for stable dependencies

    // Topic info (subject area + grade level) hoisted to component scope for use in all generators
    const topicInfo = useMemo(() => {
        try {
            const info = findTopicInfo(currentSession?.topicId ?? '');
            const topic = info.topic as Topic | null;
            return {
                subjectArea: info.subjectName ?? null,
                gradeLevel: info.streamName ?? null,
                topicDescription: topic?.description,
                chapterName: info.chapterName,
                subjectDescription: info.subjectDescription,
            };
        } catch {
            return {
                subjectArea: null,
                gradeLevel: null,
                topicDescription: undefined as string | undefined,
                chapterName: undefined as string | undefined,
                subjectDescription: undefined as string | undefined,
            };
        }
    }, [currentSession?.topicId]);

    // Mobile panel state (local) - Only one panel visible on mobile at a time
    // Mobile panel state (local) - Only one panel visible on mobile at a time
    // 'home' = Pre-teaching state (chat/questions), 'teach' = Teaching panel (default), 'studio' = Post-teaching resources
    const [mobilePanel, setMobilePanel] = useState<'home' | 'teach' | 'studio'>('teach');
    const [activeStudioTab, setActiveStudioTab] = useState<StudioTabId>('notes');
    // Panel visibility states for minimize/maximize
    const [centerPanelVisible, setCenterPanelVisible] = useState(true);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);
    // Panel maximize states
    const [centerMaximized, setCenterMaximized] = useState(false);
    const [rightMaximized, setRightMaximized] = useState(false);
    // Store previous visibility states before maximizing
    // (Removed in favor of purely CSS flex-based collapsing)
    const [completedQuizCount, setCompletedQuizCount] = useState(2); // Starting with 2 as per user request example

    // Resources for session
    const sessionId = currentSession?.id || '';
    const sessionNotes = notes.filter(n => n.sessionId === sessionId);
    const sessionMindMaps = mindMaps.filter(m => m.sessionId === sessionId);
    const sessionFlashcards = flashcards.filter(f => f.sessionId === sessionId);
    const sessionSummaries = summaries.filter(s => s.sessionId === sessionId);

    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current = [];

            // Log flight time when leaving the teaching page
            const duration = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000));
            if (duration >= 1) { // Only log if they spent at least a minute
                useAnalyticsStore.getState().addSession({
                    sessionId: `session_exit_${Date.now()}`,
                    date: new Date().toISOString(),
                    durationMinutes: duration,
                    topicId: topicId || 'unknown',
                    completionPercentage: Math.round(useTeachingStore.getState().getProgress()) || 0,
                    doubtsCount: useTeachingStore.getState().currentSession?.doubts?.length || 0,
                    quizScore: 0
                });
            }
        };
    }, [topicId, sessionStartTime]);

    // Visual Sync Engine: bridge from AI narration markers to green board state
    useEffect(() => {
        const unsub = subscribeToVisualMarkers((marker) => {
            if (!marker) return;
            
            // Handle explicit TEXT: markers
            if (marker.startsWith('TEXT:')) {
                setActiveHighlightPart(marker.substring(5));
                return;
            }
            
            const { lookupKey, highlightPart } = parseDiagramMarkerKey(marker);
            
            // Diagram switch + highlight part (e.g. concept_1.diagram_1.nucleus)
            if (lookupKey.includes('.')) {
                setActiveDiagramId(lookupKey);
                setActiveHighlightPart(highlightPart);
            } 
            // Simple keyword marker (e.g. 'nucleus', 'mitochondria') to highlight in current diagram
            else if (lookupKey) {
                setActiveHighlightPart(lookupKey);
            }
        });
        return unsub;
    }, []);

    // Reset activeVisual and activeDiagramId when step changes (Hard Rule 17: start from first concept)
    useEffect(() => {
        // setActiveVisual(null);
        // Reset to first concept diagram for this topic on step change
        const firstId = topicId ? getFirstActiveDiagramId(topicId) : null;
        setActiveDiagramId(firstId);
        setActiveHighlightPart(null);
    }, [currentStep, topicId]);

    // Speech logic moved to useSpeech hook



    const handleSendMessage = async () => {
        if (!inputMessage.trim() && uploadedChatFiles.length === 0) return;
        if (uploadedChatFiles.some(f => !f.dataUrl)) {
            toast.info('Please wait for your file or image to finish loading.');
            return;
        }
        if (isChatLoading) return;

        // Visual feedback for user action
        const actionTimeoutId = setTimeout(() => setLastUserAction(null), 2000);
        timeoutRefs.current.push(actionTimeoutId);
        setLastUserAction('message-sent');

        // Build message content with file info
        let messageContent = inputMessage.trim();
        if (uploadedChatFiles.length > 0) {
            const fileNames = uploadedChatFiles.map(f => f.name).join(', ');
            messageContent = messageContent
                ? `${messageContent}\n\n[Attached: ${fileNames}]`
                : `[Attached: ${fileNames}]`;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: messageContent,
            timestamp: new Date().toISOString(),
        };

        const sentMessage = inputMessage.trim();
        const sentFiles = uploadedChatFiles;
        setChatMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setUploadedChatFiles([]);
        setIsChatLoading(true);

        // Last 6 turns including this user message (fixes stale closure from pre-update chatMessages)
        const historySnapshot = [...chatMessages, userMessage].slice(-6).map(m => ({
            role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.content,
        }));

        try {
            let aiText: string;

            // ── DOCUMENT / IMAGE PATH ────────────────────────────────────────────
            // When files are attached, bypass the sendChatMessage classifier entirely.
            // Route directly to answerDocumentQuestion so the AI always uses file content.
            if (sentFiles.length > 0) {
                const question = sentMessage || 'Please explain the content of this file.';

                const imageStillLoading = sentFiles.some(f => isImageLikeFile(f) && !f.dataUrl);
                if (imageStillLoading) {
                    aiText = 'Your image is still loading. Please wait a second and send again.';
                } else {
                    // Priority 1: image file (vision AI) — use MIME or extension (MIME is often empty on mobile)
                    const imageFile = sentFiles.find(f => isImageLikeFile(f) && f.dataUrl);
                    if (imageFile?.dataUrl) {
                        aiText = await aiService.answerDocumentQuestion(`__IMAGE_BASE64__${imageFile.dataUrl}`, question);
                    } else {
                        // Priority 2: text doc (PDF / DOCX / TXT already parsed into dataUrl field)
                        const docFile = sentFiles.find(f => !isImageLikeFile(f) && f.dataUrl);
                        if (docFile?.dataUrl) {
                            aiText = await aiService.answerDocumentQuestion(docFile.dataUrl, question);
                        } else {
                            aiText = 'Your file is still being processed. Please wait a moment and try again.';
                        }
                    }
                }
            } else {
                // ── REGULAR CHAT PATH (no files) ─────────────────────────────────
                aiText = await aiService.sendChatMessage({
                    userMessage: sentMessage,
                    topicName: currentSession?.topicName ?? null,
                    chapterName: topicInfo.chapterName ?? null,
                    stepTitle: currentStepData?.title ?? null,
                    stepContent: currentStepData?.content ?? '',
                    subjectArea: topicInfo.subjectArea,
                    gradeLevel: topicInfo.gradeLevel,
                    conversationHistory: historySnapshot,
                    userProfession: profile?.profession?.name ?? null,
                });
            }

            if (!isMountedRef.current) return;

            const aiResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: aiText,
                timestamp: new Date().toISOString(),
            };
            setChatMessages(prev => [...prev, aiResponse]);
        } catch (err) {
            if (!isMountedRef.current) return;
            console.warn('[TeachingPage] Chat request failed:', err);
            const fallbackResponse: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `Sorry, I had trouble connecting to the AI service. Please try again in a moment!`,
                timestamp: new Date().toISOString(),
            };
            setChatMessages(prev => [...prev, fallbackResponse]);
        } finally {
            if (isMountedRef.current) setIsChatLoading(false);
        }
    };

    // Cleanup all timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
            timeoutRefs.current = [];
        };
    }, []);

    // Track mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768; // md breakpoint
            setIsMobile(mobile);
            // On mobile, ensure body doesn't scroll
            if (mobile) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
            document.body.style.overflow = '';
        };
    }, []);

    // Mobile should be single-panel, full-screen: disable desktop-only panel controls
    useEffect(() => {
        if (!isMobile) return;
        // Force panels back to their default visible/non-maximized state on mobile
        setCenterMaximized(false);
        setRightMaximized(false);
        setCenterPanelVisible(true);
        setRightPanelVisible(true);
    }, [isMobile]);



    const handleGenerateNotes = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate notes from.');
            return;
        }
        try {
            // Extract comprehensive content including spoken content for richer notes
            const content = currentSession.teachingSteps
                .map(s => {
                    // Combine content and spokenContent for comprehensive notes
                    const parts = [];
                    if (s.content) parts.push(s.content);
                    if (s.spokenContent && s.spokenContent !== s.content) {
                        parts.push(s.spokenContent);
                    }
                    return parts.join('\n\n');
                })
                .filter(Boolean);

            if (content.length === 0) {
                toast.warning('No content available to generate notes from.');
                return;
            }
            await generateNotes(currentSession.id, currentSession.topicName, content);
            setActiveStudioTab('notes');
            setStudioInViewer(true);
        } catch (error) {
            toast.error('Failed to generate notes. Please try again.');
            console.error('Error generating notes:', error);
        }
    };

    const handleGenerateMindMap = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate mind map from.');
            return;
        }
        try {
            const concepts = currentSession.teachingSteps.map(s => s.title).filter(Boolean);
            const lessonContent = currentSession.teachingSteps.map(s => s.content || '').filter(Boolean);
            if (concepts.length === 0) {
                toast.warning('No concepts available to generate mind map from.');
                return;
            }
            await generateMindMap(
                currentSession.id,
                currentSession.topicName,
                topicInfo.subjectArea || 'General',
                topicInfo.gradeLevel || 'School',
                concepts,
                lessonContent
            );
            setActiveStudioTab('map');
            setStudioInViewer(true);
        } catch (error) {
            toast.error('Failed to generate mind map. Please try again.');
            console.error('Error generating mind map:', error);
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate flashcards from.');
            return;
        }
        try {
            // Extract comprehensive content for better flashcard generation
            const content = currentSession.teachingSteps
                .map(s => {
                    const parts = [];
                    if (s.content) parts.push(s.content);
                    if (s.spokenContent && s.spokenContent !== s.content) {
                        parts.push(s.spokenContent);
                    }
                    // Include key concepts if available
                    if (s.keyConcepts && s.keyConcepts.length > 0) {
                        parts.push(`Key concepts: ${s.keyConcepts.join(', ')}`);
                    }
                    return parts.join('\n\n');
                })
                .filter(Boolean);

            if (content.length === 0) {
                toast.warning('No content available to generate flashcards from.');
                return;
            }
            await generateFlashcards(
                currentSession.id,
                currentSession.topicName,
                topicInfo.subjectArea || 'General',
                topicInfo.gradeLevel || 'School',
                content
            );
            setActiveStudioTab('flashcards');
            setStudioInViewer(true);
        } catch (error) {
            toast.error('Failed to generate flashcards. Please try again.');
            console.error('Error generating flashcards:', error);
        }
    };

    const handleGenerateSummary = async () => {
        if (!currentSession || !currentSession.teachingSteps || currentSession.teachingSteps.length === 0) {
            toast.warning('No content available to generate summary from.');
            return;
        }
        try {
            const content = currentSession.teachingSteps
                .map(s => {
                    const parts = [];
                    if (s.content) parts.push(s.content);
                    if (s.spokenContent && s.spokenContent !== s.content) {
                        parts.push(s.spokenContent);
                    }
                    return parts.join('\n\n');
                })
                .filter(Boolean);

            if (content.length === 0) {
                toast.warning('No content available to generate summary from.');
                return;
            }
            await generateSummary(currentSession.id, currentSession.topicName, content);
            setActiveStudioTab('summary');
            setStudioInViewer(true);
        } catch (error) {
            toast.error('Failed to generate summary. Please try again.');
            console.error('Error generating summary:', error);
        }
    };


    if (isPreloading) {
        return (
            <div className={`h-full w-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 ${isMobile ? 'pt-safe-top' : ''}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-indigo-900">Verifying Visual Assets</h3>
                    <p className="text-indigo-600/60 font-medium">Ensuring high-fidelity experience...</p>
                </div>
            </div>
        );
    }

    if (topicId && topicUnavailable) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center p-4 safe-top safe-bottom safe-x min-h-[100dvh]" style={{ background: 'var(--teaching-page-gradient-start)' }}>
                <p className="text-gray-700 dark:text-slate-200 font-medium mb-4 text-center text-sm sm:text-base">This topic is not available.</p>
                <button
                    onClick={() => navigate(studentRoutes.dashboard)}
                    className="touch-target px-5 py-3 rounded-xl text-white font-medium transition-colors min-h-[44px]"
                    style={{ backgroundColor: 'var(--teaching-accent)' }}
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }


    return (
        <div
            className={`flex flex-col overflow-hidden w-full ${isMobile ? 'fixed inset-0 min-h-[100dvh]' : 'h-screen min-h-[100dvh]'}`}
            style={{
                background: `linear-gradient(135deg, var(--teaching-page-gradient-start) 0%, var(--teaching-page-gradient-end) 100%)`,
            }}
        >
            <header
                className="flex items-center justify-between sticky top-0 z-50 shrink-0 border-b border-transparent safe-top"
                style={{
                    height: 'clamp(48px, 10vh, 64px)',
                    paddingLeft: 'max(var(--teaching-content-padding-x), var(--safe-left))',
                    paddingRight: 'max(var(--teaching-content-padding-x), var(--safe-right))',
                    background: 'var(--teaching-header-bg)',
                    backdropFilter: 'saturate(180%) blur(12px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
                }}
            >
                <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate(studentRoutes.dashboard)}
                            className="touch-target p-2 rounded-xl text-[var(--teaching-panel-text)] hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label="Home"
                        >
                            <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(studentRoutes.dashboard)}
                            className="shrink-0 cursor-pointer hidden sm:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-purple-100 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 transition-all active:scale-95"
                            aria-label="Home"
                            title="Go to Dashboard"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <Breadcrumbs
                            role={role}
                            homePath={studentRoutes.dashboard}
                            items={((): BreadcrumbItem[] => {
                                const ctx = findTopicInfo(topicId);
                                const items: BreadcrumbItem[] = [];
                                if (ctx.type === 'curriculum') {
                                    items.push({
                                        label: 'Curriculum',
                                        onClick: () => navigate(studentRoutes.curriculum)
                                    });
                                    if (ctx.streamName && ctx.gradeId) {
                                        items.push({
                                            label: ctx.streamName,
                                            onClick: () => navigate(studentRoutes.curriculum, { state: { gradeId: ctx.gradeId } })
                                        });
                                    }
                                    if (ctx.subjectName && ctx.gradeId && ctx.subjectId) {
                                        items.push({
                                            label: ctx.subjectName,
                                            onClick: () => navigate(studentRoutes.curriculum, { state: { gradeId: ctx.gradeId, subjectId: ctx.subjectId } })
                                        });
                                    }
                                    if (ctx.topic) items.push({ label: ctx.topic.name });
                                } else {
                                    if (ctx.streamName) items.push({ label: ctx.streamName });
                                    if (ctx.subjectName) items.push({ label: ctx.subjectName });
                                    if (ctx.topic) items.push({ label: ctx.topic.name });
                                }
                                return items;
                            })()}
                            className="hidden sm:flex"
                        />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                if (isMuted) {
                                    unlockAudioContext();
                                } else if (typeof window !== 'undefined' && window.speechSynthesis) {
                                    window.speechSynthesis.cancel();
                                }
                                setIsMuted((m) => !m);
                            }}
                            className="touch-target p-2 rounded-xl text-[var(--teaching-panel-text)] hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-green-600" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModal('settings')}
                            className="touch-target p-2 rounded-xl text-[var(--teaching-panel-text)] hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label="Settings"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5 shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveModal('profile')}
                            className="touch-target w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white font-medium text-[15px] hover:opacity-90 transition-opacity shrink-0 ml-1 cursor-pointer"
                            style={{ backgroundColor: 'var(--teaching-avatar-red)' }}
                            aria-label="Profile"
                        >
                            {user?.name?.[0]?.toUpperCase() || 'A'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Panel Tabs — single-column switching, touch-friendly */}
            <div className="md:hidden flex bg-white/70 dark:bg-slate-900/80 z-20 relative safe-x padding-safe-top" style={{ paddingBottom: 'var(--space-xs)' }}>
                {[
                    { id: 'home', icon: MessageCircle, label: 'Chat' },
                    { id: 'teach', icon: Sparkles, label: 'Teaching' },
                    { id: 'studio', icon: Layers, label: 'Studio' },
                ].map((panel) => (
                    <button
                        key={panel.id}
                        onClick={() => setMobilePanel(panel.id as typeof mobilePanel)}
                        className={`flex-1 py-3 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-all min-h-[48px] rounded-xl touch-manipulation ${mobilePanel === panel.id
                            ? 'text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        aria-label={`Switch to ${panel.label} panel`}
                        aria-pressed={mobilePanel === panel.id}
                    >
                        <panel.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span>{panel.label}</span>
                    </button>
                ))}
            </div>

            <main
                className={`flex-1 flex flex-col min-h-0 w-full ${isMobile ? 'min-h-[50vh]' : ''}`}
                style={{ overflow: 'hidden' }}
            >
                <motion.div
                    layout
                    className={`flex-1 w-full flex overflow-y-auto overflow-x-hidden lg:overflow-hidden relative min-h-0 ${isMobile ? 'flex-col' : 'lg:flex-row flex-col items-stretch'}`}
                    animate={isMobile ? {} : {
                        paddingTop: (centerMaximized || rightMaximized) ? 0 : 'var(--teaching-content-margin-y)',
                        paddingBottom: (centerMaximized || rightMaximized) ? 0 : 'var(--teaching-content-margin-y)',
                        paddingLeft: (centerMaximized || rightMaximized) ? 0 : 'max(var(--teaching-content-padding-x), var(--safe-left))',
                        paddingRight: (centerMaximized || rightMaximized) ? 0 : 'max(var(--teaching-content-padding-x), var(--safe-right))',
                        gap: (centerMaximized || rightMaximized) ? 0 : 'var(--teaching-panels-gap)',
                        background: (centerMaximized || rightMaximized) ? 'var(--teaching-panel-bg)' : 'transparent',
                    }}
                    style={isMobile ? { minHeight: 0, paddingLeft: 'var(--safe-left)', paddingRight: 'var(--safe-right)' } : {
                        height: '100%',
                        minHeight: 0,
                        position: 'relative',
                    }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                >
                    {/* ═══════════════════════ CHAT PANEL (Left — 23%) ═══════════════════════ */}
                    {/* Positioned middle in tablet stack (order-2) */}
                    <motion.div
                        layout
                        initial={isMobile ? { opacity: 0 } : { opacity: 1, flex: '23 23 0%' }}
                        animate={isMobile ? { opacity: mobilePanel === 'home' ? 1 : 0 } : {
                            opacity: (centerMaximized || rightMaximized) ? 0 : 1,
                            flex: (centerMaximized || rightMaximized) ? '0 0 0px' : '23 23 0%',
                        }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className={`${isMobile ? 'absolute inset-0 w-full h-full' : 'relative min-w-0'} flex flex-col z-30 lg:z-auto order-2 lg:order-1 ${mobilePanel === 'home' ? 'flex' : 'hidden lg:flex md:flex'}`}
                        style={isMobile ? {
                            display: mobilePanel === 'home' ? 'flex' : 'none',
                            pointerEvents: mobilePanel === 'home' ? 'auto' : 'none'
                        } : {
                            background: 'var(--teaching-panel-bg)',
                            borderRadius: 'var(--teaching-panel-radius)',
                            boxShadow: 'var(--teaching-panel-shadow)',
                            overflow: 'hidden',
                            minHeight: 0,
                            alignSelf: 'stretch',
                            padding: 0,
                        }}
                    >
                        {/* Panel Header — centered title, 56–64px, divider */}
                        <div
                            className="hidden md:flex items-center justify-center shrink-0 border-b bg-transparent"
                            style={{
                                minHeight: '56px',
                                height: 'clamp(48px, 8vh, 60px)',
                                borderColor: 'var(--teaching-panel-divider)',
                                borderRadius: 'var(--teaching-panel-radius) var(--teaching-panel-radius) 0 0',
                            }}
                        >
                            <h2 className="text-base sm:text-lg font-medium text-[var(--teaching-panel-text)] truncate px-2" style={{ letterSpacing: '0.01em' }}>Chat Panel</h2>
                        </div>

                        {/* Chat Messages — scrollable, responsive padding */}
                        <div
                            className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 sm:space-y-4 min-h-0"
                            style={{ padding: 'clamp(12px, 3vw, var(--space-lg))' }}
                        >
                            {chatMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={reduceAnimations ? false : { opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: reduceAnimations ? 0 : 0.25, ease: 'easeOut' }}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm break-words ${msg.type === 'user'
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl rounded-br-md shadow-sm'
                                        : 'bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-md text-gray-700 dark:text-gray-100'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {/* AI Thinking indicator */}
                            {isChatLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" />
                                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow [animation-delay:0.15s]" />
                                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow [animation-delay:0.3s]" />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Chat Input Bar — seamless responsive pill with file upload */}
                        <div
                            className="shrink-0 border-t"
                            style={{
                                padding: '10px 12px',
                                borderColor: 'var(--teaching-panel-divider)',
                                background: 'var(--teaching-panel-bg)',
                            }}
                        >
                            {/* File preview chips */}
                            {uploadedChatFiles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {uploadedChatFiles.map((f, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 text-xs text-purple-700 max-w-[140px]">
                                            {f.type.startsWith('image/') && f.dataUrl
                                                ? <img src={f.dataUrl} alt={f.name} className="w-5 h-5 rounded object-cover shrink-0" />
                                                : <FileText className="w-3.5 h-3.5 shrink-0" />
                                            }
                                            <span className="truncate">{f.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setUploadedChatFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-purple-400 hover:text-purple-700 shrink-0 ml-0.5"
                                                aria-label="Remove file"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div
                                className="flex items-center gap-2 rounded-2xl border px-3 transition-all focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200/60"
                                style={{
                                    background: 'var(--teaching-panel-bg-alt, #f6f5fa)',
                                    borderColor: isChatLoading ? 'var(--teaching-accent)' : 'var(--teaching-panel-divider)',
                                    minHeight: '48px',
                                }}
                            >
                                {/* Hidden file input */}
                                <input
                                    ref={chatFileInputRef}
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    multiple
                                    className="hidden"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        for (const file of files) {
                                            if (isImageLikeFile(file)) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    setUploadedChatFiles(prev => [...prev, {
                                                        name: file.name,
                                                        dataUrl: ev.target?.result as string,
                                                        type: file.type || 'image/jpeg',
                                                    }]);
                                                };
                                                reader.onerror = () => {
                                                    toast.error(`Could not read image: ${file.name}`);
                                                };
                                                reader.readAsDataURL(file);
                                            } else {
                                                try {
                                                    setUploadedChatFiles(prev => [...prev, { name: file.name, type: file.type }]);

                                                    const extractedText = await extractTextFromFile(file);
                                                    const text =
                                                        extractedText.trim().length > 0
                                                            ? extractedText
                                                            : '[No extractable text in this document.]';

                                                    let assigned = false;
                                                    setUploadedChatFiles(prev =>
                                                        prev.map((f) => {
                                                            if (
                                                                !assigned &&
                                                                f.name === file.name &&
                                                                f.dataUrl === undefined
                                                            ) {
                                                                assigned = true;
                                                                return { ...f, dataUrl: text };
                                                            }
                                                            return f;
                                                        })
                                                    );
                                                } catch (err) {
                                                    console.error(`Failed to parse ${file.name}:`, err);
                                                    toast.error(`Could not read text from ${file.name}`);
                                                    let removed = false;
                                                    setUploadedChatFiles((prev) =>
                                                        prev.filter((f) => {
                                                            if (
                                                                !removed &&
                                                                f.name === file.name &&
                                                                f.dataUrl === undefined
                                                            ) {
                                                                removed = true;
                                                                return false;
                                                            }
                                                            return true;
                                                        })
                                                    );
                                                }
                                            }
                                        }
                                        // Reset input so same file can be selected again
                                        e.target.value = '';
                                    }}
                                />
                                {/* Upload button */}
                                <button
                                    type="button"
                                    onClick={() => chatFileInputRef.current?.click()}
                                    disabled={isChatLoading}
                                    className="shrink-0 flex items-center justify-center rounded-full w-8 h-8 text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all disabled:opacity-40"
                                    title="Attach image or document"
                                    aria-label="Attach file"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41A2 2 0 0 1 6.59 14.59L15.78 5.4" />
                                    </svg>
                                </button>
                                {/* Text input */}
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && !attachmentStillLoading && handleSendMessage()}
                                    placeholder={isChatLoading ? 'AI is thinking...' : 'Ask anything or attach a file...'}
                                    disabled={isChatLoading}
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 py-2 disabled:cursor-wait"
                                    style={{ color: 'var(--teaching-panel-text)' }}
                                />
                                {/* Send button */}
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={isChatLoading || attachmentStillLoading || (!inputMessage.trim() && uploadedChatFiles.length === 0)}
                                    className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        background: 'var(--teaching-accent, #7c3aed)',
                                    }}
                                    aria-label="Send message"
                                >
                                    {isChatLoading
                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        : <ArrowUp className="w-4 h-4 text-white" />
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══════════════════════ TEACHING PANEL (Center — 55%) ═══════════════════════ */}
                    <AnimatePresence mode="popLayout">
                        {centerPanelVisible && (
                            <motion.div
                                layout
                                initial={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                animate={isMobile ? { opacity: mobilePanel === 'teach' ? 1 : 0 } : {
                                    opacity: rightMaximized ? 0 : 1,
                                    flex: rightMaximized ? '0 0 0px' : (centerMaximized ? '1 1 100%' : (rightPanelVisible ? '55 55 0%' : '75 75 0%')),
                                    borderRadius: centerMaximized ? 0 : 20,
                                    boxShadow: centerMaximized ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                                exit={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300, duration: reduceAnimations ? 0 : 0.35 }}
                                className={`${isMobile ? 'absolute inset-0 w-full h-full' : 'relative min-w-0'} flex flex-col order-1 lg:order-2 ${mobilePanel === 'teach' ? 'flex' : 'hidden lg:flex md:flex'}`}
                                style={isMobile ? {
                                    display: mobilePanel === 'teach' ? 'flex' : 'none',
                                    pointerEvents: mobilePanel === 'teach' ? 'auto' : 'none'
                                } : {
                                    background: 'var(--teaching-panel-bg)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    height: '100%',
                                    minHeight: 0,
                                    alignSelf: 'stretch',
                                }}
                            >
                                {/* Panel Header — minimal when maximized for distraction-free focus */}
                                <motion.div
                                    className="hidden md:flex items-center justify-center shrink-0 border-b bg-transparent relative"
                                    style={{
                                        height: centerMaximized ? '56px' : '60px',
                                        borderColor: 'var(--teaching-panel-divider)',
                                        borderRadius: centerMaximized ? 0 : 'var(--teaching-panel-radius) var(--teaching-panel-radius) 0 0',
                                        background: centerMaximized ? 'rgba(245, 244, 248, 0.97)' : undefined,
                                        backdropFilter: centerMaximized ? 'saturate(180%) blur(10px)' : undefined,
                                    }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                >
                                    {!centerMaximized && (
                                        <h2 className="text-[19px] font-medium text-[var(--teaching-panel-text)]" style={{ letterSpacing: '0.01em' }}>Teaching Panel</h2>
                                    )}
                                    <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 sm:gap-4">
                                        <div
                                            className="font-semibold tabular-nums text-[var(--teaching-panel-text)]"
                                            style={{ fontSize: centerMaximized ? '13px' : '12px', letterSpacing: centerMaximized ? '0.02em' : '0.05em' }}
                                        >
                                            {centerMaximized ? `Step ${currentStep + 1} of ${currentSession?.totalSteps || 15}` : `STEP ${currentStep + 1}/${currentSession?.totalSteps || 15}`}
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                if (centerMaximized) {
                                                    setCenterMaximized(false);
                                                } else {
                                                    setCenterMaximized(true);
                                                    setRightMaximized(false);
                                                }
                                            }}
                                            className={`rounded-lg transition-colors flex items-center justify-center ${centerMaximized
                                                ? 'p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-[var(--teaching-panel-divider)] text-[var(--teaching-panel-text)] shadow-sm'
                                                : 'p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                }`}
                                            whileTap={{ scale: 0.92 }}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                                            aria-label={centerMaximized ? 'Exit full screen' : 'Full screen'}
                                        >
                                            {centerMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-5 h-5" />}
                                        </motion.button>
                                    </div>
                                </motion.div>

                                {/* Teaching Panel Row 2: Smiley + Start/Stop Listening */}
                                <div
                                    className="flex flex-row items-center justify-between gap-4 shrink-0"
                                    style={{
                                        padding: centerMaximized ? 'clamp(12px, 2vw, var(--space-lg))' : 'clamp(10px, 2vw, var(--space-md))',
                                        background: 'var(--teaching-panel-bg-alt)',
                                    }}
                                >
                                    {/* AI Smiley + Topic Name */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {!centerMaximized && (
                                            <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] rounded-full shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 relative">
                                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                                    {/* Background within the circle */}
                                                </div>
                                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                                    <EmojiMascot size={90} variant="teacher" isSpeaking={isSpeaking && !isPaused} emotion={isFetchingAudio && !isSpeaking ? 'thinking' : (isSpeaking ? 'happy' : 'neutral')} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <h1 className="text-base sm:text-lg font-semibold leading-tight truncate" style={{ color: 'var(--teaching-panel-text)' }}>
                                                {currentSession?.topicName || 'Topic'}
                                            </h1>
                                            <p className="text-xs sm:text-sm font-normal truncate" style={{ color: 'var(--teaching-panel-text-muted)' }}>
                                                {findTopicInfo(topicId).subjectName || 'Subject'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Start/Stop Listening button and Raise Doubt */}
                                    {(() => {
                                        const hasNarration = !!currentStepData?.spokenContent;
                                        const isLivePlayback = (isSpeaking || isFetchingAudio) && !isPaused;
                                        const showResumeListening = isPaused && hasNarration;
                                        const showStopListening = isLivePlayback;
                                        const showStartListening = !isLivePlayback && !isPaused && hasNarration;
                                        return (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Priority: Pause speech
                                                        if (isLivePlayback) {
                                                            pause();
                                                        }
                                                        // Navigation: Open Chat panel based on device view
                                                        if (isMobile) {
                                                            setMobilePanel('home');
                                                        } else {
                                                            // For desktop, ensure the right/center panels are adjusted to show Chat
                                                            setCenterMaximized(false);
                                                            setRightMaximized(false);
                                                            setCenterPanelVisible(true);
                                                            // Note: By default the chat is fixed on the left (lg:flex), 
                                                            // and we just need to ensure the center panel isn't hiding it
                                                            // We could also focus the chat input if we had a ref
                                                        }
                                                    }}
                                                    disabled={!isLivePlayback}
                                                    className={`touch-target px-4 sm:px-5 h-[40px] rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm active:scale-95 ${isLivePlayback
                                                        ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 dark:text-purple-300'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed opacity-60'
                                                        }`}
                                                    aria-label="Raise Doubt"
                                                >
                                                    <HelpCircle className="w-4 h-4 shrink-0" />
                                                    <span className="hidden sm:inline">Raise Doubt</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        unlockAudioContext();
                                                        if (showStopListening) {
                                                            needsPlaybackRestartRef.current = false;
                                                            pause();
                                                            return;
                                                        }
                                                        if (showResumeListening) {
                                                            resume();
                                                            return;
                                                        }
                                                        if (showStartListening) {
                                                            needsPlaybackRestartRef.current = false;
                                                            // Clear any stale mute state so manual Start always works
                                                            if (setIsMuted) setIsMuted(false);
                                                            setPlaybackTrigger(prev => prev + 1);
                                                        }
                                                    }}
                                                    disabled={!showStopListening && !showResumeListening && !showStartListening}
                                                    className={`touch-target px-4 sm:px-6 h-[40px] rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${showStopListening
                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                        }`}
                                                    aria-label={showStopListening ? 'Stop listening' : showResumeListening ? 'Resume listening' : 'Start listening'}
                                                >
                                                    {showStopListening ? (
                                                        <>
                                                            {isFetchingAudio && !isSpeaking ? (
                                                                <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin shrink-0"></div>
                                                            ) : (
                                                                <Square className="w-4 h-4 fill-current shrink-0" />
                                                            )}
                                                            <span>{isFetchingAudio && !isSpeaking ? 'Loading...' : 'Stop Listening'}</span>
                                                        </>
                                                    ) : showResumeListening ? (
                                                        <>
                                                            <Volume2 className="w-4 h-4 shrink-0" />
                                                            <span>Resume Listening</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Volume2 className="w-4 h-4 shrink-0" />
                                                            <span>Start Listening</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Main content area — green board */}
                                <motion.div
                                    className="flex-1 flex flex-col min-h-0 relative items-center justify-center overflow-hidden"
                                    style={{
                                        padding: centerMaximized ? '4px clamp(20px, 3vw, var(--space-xxl)) 20px' : '4px var(--space-lg) var(--space-lg) var(--space-lg)',
                                        background: centerMaximized ? 'linear-gradient(180deg, var(--teaching-panel-bg-alt) 0%, #EEECF4 100%)' : 'var(--teaching-panel-bg-alt)',
                                    }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                >

                                    <AnimatePresence mode="wait">
                                        {!currentStepData ? (
                                            <motion.div
                                                key="loader"
                                                initial={reduceAnimations ? false : { opacity: 0 }}
                                                animate={{ opacity: 0.7 }}
                                                exit={reduceAnimations ? undefined : { opacity: 0 }}
                                                transition={{ duration: reduceAnimations ? 0 : 0.2 }}
                                                className="teaching-board flex flex-col items-center justify-center shadow-lg"
                                                style={{
                                                    borderRadius: centerMaximized ? 16 : 'var(--teaching-board-radius)',
                                                    height: '100%',
                                                    width: '100%',
                                                    minHeight: 'var(--teaching-board-min-height)',
                                                }}
                                            >
                                                <div className="text-center flex-1 flex items-center justify-center">
                                                    <div className="w-12 h-12 border-[6px] border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key={currentStep}
                                                initial={reduceAnimations ? false : { opacity: 0, scale: 0.99, y: 4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={reduceAnimations ? undefined : { opacity: 0, scale: 0.99, y: -4 }}
                                                transition={reduceAnimations ? { duration: 0 } : { duration: GREEN_BOARD_FADE_DURATION_MS / 1000, ease: 'easeInOut' }}
                                                className="flex flex-col min-h-0 w-full"
                                                style={{ height: '100%', minHeight: 'var(--teaching-board-min-height)' }}
                                            >
                                                <motion.div
                                                    className="teaching-board flex flex-col relative overflow-hidden cursor-pointer"
                                                    onClick={() => {
                                                        unlockAudioContext();
                                                        const hasNarr = !!currentStepData?.spokenContent;
                                                        const live = (isSpeaking || isFetchingAudio) && !isPaused;
                                                        const resumeEl = isPaused && hasNarr;
                                                        const startEl = !live && !isPaused && hasNarr;
                                                        if (live) {
                                                            needsPlaybackRestartRef.current = false;
                                                            pause();
                                                            toast.success('Speech stopped');
                                                        } else if (resumeEl) {
                                                            resume();
                                                            toast.success('Speech resumed');
                                                        } else if (startEl) {
                                                            needsPlaybackRestartRef.current = false;
                                                            setPlaybackTrigger(prev => prev + 1);
                                                        }
                                                    }}
                                                    style={{
                                                        borderRadius: centerMaximized ? 16 : 'var(--teaching-board-radius)',
                                                        boxShadow: centerMaximized ? '0 12px 48px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)' : '0 12px 40px -8px rgba(0,0,0,0.15)',
                                                        height: '100%',
                                                    }}
                                                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                                >
                                                    {/* Visual content area — board shows diagram only; speech syncs via [VISUAL:...] highlights */}
                                                    <div className="flex-1 relative flex items-center justify-center min-h-0" style={{ padding: 0 }}>
                                                        <div className="relative z-10 w-full h-full">
                                                            {(() => {
                                                                if (!currentStepData || !topicId) return null;
                                                                // Topic-lock: load only visuals from Visual Registry for this topic
                                                                const visualsEntry = getVisualsForTopic(topicId);

                                                                if (!visualsEntry) {
                                                                    console.error(`Visual Registry Integrity Violation: No entry for ${topicId}. Blocking render.`);
                                                                    return (
                                                                        <div className="flex flex-col items-center justify-center p-8 text-center">
                                                                            <p className="text-white/60 font-medium italic">High-fidelity visual content is strictly required by Rule 1. This topic is currently restricted.</p>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Suspense fallback={
                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl">
                                                                                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                                                                                <p className="text-sm text-slate-300 font-medium">Loading Interactive Visuals...</p>
                                                                            </div>
                                                                        }>
                                                                            {(currentStepData.type === 'practice' || currentStepData.type === 'assessment') && currentStepData.quiz ? (
                                                                                <QuizVisual
                                                                                    quiz={currentStepData.quiz}
                                                                                    onComplete={(correct) => {
                                                                                        if (correct) toast.success('Excellent!');

                                                                                        // Log analytics event instantly
                                                                                        addSession({
                                                                                            sessionId: `session_${Date.now()}`,
                                                                                            date: new Date().toISOString(),
                                                                                            durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000)),
                                                                                            topicId: topicId || 'unknown',
                                                                                            completionPercentage: 100,
                                                                                            doubtsCount: currentSession?.doubts?.length || 0,
                                                                                            quizScore: correct ? 100 : 0
                                                                                        });
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <DiagramCanvas
                                                                                    topicId={topicId}
                                                                                    activeDiagramId={activeDiagramId}
                                                                                    highlightPartId={activeHighlightPart}
                                                                                    stepContent={currentStepData.content}
                                                                                    stepId={currentStepData.id || ''}
                                                                                    isSpeaking={isSpeaking && !isPaused}
                                                                                    isPaused={isPaused}
                                                                                />
                                                                            )}
                                                                        </Suspense>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>


                                {/* Visual Feedback Overlay */}
                                <AnimatePresence>
                                    {lastUserAction && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900/90 text-white rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 z-50 pointer-events-none border border-white/10"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                            <span className="text-sm font-bold capitalize">{lastUserAction.replace('-', ' ')}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapsed Panel Expanders (desktop/tablet only) — hidden when Studio is maximized */}
                    <AnimatePresence mode="popLayout">
                        {!isMobile && !centerPanelVisible && !centerMaximized && !rightMaximized && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 40 }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col items-center justify-center border-l border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        setCenterPanelVisible(true);
                                        setCenterMaximized(false);
                                    }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                                    title="Expand Teaching Panel"
                                >
                                    <ChevronRight className="w-5 h-5 shrink-0" />
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical rotate-180 mt-2 whitespace-nowrap">Teaching</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════════ STUDIO PANEL (Right — 22%) ═══════════════════════ */}
                    {/* Positioned bottom in tablet stack (order-3) */}
                    <AnimatePresence mode="popLayout">
                        {rightPanelVisible && (
                            <motion.div
                                layout
                                initial={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                animate={isMobile ? { opacity: mobilePanel === 'studio' ? 1 : 0 } : { 
                                    opacity: centerMaximized ? 0 : 1,
                                    flex: centerMaximized ? '0 0 0px' : (rightMaximized ? '1 1 100%' : (centerPanelVisible ? '22 22 0%' : '75 75 0%')),
                                    borderRadius: rightMaximized ? 0 : 20,
                                    boxShadow: rightMaximized ? 'none' : 'var(--teaching-panel-shadow)',
                                }}
                                exit={isMobile ? { opacity: 0 } : { opacity: 0, flex: '0 0 0px' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300, duration: reduceAnimations ? 0 : 0.3 }}
                                className={`${isMobile ? 'absolute inset-0 w-full h-full' : 'relative min-w-0'} flex flex-col z-30 lg:z-auto order-3 ${mobilePanel === 'studio' ? 'flex' : 'hidden lg:flex md:flex'}`}
                                style={isMobile ? {
                                    display: mobilePanel === 'studio' ? 'flex' : 'none',
                                    pointerEvents: mobilePanel === 'studio' ? 'auto' : 'none'
                                } : {
                                    background: 'var(--teaching-panel-bg)',
                                    overflow: 'hidden',
                                    minHeight: 0,
                                    alignSelf: 'stretch',
                                }}
                            >
                                {/* Panel Header — centered title; relative so maximize button positions correctly */}
                                <div
                                    className="hidden md:flex items-center justify-center shrink-0 border-b bg-transparent relative"
                                    style={{
                                        height: rightMaximized ? '56px' : '60px',
                                        borderColor: 'var(--teaching-panel-divider)',
                                        borderRadius: rightMaximized ? 0 : 'var(--teaching-panel-radius) var(--teaching-panel-radius) 0 0',
                                        background: rightMaximized ? 'var(--teaching-header-bg)' : undefined,
                                        backdropFilter: rightMaximized ? 'saturate(180%) blur(10px)' : undefined,
                                    }}
                                >
                                    {!rightMaximized && (
                                        <h2 className="text-[19px] font-medium text-[var(--teaching-panel-text)]" style={{ letterSpacing: '0.01em' }}>Studio Panel</h2>
                                    )}
                                    {!isMobile && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    if (rightMaximized) {
                                                        setRightMaximized(false);
                                                    } else {
                                                        setRightMaximized(true);
                                                        setCenterMaximized(false);
                                                    }
                                                }}
                                                className={`rounded-lg transition-colors flex items-center justify-center touch-target min-w-[44px] min-h-[44px] ${rightMaximized
                                                    ? 'p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-[var(--teaching-panel-divider)] text-[var(--teaching-panel-text)] shadow-sm'
                                                    : 'p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600'
                                                    }`}
                                                whileTap={{ scale: 0.92 }}
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                                                aria-label={rightMaximized ? 'Exit full screen' : 'Full screen'}
                                                title={rightMaximized ? 'Exit full screen' : 'Full screen'}
                                            >
                                                {rightMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                            </motion.button>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar tools list or Viewer */}
                                <div className="flex-1 flex flex-col min-h-0 bg-[#fcfcfc] dark:bg-slate-950/20">
                                    {studioInViewer ? (
                                        // Active Viewer Mode - Full Panel
                                        <div className="flex-1 flex flex-col min-h-0">
                                            {/* Viewer Sub-header */}
                                            <div className="px-4 py-3 border-b flex items-center justify-between bg-white/50 dark:bg-slate-900/60 backdrop-blur-sm" style={{ borderColor: 'var(--teaching-panel-divider)' }}>
                                                <button
                                                    onClick={() => setStudioInViewer(false)}
                                                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-300 hover:text-[var(--teaching-accent)] transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    Back to Tools
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                                                        {activeStudioTab === 'notes' ? 'Notes' :
                                                            activeStudioTab === 'map' ? 'Mind Map' :
                                                                activeStudioTab === 'flashcards' ? 'Flashcards' :
                                                                    activeStudioTab === 'quiz' ? 'Quiz' : 
                                                                        activeStudioTab === 'analyzer' ? 'AI Analyzer' : 'Summary'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Viewer Content */}
                                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                                <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
                                                    {activeStudioTab === 'notes' && sessionNotes.length > 0 && (
                                                        <NotesViewer note={sessionNotes[sessionNotes.length - 1]} />
                                                    )}
                                                    {activeStudioTab === 'map' && sessionMindMaps.length > 0 && (
                                                        <MindMapViewer mindMap={sessionMindMaps[sessionMindMaps.length - 1]} />
                                                    )}
                                                    {activeStudioTab === 'flashcards' && sessionFlashcards.length > 0 && (
                                                        <FlashcardViewer flashcards={sessionFlashcards} onPerformanceUpdate={updateFlashcardPerformance} />
                                                    )}
                                                    {activeStudioTab === 'quiz' && (
                                                        <QuizViewer
                                                            topic={currentSession?.topicName || 'General'}
                                                            subjectArea={topicInfo.subjectArea || 'General'}
                                                            gradeLevel={topicInfo.gradeLevel || 'School'}
                                                            topicDescription={topicInfo.topicDescription}
                                                            chapterName={topicInfo.chapterName}
                                                            subjectDescription={topicInfo.subjectDescription}
                                                            lessonContent={currentSession?.teachingSteps?.map(s => s.content || '').filter(Boolean) || []}
                                                            onBack={() => setStudioInViewer(false)}
                                                            onComplete={(score: number) => {
                                                                setCompletedQuizCount(prev => prev + 1);
                                                                // Log full studio quiz to analytics
                                                                addSession({
                                                                    sessionId: `studio_quiz_${Date.now()}`,
                                                                    date: new Date().toISOString(),
                                                                    durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000)),
                                                                    topicId: topicId || 'unknown',
                                                                    completionPercentage: 100,
                                                                    doubtsCount: currentSession?.doubts?.length || 0,
                                                                    quizScore: score
                                                                });
                                                            }}
                                                        />
                                                    )}
                                                    {activeStudioTab === 'summary' && sessionSummaries.length > 0 && (
                                                        <SummaryViewer summary={sessionSummaries[sessionSummaries.length - 1]} />
                                                    )}
                                                    {activeStudioTab === 'analyzer' && (
                                                        <AnalyzerViewer />
                                                    )}
                                                </Suspense>
                                            </div>
                                        </div>
                                    ) : (
                                        // Standard Tools Selection Mode
                                        <>
                                            <div className="flex-1 overflow-y-auto space-y-3" style={{ padding: 'clamp(12px, 2vw, var(--space-lg))', background: 'var(--teaching-panel-bg-alt)' }}>
                                                {[
                                                    { id: 'notes', icon: FileText, label: 'Notes', count: sessionNotes.length.toString().padStart(2, '0'), color: '#8E7CC3' },
                                                    { id: 'map', icon: LucideMap, label: 'Mind Map', count: sessionMindMaps.length.toString().padStart(2, '0'), color: '#10B981' },
                                                    { id: 'flashcards', icon: CreditCard, label: 'Flashcards', count: sessionFlashcards.length.toString().padStart(2, '0'), color: '#F59E0B' },
                                                    { id: 'quiz', icon: HelpCircle, label: 'Quiz', count: completedQuizCount.toString().padStart(2, '0'), color: '#EC4899' },
                                                    { id: 'summary', icon: Sparkles, label: 'Summary', count: sessionSummaries.length.toString().padStart(2, '0'), color: '#3B82F6' },
                                                    { id: 'analyzer', icon: Scan, label: 'AI Analyzer', count: analyzedImage ? '01' : '00', color: '#10B981' },
                                                ].map((tool) => {
                                                    const isActive = activeStudioTab === tool.id;
                                                    return (
                                                        <motion.button
                                                            key={tool.id}
                                                            onClick={() => {
                                                                setActiveStudioTab(tool.id as StudioTabId);
                                                                if (tool.id === 'quiz') setStudioInViewer(true);
                                                            }}
                                                            whileHover={{
                                                                backgroundColor: isActive ? 'transparent' : `${tool.color}15`,
                                                                scale: 1.01
                                                            }}
                                                            className={`w-full h-12 sm:h-[52px] flex items-center justify-between px-3 sm:px-5 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive ? 'bg-transparent border-transparent' : 'bg-white/40 dark:bg-slate-800/40 border border-black/5 dark:border-white/5'}`}
                                                        >
                                                            {/* Active background highlight with glassmorphism */}
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="activeTabBg"
                                                                    className="absolute inset-0 z-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md"
                                                                    style={{
                                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                                        border: '1px solid rgba(142, 124, 195, 0.2)'
                                                                    }}
                                                                />
                                                            )}

                                                            <div className="flex items-center gap-3 relative z-10">
                                                                <div
                                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-gray-100/50 dark:bg-slate-800/50'}`}
                                                                >
                                                                    <tool.icon className="w-4 h-4" style={{ color: isActive ? tool.color : 'var(--teaching-panel-text-muted)' }} />
                                                                </div>
                                                                <span
                                                                    className="text-[14px] font-bold tracking-tight transition-colors"
                                                                    style={{ color: isActive ? 'var(--teaching-panel-text)' : 'var(--teaching-panel-text-muted)' }}
                                                                >
                                                                    {tool.label}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 relative z-10">
                                                                {isActive && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="w-1.5 h-1.5 rounded-full"
                                                                        style={{ backgroundColor: tool.color }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}

                                                {/* Empty State for Summary if not yet generated */}
                                                {activeStudioTab === 'summary' && sessionSummaries.length === 0 && !isGeneratingSummary && (
                                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                                        <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                            <Sparkles className="w-8 h-8 text-blue-500" />
                                                        </div>
                                                        <h4 className="text-gray-800 dark:text-slate-100 font-bold mb-2">No Summary Yet</h4>
                                                        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-[200px] mb-6">
                                                            Generate an executive summary of your learning session.
                                                        </p>
                                                        <button
                                                            onClick={handleGenerateSummary}
                                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                                                        >
                                                            Generate Summary
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Standard Footer with Generate button */}
                                            <div className="p-4 sm:p-6 space-y-2 border-t" style={{ background: 'var(--teaching-panel-bg)', borderColor: 'var(--teaching-panel-divider)' }}>
                                                <button
                                                    onClick={() => {
                                                        if (activeStudioTab === 'notes') handleGenerateNotes();
                                                        else if (activeStudioTab === 'map') handleGenerateMindMap();
                                                        else if (activeStudioTab === 'flashcards') handleGenerateFlashcards();
                                                        else if (activeStudioTab === 'summary') handleGenerateSummary();
                                                        else if (activeStudioTab === 'analyzer') setStudioInViewer(true);
                                                    }}
                                                    disabled={isGeneratingNotes || isGeneratingMindMap || isGeneratingFlashcards || isGeneratingSummary || isAnalyzing}
                                                    className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-3 text-[15px] font-medium text-white transition-all active:scale-95 disabled:opacity-50 hover:opacity-95"
                                                    style={{ backgroundColor: 'var(--teaching-accent)', marginTop: 'var(--space-md)' }}
                                                >
                                                    {isGeneratingNotes || isGeneratingMindMap || isGeneratingFlashcards || isGeneratingSummary || isAnalyzing ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                                            <span>{isAnalyzing ? 'Analyzing...' : 'Generating...'}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-5 h-5 shrink-0" />
                                                            <span>
                                                                {activeStudioTab === 'notes' ? 'Generate Detailed Notes' :
                                                                    activeStudioTab === 'map' ? 'Generate Mind Map' :
                                                                        activeStudioTab === 'flashcards' ? 'Generate Flashcards' :
                                                                            activeStudioTab === 'analyzer' ? 'Open AI Analyzer' :
                                                                                'Generate Session Summary'}
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-[13px] text-center font-normal leading-relaxed px-4 mt-2" style={{ color: 'var(--teaching-panel-text-muted)' }}>
                                                    Auto-generated notes will appear here as you learn.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapsed Right Panel Expander (desktop/tablet only) — hidden when teaching is maximized */}
                    <AnimatePresence>
                        {!isMobile && !rightPanelVisible && !rightMaximized && !centerMaximized && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 40 }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col items-center justify-center border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        setRightPanelVisible(true);
                                        setRightMaximized(false);
                                    }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-600 dark:text-slate-400 shrink-0"
                                    title="Expand Studio Panel"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-xs text-gray-500 dark:text-slate-400 writing-mode-vertical rotate-180 mt-2 font-bold uppercase tracking-widest whitespace-nowrap">Studio</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            {/* Verification Quiz Modal */}
            <AnimatePresence>
                {showVerificationQuiz && currentQuiz && (
                    <Suspense fallback={null}>
                        <VerificationQuiz
                            quiz={currentQuiz}
                            onComplete={() => {
                                if (activeDoubt) {
                                    confirmUnderstanding(activeDoubt.id);
                                }
                                // Log verification quiz success to analytics
                                addSession({
                                    sessionId: `vquiz_${Date.now()}`,
                                    date: new Date().toISOString(),
                                    durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000)),
                                    topicId: topicId || 'unknown',
                                    completionPercentage: 100,
                                    doubtsCount: currentSession?.doubts?.length || 0,
                                    quizScore: 100 // Verification completion implies success
                                });
                                resume();
                            }}
                            onSkip={() => {
                                hideQuiz();
                                resume();
                            }}
                        />
                    </Suspense>
                )}
            </AnimatePresence>

            {/* Modal Overlays */}
            {activeModal === 'settings' && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto w-full h-full flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
                        <SettingsPage onClose={() => setActiveModal('none')} />
                    </Suspense>
                </div>
            )}
            {activeModal === 'profile' && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto w-full h-full flex flex-col">
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
                        <ProfilePage onClose={() => setActiveModal('none')} />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
