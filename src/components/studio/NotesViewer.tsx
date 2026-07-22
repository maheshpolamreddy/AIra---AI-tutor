import { motion } from 'framer-motion';
import type { GeneratedNote } from '../../types';
import { FileText, Download, Printer, Star, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { ExportService } from '../../services/exportService';

interface NotesViewerProps {
    note: GeneratedNote;
    onClose?: () => void;
}

export default function NotesViewer({ note }: NotesViewerProps) {
    const [copied, setCopied] = useState(false);

    const getMarkdownContent = () => {
        return `# ${note.title}\n\n${note.sections.map(s =>
            `## ${s.heading}\n\n${s.content}\n\n**Key Points:**\n${s.highlights.map(h => `- ${h}`).join('\n')}`
        ).join('\n\n')}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getMarkdownContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        await ExportService.exportNotesToPDF(note);
    };

    const handleDownloadDOCX = async () => {
        await ExportService.exportNotesToDOCX(note);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-800"
        >
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-5 h-5" />
                            <h2 className="font-bold text-lg">{note.title}</h2>
                        </div>
                        <p className="text-purple-100 text-sm">
                            Generated from your learning session
                        </p>
                    </div>
                    {note.qualityScore && (
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                            <span className="font-medium">{note.qualityScore}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <Download className="w-4 h-4 text-blue-500" />
                    Download PDF
                </button>
                <button
                    onClick={handleDownloadDOCX}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <FileText className="w-4 h-4 text-blue-600" />
                    Download DOCX
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-gray-500/50 rounded-lg transition-all text-gray-700 dark:text-slate-200 shadow-sm"
                >
                    <Printer className="w-4 h-4 text-gray-500" />
                    Print
                </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-8">
                {note.sections.map((section, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="mb-6 last:mb-0"
                    >
                        <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                            </span>
                            {section.heading}
                        </h3>
                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-3 pl-8">
                            {section.content}
                        </p>
                        <div className="pl-8">
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Key Points:</p>
                            <ul className="space-y-1">
                                {section.highlights.map((highlight, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 shrink-0" />
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
