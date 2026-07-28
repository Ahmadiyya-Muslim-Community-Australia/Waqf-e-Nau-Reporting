/**
 * ReportTemplate.tsx — Shared report page layout.
 *
 * Provides a consistent wrapper: header, export toolbar, and a
 * ref-scoped content area for PDF capture.
 */

import { useRef, type FC, type ReactNode } from 'react';
import { ExportToolbar } from './ExportToolbar';

interface ReportTemplateProps {
  /** Page title */
  title: string;
  /** Page subtitle / description */
  subtitle?: string;
  /** Report content (charts, tables, etc.) */
  children: ReactNode;
  /** Called when CSV export is requested */
  onCsvExport?: () => void;
  /** Hide export toolbar (e.g. for loading state) */
  hideToolbar?: boolean;
}

export const ReportTemplate: FC<ReportTemplateProps> = ({
  title,
  subtitle,
  children,
  onCsvExport,
  hideToolbar,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col overflow-y-auto px-6 py-8">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {!hideToolbar && (
          <ExportToolbar
            title={title}
            onCsvExport={onCsvExport}
            contentRef={contentRef as React.RefObject<HTMLElement | null>}
          />
        )}
      </div>

      {/* ── Content (PDF capture scope) ── */}
      <div
        ref={contentRef}
        className="flex-1 space-y-8"
      >
        {children}
      </div>
    </div>
  );
};
