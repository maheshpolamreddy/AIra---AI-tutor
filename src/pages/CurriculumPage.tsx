import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Search
} from 'lucide-react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCurriculumStore } from '../stores/curriculumStore';
import { useAuthStore } from '../stores/authStore';
import { getRoutesForRole } from '../utils/routes';
import { GradeSelector, SubjectGrid, ChapterList } from '../components/curriculum';
import CurriculumSearch from '../components/curriculum/CurriculumSearch';
import { getGradeById, getSubjectById } from '../data/schoolCurriculum';

import Breadcrumbs from '../components/common/Breadcrumbs';

type ViewState = 'grades' | 'subjects' | 'chapters';

export default function CurriculumPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const role = useAuthStore((s) => s.role);
    const routes = getRoutesForRole(role);

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const gradeId = searchParams.get('grade');
    const subjectId = searchParams.get('subject');

    // Synchronously resolve grade/subject strictly from URL search params (Single Source of Truth) to prevent single-frame flickering or missing breadcrumbs
    const activeGrade = gradeId ? getGradeById(gradeId) : null;
    const activeSubject = (activeGrade && subjectId) ? getSubjectById(activeGrade.id, subjectId) : null;

    // Sync URL search params -> Zustand store selection (Read state directly without subscribing to avoid double render loops)
    useEffect(() => {
        const store = useCurriculumStore.getState();
        if (gradeId) {
            if (!store.selectedGrade || store.selectedGrade.id !== gradeId) {
                store.setSelectedGrade(gradeId);
            }
            // Fetch updated state after potential grade selection change
            const updatedStore = useCurriculumStore.getState();
            if (subjectId) {
                if (!updatedStore.selectedSubject || updatedStore.selectedSubject.id !== subjectId) {
                    updatedStore.setSelectedSubject(subjectId);
                }
            } else {
                if (updatedStore.selectedSubject) {
                    updatedStore.setSelectedSubject(null);
                }
            }
        } else {
            if (store.selectedGrade || store.selectedSubject) {
                store.clearSelection();
            }
        }
    }, [gradeId, subjectId]);

    // Apply navigation state from breadcrumb deep links (e.g. from Teaching page) — before paint so the correct section shows immediately
    const navState = location.state as { gradeId?: string; subjectId?: string } | null;
    const appliedRef = useRef<string | null>(null);
    useLayoutEffect(() => {
        if (!navState?.gradeId) return;
        const key = `${navState.gradeId}:${navState.subjectId ?? ''}`;
        if (appliedRef.current === key) return;
        appliedRef.current = key;
        
        const params: Record<string, string> = { grade: navState.gradeId };
        if (navState.subjectId != null) {
            params.subject = navState.subjectId;
        }
        setSearchParams(params);
    }, [navState?.gradeId, navState?.subjectId, setSearchParams]);

    // Determine current view based on URL search parameters (Single Source of Truth)
    const getCurrentView = (): ViewState => {
        if (subjectId) return 'chapters';
        if (gradeId) return 'subjects';
        return 'grades';
    };

    const currentView = getCurrentView();

    const handleBack = () => {
        if (currentView === 'chapters') {
            setSearchParams({ grade: activeGrade?.id || '' });
        } else if (currentView === 'subjects') {
            setSearchParams({});
        } else {
            navigate(routes.dashboard);
        }
    };

    // Breadcrumb items
    const getBreadcrumbs = () => {
        const items = [
            { label: 'Curriculum', onClick: () => setSearchParams({}) }
        ];

        if (activeGrade) {
            items.push({
                label: activeGrade.name,
                onClick: () => setSearchParams({ grade: activeGrade.id })
            });
        }

        if (activeSubject) {
            items.push({
                label: activeSubject.name,
                onClick: () => { }
            });
        }

        return items;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="w-full">
            <div className="min-h-screen min-h-[100dvh] flex flex-col relative overflow-hidden transition-colors duration-500">
                {/* Enhanced Background elements */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-700" />

                    <div className="absolute inset-0 opacity-[0.8] dark:opacity-[0.5] transition-opacity duration-700">
                        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_70%)]" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(168,85,247,0.2)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)]" />
                        <div className="absolute top-[30%] right-[-20%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)]" />
                    </div>

                    <div
                        className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse"
                    />

                    {/* Noise/Grain Texture for Depth */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat',
                            backgroundSize: '128px 128px'
                        }}
                    />
                </div>

                {/* Header Area */}
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50 safe-top transition-colors duration-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Left side */}
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 
                                             transition-colors"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>

                                {/* Breadcrumbs */}
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={routes.dashboard}
                                        className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-80 transition-all px-1"
                                    >
                                        Aɪra
                                    </Link>
                                    <Breadcrumbs
                                        role={role}
                                        homePath={routes.dashboard}
                                        items={breadcrumbs}
                                        className="hidden sm:flex"
                                    />
                                </div>
                            </div>

                            {/* Right side */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
                                             transition-colors flex items-center gap-2 group"
                                    aria-label="Search curriculum"
                                >
                                    <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors hidden sm:block pr-1">Search...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Search Bar Overlay Component */}
                <CurriculumSearch
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                />

                {/* Main content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                    <AnimatePresence mode="wait">
                        {currentView === 'grades' && (
                            <motion.div
                                key="grades"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <GradeSelector onGradeSelect={(id) => setSearchParams({ grade: id })} />
                            </motion.div>
                        )}

                        {currentView === 'subjects' && (
                            <motion.div
                                key="subjects"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <SubjectGrid onSubjectSelect={(id) => setSearchParams({ grade: gradeId || '', subject: id })} />
                            </motion.div>
                        )}

                        {currentView === 'chapters' && (
                            <motion.div
                                key="chapters"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <ChapterList />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>


            </div>
        </div>
    );
}
