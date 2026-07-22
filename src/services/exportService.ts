import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import type { GeneratedNote, Flashcard, GeneratedSummary } from '../types';

/**
 * ExportService
 * Centralized utility for exporting learning artifacts to various formats.
 */
export const ExportService = {
    /**
     * Export notes to PDF with professional formatting
     */
    async exportNotesToPDF(note: GeneratedNote): Promise<void> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 25;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(75, 85, 99); // Slate-600
        doc.setFont('helvetica', 'bold');
        doc.text(note.title, margin, currentY);
        currentY += 10;

        // Subtitle / Topic
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.setFont('helvetica', 'normal');
        doc.text(`Topic: ${note.topicName} | Created: ${new Date(note.createdAt).toLocaleDateString()}`, margin, currentY);
        currentY += 15;

        // Divider
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        // Sections
        note.sections.forEach((section, index) => {
            // Check if we need a new page
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }

            // Heading
            doc.setFontSize(16);
            doc.setTextColor(31, 41, 55); // Gray-800
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${section.heading}`, margin, currentY);
            currentY += 10;

            // Content
            doc.setFontSize(11);
            doc.setTextColor(55, 65, 81); // Gray-700
            doc.setFont('helvetica', 'normal');
            const contentLines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
            doc.text(contentLines, margin, currentY);
            currentY += (contentLines.length * 6) + 8;

            // Highlights
            if (section.highlights && section.highlights.length > 0) {
                doc.setFontSize(10);
                doc.setTextColor(142, 124, 195); // Purple-600 (Aria Accent)
                doc.setFont('helvetica', 'bold');
                doc.text('Key Highlights:', margin + 5, currentY);
                currentY += 6;

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(75, 85, 99);
                section.highlights.forEach(highlight => {
                    const highlightLines = doc.splitTextToSize(`• ${highlight}`, pageWidth - margin * 2 - 10);
                    doc.text(highlightLines, margin + 10, currentY);
                    currentY += (highlightLines.length * 5) + 2;
                });
                currentY += 8;
            }
        });

        // Footer
        const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(156, 163, 175);
            doc.text(`Page ${i} of ${pageCount} | Aɪra Learning Studio`, pageWidth / 2, 285, { align: 'center' });
        }

        doc.save(`${note.title.toLowerCase().replace(/\s+/g, '-')}-notes.pdf`);
    },

    /**
     * Export notes to DOCX format
     */
    async exportNotesToDOCX(note: GeneratedNote): Promise<void> {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: note.title,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: `Topic: ${note.topicName} | Created: ${new Date(note.createdAt).toLocaleDateString()}`,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: "" }), // Spacing
                    ...note.sections.flatMap((section, index) => [
                        new Paragraph({
                            text: `${index + 1}. ${section.heading}`,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 400, after: 200 },
                        }),
                        new Paragraph({
                            text: section.content,
                            spacing: { after: 200 },
                        }),
                        ...section.highlights.map(h => new Paragraph({
                            text: `• ${h}`,
                            bullet: { level: 0 },
                        })),
                        new Paragraph({ text: "" }),
                    ]),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.toLowerCase().replace(/\s+/g, '-')}-notes.docx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Export Mind Map as PNG
     */
    async exportToPNG(elementId: string, filename: string): Promise<void> {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher resolution
                logging: false,
                useCORS: true,
            });

            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.png`;
            a.click();
        } catch (error) {
            console.error('Failed to export to PNG:', error);
            throw error;
        }
    },

    /**
     * Export Flashcards to PDF (Print-ready layout)
     */
    async exportFlashcardsToPDF(cards: Flashcard[], topicName: string): Promise<void> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const cardWidth = (pageWidth - margin * 3) / 2;
        const cardHeight = 60;
        let currentX = margin;
        let currentY = 25;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55);
        doc.text(`${topicName} - Flashcards`, margin, 15);

        cards.forEach((card, index) => {
            // Check if we need a new row or new page
            if (index > 0 && index % 2 === 0) {
                currentX = margin;
                currentY += cardHeight + 10;
            } else if (index > 0) {
                currentX = margin + cardWidth + 10;
            }

            if (currentY + cardHeight > 280) {
                doc.addPage();
                currentY = 20;
                currentX = margin;
            }

            // Card frame
            doc.setDrawColor(209, 213, 219);
            doc.setLineWidth(0.5);
            doc.rect(currentX, currentY, cardWidth, cardHeight);

            // Question
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(75, 85, 99);
            doc.text('QUESTION:', currentX + 5, currentY + 7);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(31, 41, 55);
            const questionLines = doc.splitTextToSize(card.question, cardWidth - 10);
            doc.text(questionLines, currentX + 5, currentY + 13);

            // Divider
            doc.setDrawColor(243, 244, 246);
            doc.line(currentX + 5, currentY + 30, currentX + cardWidth - 5, currentY + 30);

            // Answer
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(75, 85, 99);
            doc.text('ANSWER:', currentX + 5, currentY + 37);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(16, 185, 129); // Green-600
            const answerLines = doc.splitTextToSize(card.answer, cardWidth - 10);
            doc.text(answerLines, currentX + 5, currentY + 43);
        });

        doc.save(`${topicName.toLowerCase().replace(/\s+/g, '-')}-flashcards.pdf`);
    },

    /**
     * Export Summary to PDF
     */
    async exportSummaryToPDF(summary: GeneratedSummary): Promise<void> {
        const noteAdapter: GeneratedNote = {
            id: summary.id,
            sessionId: summary.sessionId,
            topicName: summary.topicName,
            title: summary.title,
            content: summary.overview,
            createdAt: summary.createdAt,
            userDoubts: [],
            sections: [
                {
                    heading: 'Overview',
                    content: summary.overview,
                    highlights: summary.keyTakeaways
                },
                ...(summary.furtherReading ? [{
                    heading: 'Further Reading',
                    content: summary.furtherReading.join(', '),
                    highlights: []
                }] : [])
            ]
        };
        await this.exportNotesToPDF(noteAdapter);
    },

    /**
     * Export Summary to DOCX
     */
    async exportSummaryToDOCX(summary: GeneratedSummary): Promise<void> {
        const noteAdapter: GeneratedNote = {
            id: summary.id,
            sessionId: summary.sessionId,
            topicName: summary.topicName,
            title: summary.title,
            content: summary.overview,
            createdAt: summary.createdAt,
            userDoubts: [],
            sections: [
                {
                    heading: 'Overview',
                    content: summary.overview,
                    highlights: summary.keyTakeaways
                },
                ...(summary.furtherReading ? [{
                    heading: 'Further Reading',
                    content: summary.furtherReading.join(', '),
                    highlights: []
                }] : [])
            ]
        };
        await this.exportNotesToDOCX(noteAdapter);
    }
};
