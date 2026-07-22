import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Achievement,
    SessionAnalytics,
    ProgressMetrics
} from '../types';

interface AnalyticsStore {
    sessions: SessionAnalytics[];
    achievements: Achievement[];
    metrics: ProgressMetrics;

    // Actions
    addSession: (session: SessionAnalytics) => void;
    updateMetrics: () => void;
    checkAchievements: () => void;
    unlockAchievement: (id: string) => void;
}

const initialAchievements: Achievement[] = [
    {
        id: 'first_step',
        name: 'First Step',
        description: 'Complete your first learning session',
        icon: '🎯',
        target: 1,
        progress: 0,
    },
    {
        id: 'quick_learner',
        name: 'Quick Learner',
        description: 'Complete a topic with >90% quiz score',
        icon: '⚡',
        target: 1,
        progress: 0,
    },
    {
        id: 'dedicated_student',
        name: 'Dedicated Student',
        description: 'Study for more than 5 hours total',
        icon: '📚',
        target: 300, // minutes
        progress: 0,
    },
    {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 3-day learning streak',
        icon: '🔥',
        target: 3,
        progress: 0,
    }
];

export const useAnalyticsStore = create<AnalyticsStore>()(
    persist(
        (set, get) => ({
            sessions: [],
            achievements: initialAchievements,
            metrics: {
                totalHours: 0,
                topicsCompleted: 0,
                averageQuizScore: 0,
                knowledgeRetention: 0,
                weeklyHours: [0, 0, 0, 0, 0, 0, 0],
                streakDays: 0,
                conceptMastery: {},
                dailyActivity: [],
                learningVelocity: 0
            },

            addSession: (session) => {
                set((state) => ({
                    sessions: [...state.sessions, session]
                }));
                get().updateMetrics();
                get().checkAchievements();
            },

            updateMetrics: () => {
                const { sessions } = get();
                const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
                const completedSessions = sessions.filter(s => s.completionPercentage === 100);
                const totalScore = sessions.reduce((acc, s) => acc + (s.quizScore || 0), 0);

                set((state) => {
                    const mastery = { ...state.metrics.conceptMastery };
                    sessions.forEach(s => {
                        if (s.quizScore) {
                            mastery[s.topicId] = Math.max(mastery[s.topicId] || 0, s.quizScore);
                        }
                    });

                    return {
                        metrics: {
                            ...state.metrics,
                            totalHours: Math.round((totalMinutes / 60) * 10) / 10,
                            topicsCompleted: completedSessions.length,
                            averageQuizScore: sessions.length ? Math.round(totalScore / sessions.length) : 0,
                            conceptMastery: mastery,
                            learningVelocity: Math.round((completedSessions.length / 1) * 10) / 10 // Simplified velocity
                        }
                    };
                });
            },

            checkAchievements: () => {
                // Get current state for future achievement logic
                // const state = get(); // Reserved for future use
                // Implement achievement logic here
                // For now just basic checks
            },

            unlockAchievement: (id) => {
                set((state) => ({
                    achievements: state.achievements.map(a =>
                        a.id === id
                            ? { ...a, unlockedAt: new Date().toISOString(), progress: a.target }
                            : a
                    )
                }));
            }
        }),
        {
            name: 'analytics-storage',
        }
    )
);
