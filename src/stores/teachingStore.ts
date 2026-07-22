import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeachingState, TeachingSession, TeachingStep, Doubt, Collaborator } from '../types';

interface TeachingStore extends TeachingState {
    // Session management
    startSession: (session: TeachingSession) => void;
    endSession: () => void;

    // Step control
    goToStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
    completeStep: (stepId: string) => void;

    // Teaching control
    pause: () => void;
    resume: () => void;
    setSpeaking: (speaking: boolean) => void;

    // Doubt handling
    enterDoubtMode: (doubt: Doubt) => void;
    exitDoubtMode: () => void;
    resolveDoubt: (doubtId: string) => void;

    // Collaboration
    addCollaborator: (collaborator: Collaborator) => void;
    removeCollaborator: (id: string) => void;
    toggleScreenShare: () => void;

    // Utilities
    getProgress: () => number;
    getCurrentStepData: () => TeachingStep | null;
}

export const useTeachingStore = create<TeachingStore>()(persist((set, get) => ({
    currentSession: null,
    currentStep: 0,
    isPaused: false,
    isInDoubtMode: false,
    isSpeaking: false,
    collaborators: [],
    isScreenSharing: false,
    lastStepByTopicId: {},

    startSession: (session) => {
        const { lastStepByTopicId } = get() as { lastStepByTopicId?: Record<string, number> };
        const savedStep = lastStepByTopicId?.[session.topicId];
        const stepsLen = session.teachingSteps?.length ?? 0;
        const step = savedStep != null && stepsLen > 0 && savedStep >= 0 && savedStep < stepsLen
            ? savedStep
            : session.currentStep ?? 0;
        set({
            currentSession: { ...session, currentStep: step },
            currentStep: step,
            isPaused: false,
            isInDoubtMode: false,
        });
    },

    endSession: () => set({
        currentSession: null,
        currentStep: 0,
        isPaused: false,
        isInDoubtMode: false,
        isSpeaking: false,
    }),

    goToStep: (step) => set((state) => {
        if (!state.currentSession || !state.currentSession.teachingSteps || state.currentSession.teachingSteps.length === 0) return state;
        const maxStep = state.currentSession.teachingSteps.length - 1;
        const newStep = Math.max(0, Math.min(step, maxStep));
        const lastStepByTopicId = (state as { lastStepByTopicId?: Record<string, number> }).lastStepByTopicId ?? {};
        return {
            currentStep: newStep,
            isPaused: false,
            currentSession: { ...state.currentSession, currentStep: newStep },
            lastStepByTopicId: { ...lastStepByTopicId, [state.currentSession.topicId]: newStep },
        };
    }),

    nextStep: () => {
        const state = get();
        if (state.currentSession && state.currentSession.teachingSteps && state.currentSession.teachingSteps.length > 0) {
            const nextStepIndex = state.currentStep + 1;
            if (nextStepIndex < state.currentSession.teachingSteps.length) {
                set((currentState) => {
                    if (!currentState.currentSession || !currentState.currentSession.teachingSteps || currentState.currentSession.teachingSteps.length === 0) return currentState;
                    const maxStep = currentState.currentSession.teachingSteps.length - 1;
                    const newStep = Math.max(0, Math.min(nextStepIndex, maxStep));
                    const lastStepByTopicId = (currentState as { lastStepByTopicId?: Record<string, number> }).lastStepByTopicId ?? {};
                    return {
                        currentStep: newStep,
                        isPaused: false,
                        currentSession: { ...currentState.currentSession, currentStep: newStep },
                        lastStepByTopicId: { ...lastStepByTopicId, [currentState.currentSession.topicId]: newStep },
                    };
                });
            }
        }
    },

    previousStep: () => {
        const state = get();
        if (state.currentStep > 0) {
            get().goToStep(state.currentStep - 1);
        }
    },

    completeStep: (stepId) => set((state) => {
        if (!state.currentSession || !state.currentSession.teachingSteps) return state;
        const updatedSteps = state.currentSession.teachingSteps.map(step =>
            step.id === stepId ? { ...step, completed: true } : step
        );
        return {
            currentSession: {
                ...state.currentSession,
                teachingSteps: updatedSteps,
            }
        };
    }),

    pause: () => set({ isPaused: true }),

    resume: () => set({ isPaused: false }),

    setSpeaking: (speaking) => set({ isSpeaking: speaking }),

    enterDoubtMode: (doubt) => set((state) => {
        if (!state.currentSession) return state;
        return {
            isInDoubtMode: true,
            isPaused: true,
            currentSession: {
                ...state.currentSession,
                doubts: [...(state.currentSession.doubts || []), doubt],
            }
        };
    }),

    exitDoubtMode: () => set({ isInDoubtMode: false }),

    resolveDoubt: (doubtId) => set((state) => {
        if (!state.currentSession || !state.currentSession.doubts) return state;
        const updatedDoubts = state.currentSession.doubts.map(d =>
            d.id === doubtId ? { ...d, status: 'resolved' as const } : d
        );
        return {
            currentSession: {
                ...state.currentSession,
                doubts: updatedDoubts,
            }
        };
    }),

    addCollaborator: (collaborator) => set((state) => ({
        collaborators: [...state.collaborators, collaborator],
    })),

    removeCollaborator: (id) => set((state) => ({
        collaborators: state.collaborators.filter(c => c.id !== id),
    })),

    toggleScreenShare: () => set((state) => ({
        isScreenSharing: !state.isScreenSharing
    })),

    getProgress: () => {
        const state = get();
        if (!state.currentSession || !state.currentSession.teachingSteps || state.currentSession.teachingSteps.length === 0) return 0;
        const completedSteps = state.currentSession.teachingSteps.filter(s => s.completed).length;
        return (completedSteps / state.currentSession.teachingSteps.length) * 100;
    },

    getCurrentStepData: () => {
        const state = get();
        if (!state.currentSession || !state.currentSession.teachingSteps) return null;
        if (state.currentStep < 0 || state.currentStep >= state.currentSession.teachingSteps.length) return null;
        return state.currentSession.teachingSteps[state.currentStep] || null;
    },
}), {
    name: 'teaching-storage',
    partialize: (state) => ({
        lastStepByTopicId: (state as { lastStepByTopicId?: Record<string, number> }).lastStepByTopicId ?? {},
    }),
}));
