/**
 * ExportToolbar.tsx — Print / CSV / PDF buttons shared across reports and analytics.
 */

import { useState, useCallback, useRef, type FC } from 'react';
import { FileDown, FileText, Printer } from 'lucide-react';
import { cn } from '@sqlrooms/ui';
import { downloadPdf } from '../utils/exportPdf';

interface ExportToolbarProps {
  /** Title used for the PDF/CSV filename. */
  title: string;
  /** Called when CSV export is requested. */
  onCsvExport?: () => void;
  /** Optional ref to the content element for PDF capture. Falls back to toolbar parent. */
  contentRef?: React.RefObject<HTMLElement | null>;
  /** Optional custom CSS class */
  className?: string;
}

export const ExportToolbar: FC<ExportToolbarProps> = ({
  title,
  onCsvExport,
  contentRef,
  className,
}) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const localRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePdf = useCallback(async () => {
    const el = contentRef?.current;
    if (!el) return;
    setPdfLoading(true);
    setPdfProgress(0);
    try {
      await downloadPdf(el, title, setPdfProgress);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setPdfLoading(false);
      setPdfProgress(0);
    }
  }, [title, contentRef]);

  /* ── Pill button styles ─────────────────────────────────────── */
  const btnBase = [
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium',
    'transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ];

  return (
    <div
      ref={localRef}
      className={cn('print:hidden flex items-center gap-2', className)}
    >
      {/* Print */}
      <button
        onClick={handlePrint}
        className={cn(...btnBase, 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')}
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </button>

      {/* CSV */}
      {onCsvExport && (
        <button
          onClick={onCsvExport}
          className={cn(...btnBase, 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700')}
        >
          <FileDown className="h-3.5 w-3.5" />
          CSV
        </button>
      )}

      {/* PDF */}
      <button
        onClick={handlePdf}
        disabled={pdfLoading}
        className={cn(...btnBase, 'bg-brand/10 text-brand hover:bg-brand/20 dark:text-brand-light dark:hover:bg-brand/20')}
      >
        <FileText className="h-3.5 w-3.5" />
        {pdfLoading ? `PDF ${pdfProgress}%` : 'PDF'}
      </button>
    </div>
  );
};
