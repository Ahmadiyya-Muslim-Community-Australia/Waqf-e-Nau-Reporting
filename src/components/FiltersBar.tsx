/**
 * FiltersBar.tsx — Smart search input with column:value DSL.
 *
 * Instead of separate dropdown filters, a single search box supports:
 *
 *   term              Full-text search across all columns
 *   col:value         Filter a specific column by exact match
 *   col:"phrase"      Filter a column by exact phrase
 *
 * Examples:
 *   status:Active         → rows where status = 'Active'
 *   gender:Male           → rows where gender = 'Male'
 *   Ahmad                 → full-text search for "Ahmad"
 *   status:Active Ahmad   → status filter + full-text search
 *   city:Sydney gender:Female  → two column filters
 *   status:Active city:Melbourne male  → two filters + free text
 *
 * Uses @sqlrooms/ui Input for consistency with the SQLRooms dashboard.
 */

import { Input } from '@sqlrooms/ui';
import { Search, X, HelpCircle } from 'lucide-react';
import type { FC } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// ── Search DSL parser ────────────────────────────────────────────────

export interface ColumnFilter {
    column: string;
    value: string;
}

export interface ParsedQuery {
    /** Column-specific filters extracted from col:value tokens */
    columnFilters: ColumnFilter[];
    /** Free-text terms for cross-column search */
    freeText: string;
}

/**
 * Parse a search string into column filters and free-text terms.
 *
 * Syntax:
 *   col:value      — column equals value (exact match)
 *   col:"phrase"   — column equals phrase (for values with spaces)
 *   anything else  — free-text search term
 */
export function parseSearch(input: string): ParsedQuery {
    const columnFilters: ColumnFilter[] = [];
    const freeTextParts: string[] = [];

    // Match either quoted "phrase" or unquoted word after colon
    const tokenRegex = /(\w+):(?:(["\u201C\u201D])(.+?)\2|([^\s]+))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(input)) !== null) {
        const col = match[1].toLowerCase();
        const val = (match[3] ?? match[4]).trim();
        columnFilters.push({ column: col, value: val });
        lastIndex = match.index + match[0].length;
    }

    // Remaining text is free-text search
    const remaining = input.slice(lastIndex).trim();
    if (remaining) {
        freeTextParts.push(remaining);
    }

    return {
        columnFilters,
        freeText: freeTextParts.join(' '),
    };
}

// ── Types ────────────────────────────────────────────────────────────

export interface FilterState {
    search: string;
}

export const DEFAULT_FILTERS: FilterState = {
    search: '',
};

interface FiltersBarProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
}

// ── Component ────────────────────────────────────────────────────────

export const FiltersBar: FC<FiltersBarProps> = ({ filters, onChange }) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Smart search */}
            <div className="relative min-w-[280px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                    className="h-9 pl-9 pr-8 text-sm"
                    placeholder={t('searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => onChange({ search: e.target.value })}
                />
                <div className="group absolute right-2 top-1/2 -translate-y-1/2">
                    {filters.search ? (
                        <button
                            onClick={() => onChange({ search: '' })}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            aria-label={t('clear')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <HelpCircle className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                    )}
                    {/* Hint tooltip */}
                    <div className="pointer-events-none absolute right-0 top-full z-[999] mt-1 w-64 rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-500 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">
                            Search tips
                        </p>
                        <ul className="space-y-0.5">
                            <li><code className="text-brand">term</code> — search all columns</li>
                            <li><code className="text-brand">col:value</code> — filter a column</li>
                            <li><code className="text-brand">gender:Female</code> — filter by gender</li>
                            <li><code className="text-brand">jamaat:Alpha</code> — filter by jama'at</li>
                            <li><code className="text-brand">gender:Male Given</code> — mix filter + free-text</li>
                            <li>Columns: given_names, family_name, gender, primary_phone, jamaat, age, age_group, father_given_names, mother_given_names, grandfather_given_names, secondary_phone, father_phone, mother_phone, father_family_name, mother_family_name, grandfather_family_name</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
