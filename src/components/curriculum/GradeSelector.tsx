import {
    GraduationCap,
    BookOpen,
    Star,
    ChevronRight
} from 'lucide-react';
import { useCurriculumStore } from '../../stores/curriculumStore';
import { schoolGrades } from '../../data/schoolCurriculum';
import type { SchoolGrade, GradeLevel } from '../../types';

interface GradeSelectorProps {
    onGradeSelect?: (gradeId: string) => void;
}

const levelConfig: Record<GradeLevel, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    'middle': {
        label: 'Middle School',
        color: '#2C8CFF',
        bgColor: 'rgba(44, 140, 255, 0.1)',
        icon: <BookOpen className="w-4 h-4" />
    },
    'secondary': {
        label: 'Secondary',
        color: '#8A4FFF',
        bgColor: 'rgba(138, 79, 255, 0.1)',
        icon: <Star className="w-4 h-4" />
    },
    'senior-secondary': {
        label: 'Senior Secondary',
        color: '#FF9E2C',
        bgColor: 'rgba(255, 158, 44, 0.1)',
        icon: <GraduationCap className="w-4 h-4" />
    }
};

const GradeCard = ({ grade, onClick, progress }: { grade: SchoolGrade; onClick: () => void; progress: number }) => {
    const config = levelConfig[grade.level];

    return (
        <div 
            onClick={onClick}
            className="w-full bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden
                       shadow-[0_4px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
                       border border-slate-100/80 dark:border-slate-800
                       transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                       hover:shadow-[0_16px_48px_rgba(0,0,0,0.13)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]
                       hover:-translate-y-2 group cursor-pointer flex flex-col h-full min-h-[310px] sm:min-h-[350px]"
        >
            {/* Inset Image Section - Natural, Vivid Colors */}
            <div className="relative w-full h-[155px] sm:h-[190px] overflow-hidden shrink-0">
                {grade.image ? (
                    <img 
                        src={grade.image} 
                        alt={grade.name}
                        className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 ease-out"
                        style={{ filter: 'saturate(1.15) contrast(1.05)' }}
                    />
                ) : (
                    <div 
                        className="w-full h-full"
                        style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}88)` }}
                    />
                )}

                {/* Progress Badge */}
                {progress > 0 && (
                    <div 
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl border border-white/30 shadow-md flex items-center gap-1.5 backdrop-blur-sm"
                        style={{ backgroundColor: `${config.color}dd` }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-black text-white tracking-wider uppercase">{progress}% Done</span>
                    </div>
                )}

                {/* Grade Level Badge - Top Left */}
                <div 
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/30 shadow-sm text-white"
                    style={{ backgroundColor: `${config.color}cc` }}
                >
                    {config.label}
                </div>
            </div>

            {/* Vivid Accent Line */}
            <div 
                className="h-1 w-full shrink-0"
                style={{ background: `linear-gradient(90deg, ${config.color}, ${config.color}55)` }}
            />

            {/* Content Section */}
            <div className="flex-1 flex flex-col p-5 sm:p-6 relative">
                {/* Subtle background glow */}
                <div 
                    className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none blur-2xl"
                    style={{ backgroundColor: config.color }}
                />

                {/* Title Row */}
                <div className="flex items-center gap-3 mb-1.5">
                    <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ 
                            backgroundColor: `${config.color}18`,
                            color: config.color,
                            border: `1.5px solid ${config.color}30`
                        }}
                    >
                        {config.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight group-hover:translate-x-1 transition-transform duration-300 leading-tight">
                        {grade.name}
                    </h3>
                </div>

                {/* Subjects count */}
                <p className="text-[13px] text-slate-400 dark:text-slate-500 font-semibold ml-12 mb-auto">
                    {grade.subjects.length} Core Subjects
                </p>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span 
                        className="px-3.5 py-1.5 text-[10px] font-black rounded-full uppercase tracking-wider"
                        style={{ 
                            backgroundColor: `${config.color}14`,
                            color: config.color,
                            border: `1.5px solid ${config.color}25`
                        }}
                    >
                        Ages {grade.ageGroup}
                    </span>
                    
                    {/* Arrow Button */}
                    <div className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:-rotate-45 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                        {/* Background circle - default slate */}
                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-full transition-opacity duration-300 group-hover:opacity-0" />
                        {/* Colored background on hover */}
                        <div 
                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ backgroundColor: config.color }}
                        />
                        <ChevronRight className="relative w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-white transition-colors duration-300 z-10" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function GradeSelector({ onGradeSelect }: GradeSelectorProps) {
    const { setSelectedGrade, getGradeProgress } = useCurriculumStore();

    const handleGradeClick = (gradeId: string) => {
        if (onGradeSelect) {
            onGradeSelect(gradeId);
        } else {
            setSelectedGrade(gradeId);
        }
    };

    // Group grades by level
    const gradesByLevel = schoolGrades.reduce((acc, grade) => {
        if (!acc[grade.level]) acc[grade.level] = [];
        acc[grade.level].push(grade);
        return acc;
    }, {} as Record<GradeLevel, SchoolGrade[]>);

    const levelOrder: GradeLevel[] = ['middle', 'secondary', 'senior-secondary'];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Select Your Class
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Choose your grade level to access personalized learning materials and resources.
                </p>
            </div>

            {/* Grades by level */}
            {levelOrder.map((level) => {
                const grades = gradesByLevel[level];
                if (!grades || grades.length === 0) return null;

                const config = levelConfig[level];

                return (
                    <div key={level} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div
                                className="p-2.5 rounded-xl shadow-sm"
                                style={{ backgroundColor: config.bgColor }}
                            >
                                <span style={{ color: config.color }}>{config.icon}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    {config.label}
                                </h2>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    {grades.length} {grades.length === 1 ? 'Grade' : 'Grades'} available
                                </p>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                            {grades.map((grade) => (
                                <div key={grade.id} className="h-full w-full">
                                    <GradeCard
                                        grade={grade}
                                        onClick={() => handleGradeClick(grade.id)}
                                        progress={getGradeProgress(grade.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
