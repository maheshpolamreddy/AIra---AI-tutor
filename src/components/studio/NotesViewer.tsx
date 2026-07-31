import { motion } from 'framer-motion';
import type { GeneratedNote } from '../../types';
import { BookOpen, Download, Printer, Star, Copy, Check, Layers } from 'lucide-react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExportService } from '../../services/exportService';
import { NotesDiagram } from './NotesDiagram';

interface NotesViewerProps {
    note: GeneratedNote;
    onClose?: () => void;
}

function sectionToMarkdown(section: GeneratedNote['sections'][number]): string {
    const diagramLines = (section.diagrams || [])
        .map(d => {
            const nodes = d.nodes.map(n => `- ${n.label}${n.detail ? ` (${n.detail})` : ''}`).join('\n');
            return `### Diagram: ${d.title}\n${d.caption ? `${d.caption}\n` : ''}${nodes}`;
        })
        .join('\n\n');
    return `## ${section.heading}\n\n${section.content}\n\n**Key Points:**\n${section.highlights.map(h => `- ${h}`).join('\n')}${diagramLines ? `\n\n${diagramLines}` : ''}`;
}

export default function NotesViewer({ note }: NotesViewerProps) {
    const [copied, setCopied] = useState(false);
    const diagramCount = useMemo(
        () => note.sections.reduce((n, s) => n + (s.diagrams?.length || 0), 0),
        [note.sections],
    );

    const getMarkdownContent = () => {
        const meta = [
            note.subjectArea ? `**Subject:** ${note.subjectArea}` : null,
            note.gradeLevel ? `**Level:** ${note.gradeLevel}` : null,
            note.chapterName ? `**Chapter:** ${note.chapterName}` : null,
        ].filter(Boolean).join(' · ');
        return `# ${note.title}\n\n${meta ? `${meta}\n\n` : ''}${note.sections.map(sectionToMarkdown).join('\n\n')}`;
    };

    const handleCopy = () => {
        void navigator.clipboard.writeText(getMarkdownContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        await ExportService.exportNotesToPDF(note);
    };

    const handleDownloadDOCX = async () => {
        await ExportService.exportNotesToDOCX(note);
    };

    const metaBits = [
        note.subjectArea,
        note.gradeLevel,
        note.chapterName,
    ].filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-800"
        >
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 text-white p-5 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-fuchsia-300/20 rounded-full blur-2xl" />
                <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen className="w-5 h-5 shrink-0" />
                            <h2 className="font-bold text-lg sm:text-xl leading-snug">{note.title}</h2>
                        </div>
                        <p className="text-violet-100 text-sm">
                            Detailed notes grounded in your {note.topicName} lesson
                            {diagramCount > 0 ? ` · ${diagramCount} diagram${diagramCount === 1 ? '' : 's'}` : ''}
                        </p>
                        {metaBits.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {metaBits.map(bit => (
                                    <span
                                        key={bit}
                                        className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
                                    >
                                        {bit}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    {note.qualityScore ? (
                        <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg shrink-0">
                            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                            <span className="font-semibold text-sm">{note.qualityScore}%</span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 p-3 border-b border-gray-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-violet-500" />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                    type="button"
                    onClick={() => void handleDownloadPDF()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <Download className="w-4 h-4 text-blue-500" />
                    Download PDF
                </button>
                <button
                    type="button"
                    onClick={() => void handleDownloadDOCX()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <Layers className="w-4 h-4 text-blue-600" />
                    Download DOCX
                </button>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-gray-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <Printer className="w-4 h-4 text-gray-500" />
                    Print
                </button>
            </div>

            <div className="p-4 sm:p-7 space-y-7">
                {note.sections.map((section, index) => (
                    <motion.section
                        key={`${section.heading}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.06, 0.36) }}
                        className="relative"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <span className="mt-0.5 w-7 h-7 shrink-0 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                            </span>
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-50 leading-snug pt-0.5">
                                {section.heading}
                            </h3>
                        </div>

                        <div className="pl-0 sm:pl-10 notes-md prose-notes text-slate-700 dark:text-slate-300 leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0 text-[15px] leading-relaxed">{children}</p>,
                                    strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
                                    ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-[15px] leading-relaxed">{children}</li>,
                                    code: ({ children }) => (
                                        <code className="rounded bg-violet-50 dark:bg-violet-950/40 px-1 py-0.5 text-[13px] text-violet-800 dark:text-violet-200">
                                            {children}
                                        </code>
                                    ),
                                }}
                            >
                                {section.content}
                            </ReactMarkdown>
                        </div>

                        {(section.diagrams || []).map((diagram, di) => (
                            <div key={`${diagram.title}-${di}`} className="sm:pl-10">
                                <NotesDiagram diagram={diagram} />
                            </div>
                        ))}

                        {section.highlights.length > 0 ? (
                            <div className="mt-3 sm:pl-10">
                                <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-2">
                                    Key points
                                </p>
                                <ul className="space-y-1.5 rounded-xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-950/20 p-3">
                                    {section.highlights.map((highlight, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                                            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-2 shrink-0" />
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {index < note.sections.length - 1 ? (
                            <div className="mt-6 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                        ) : null}
                    </motion.section>
                ))}
            </div>
        </motion.div>
    );
}
