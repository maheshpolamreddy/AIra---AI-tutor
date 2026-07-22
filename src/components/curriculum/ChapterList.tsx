
import {
    ChevronRight,
    Play,
    CheckCircle2,
    Clock,
    BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurriculumStore } from '../../stores/curriculumStore';
import { studentRoutes } from '../../utils/routes';
import type { Chapter, Topic } from '../../types';
import { useSearchParams } from 'react-router-dom';
import { getGradeById, getSubjectById } from '../../data/schoolCurriculum';

interface ChapterListProps {
    onTopicSelect?: (topicId: string) => void;
}

const TopicItem = ({
    topic,
    gradeId,
    subjectId,
    isCompleted,
    onSelect
}: {
    topic: Topic;
    gradeId: string;
    subjectId: string;
    isCompleted: boolean;
    onSelect: () => void;
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`${studentRoutes.learn(topic.id)}?grade=${gradeId}&subject=${subjectId}`);
        onSelect();
    };



    const difficultyGradients = {
        beginner: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10',
        intermediate: 'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10',
        advanced: 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10'
    };

    const difficultyTextColors = {
        beginner: 'text-emerald-700 dark:text-emerald-400',
        intermediate: 'text-amber-700 dark:text-amber-400',
        advanced: 'text-red-700 dark:text-red-400'
    };

    const difficultyLevel = topic.difficulty || 'beginner';
    const difficultyGradient = difficultyGradients[difficultyLevel];
    const difficultyTextColor = difficultyTextColors[difficultyLevel];

    return (
        <button
            onClick={handleClick}
            className="w-full h-full flex flex-col p-5 rounded-2xl bg-white dark:bg-slate-800/80
                       hover:bg-indigo-50/30 dark:hover:bg-slate-800/90 transition-all duration-500 ease-out transform-gpu
                       border border-gray-100 dark:border-slate-700/80 hover:border-indigo-300/60 dark:hover:border-indigo-700/50
                       hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(99,102,241,0.25)]
                       group text-left active:scale-[0.98] relative overflow-hidden"
        >
            {/* Subtle background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-transparent dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Animated shimmer effect on border hover */}
            <div className="absolute top-0 left-[-100%] w-[50%] h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent group-hover:animate-[shimmer_2s_ease-in-out_infinite]" />

            <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 transform-gpu group-hover:scale-110 group-hover:shadow-[0_4px_20px_-4px_var(--tw-shadow-color)]
                               ${isCompleted
                        ? 'bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-200 dark:shadow-emerald-900/50'
                        : 'bg-gradient-to-br from-indigo-100 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400 shadow-indigo-200 dark:shadow-indigo-900/50 group-hover:-rotate-3'}`}>
                    {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 drop-shadow-sm transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                        <Play className="w-6 h-6 ml-1 drop-shadow-sm transition-transform duration-500 group-hover:scale-110" />
                    )}
                </div>
                
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gradient-to-br ${difficultyGradient} ${difficultyTextColor} ring-1 ring-black/5 dark:ring-white/5 transition-transform duration-300 group-hover:scale-105`}>
                    {topic.difficulty || 'Beginner'}
                </span>
            </div>

            <div className="flex-1 min-w-0 mt-2 relative z-10 flex flex-col">
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 text-base sm:text-lg leading-tight mb-3 line-clamp-2">
                    {topic.name}
                </h4>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/80 dark:border-slate-700/50 group-hover:border-indigo-100 dark:group-hover:border-slate-600 transition-colors duration-300">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                        <Clock className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                        {topic.duration || '30 min'}
                    </span>
                    
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-slate-800/80 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-600 transition-all duration-300 shadow-sm group-hover:shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)]">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-300 transform-gpu group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
        </button>
    );
};

const ChapterAccordion = ({
    chapter,
    gradeId,
    subjectId,
    completedTopics,
    defaultOpen = false,
    onTopicSelect
}: {
    chapter: Chapter;
    gradeId: string;
    subjectId: string;
    completedTopics: string[];
    defaultOpen?: boolean;
    onTopicSelect: (topicId: string) => void;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const completedCount = chapter.topics.filter(t => completedTopics.includes(t.id)).length;
    const progress = chapter.topics.length > 0 ? Math.round((completedCount / chapter.topics.length) * 100) : 0;
    const isChapterComplete = progress === 100;

    return (
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
                        ${isOpen ? 'border border-indigo-100 dark:border-indigo-900/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] ring-1 ring-indigo-50/50 dark:ring-indigo-900/20' : 'border border-gray-100/80 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-4 sm:gap-6 p-5 sm:p-7 transition-colors text-left group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 relative overflow-hidden"
            >
                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out z-0" />
                
                <div className="relative z-10 w-full flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-6 flex-1">
                        <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-sm flex-shrink-0
                                        ${isOpen 
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-indigo-200 dark:shadow-indigo-900/50' 
                                            : 'bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 text-gray-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-700 group-hover:text-indigo-500'}`}
                            style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-lg
                                               ${isChapterComplete
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20'}`}>
                                    Chapter {chapter.chapterNumber}
                                </span>
                                {isChapterComplete && (
                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg ring-1 ring-emerald-500/20 hidden sm:flex">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Mastered
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-300">
                                {chapter.name}
                            </h3>
                        </div>
                    </div>

                    <div className="text-right hidden sm:flex flex-col items-end gap-1.5 ml-4 flex-shrink-0">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
                                {completedCount}
                            </span>
                            <span className="text-sm font-semibold text-gray-400">
                                / {chapter.topics.length}
                            </span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            Topics Mastered
                        </div>
                    </div>
                </div>
            </button>

            {/* Premium Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800/80 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-[shimmer_2s_infinite]" />
                <div
                    className={`h-full transition-all duration-1000 ease-out relative ${isChapterComplete ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                </div>
            </div>

            {/* Accordion Content Optimized with CSS Grid */}
            <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
            >
                <div className="overflow-hidden">
                    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-900/30 border-t border-gray-100/50 dark:border-slate-800/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {chapter.topics.map((topic) => (
                                <TopicItem
                                    key={topic.id}
                                    topic={topic}
                                    gradeId={gradeId}
                                    subjectId={subjectId}
                                    isCompleted={completedTopics.includes(topic.id)}
                                    onSelect={() => onTopicSelect(topic.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ChapterList({ onTopicSelect }: ChapterListProps) {
    const getProgress = useCurriculumStore((s) => s.getProgress);
    const [searchParams] = useSearchParams();
    const gradeId = searchParams.get('grade');
    const subjectId = searchParams.get('subject');

    const grade = gradeId ? getGradeById(gradeId) : null;
    const subject = (grade && subjectId) ? getSubjectById(grade.id, subjectId) : null;

    if (!grade || !subject) {
        return null;
    }

    try {
        const progress = getProgress(grade.id, subject.id);
        const completedTopics = progress?.completedTopics || [];
        const totalTopics = subject.chapters.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0);

        if (subject.chapters.length === 0 || totalTopics === 0) {
            return (
                <div className="space-y-6">
                    <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 shadow-sm">
                        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Topics Coming Soon</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">We're currently preparing the curriculum for {subject.name}. Check back later!</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <div className="flex items-start justify-between bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-gray-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)]">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mb-3 flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${subject.color}15, ${subject.color}30)`,
                                    color: subject.color,
                                    border: `1px solid ${subject.color}30`
                                }}
                            >
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="leading-tight">{subject.name}</span>
                        </h2>
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2">
                            <span className="px-3 py-1.5 bg-gray-100/80 dark:bg-slate-800 rounded-lg border border-gray-200/50 dark:border-slate-700/50">{subject.chapters.length} Chapters</span>
                            <span className="px-3 py-1.5 bg-gray-100/80 dark:bg-slate-800 rounded-lg border border-gray-200/50 dark:border-slate-700/50">{totalTopics} Topics</span>
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                            <div className="text-4xl sm:text-5xl font-black" style={{ color: subject.color }}>
                                {progress?.progressPercent || 0}
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">%</span>
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-1">
                            Course Completed
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {subject.chapters.map((chapter, idx) => (
                        <div key={chapter.id}>
                            <ChapterAccordion
                                chapter={chapter}
                                gradeId={grade.id}
                                subjectId={subject.id}
                                completedTopics={completedTopics}
                                defaultOpen={idx === 0}
                                onTopicSelect={(topicId) => onTopicSelect?.(topicId)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering ChapterList:", error);
        return <div className="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-xl">Error rendering topics block. Check the console.</div>;
    }
}
