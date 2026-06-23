/**
 * TajneedPage.tsx — Members data table with smart search.
 *
 * Uses @sqlrooms/data-table QueryDataTable for auto-columns from Arrow schema,
 * built-in pagination, sorting, and column visibility controls.
 * A FiltersBar above the table provides a single search input that supports
 * col:value syntax for column-specific filtering alongside full-text search.
 *
 * The WHERE clause is built dynamically by parsing the search query into
 * column filters and free-text terms via the parseSearch() DSL.
 */

import { QueryDataTable } from '@sqlrooms/data-table';
import { Badge } from '@sqlrooms/ui';
import { useState, useEffect, type FC } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { FiltersBar, parseSearch, type FilterState, DEFAULT_FILTERS } from './FiltersBar';
import { TableIcon, Search, Filter } from 'lucide-react';

// ── SQL helpers ──────────────────────────────────────────────────────

/**
 * Escape a string for safe use in a DuckDB LIKE pattern.
 */
function escapeLike(value: string): string {
    return value.replace(/[%_]/g, '\\$&');
}

/**
 * Known column names in the members table that can be used in col:value syntax.
 * Lowercase keys match the parsed column filter keys.
 */
const KNOWN_COLUMNS: Record<string, string> = {
    given_names: 'given_names',
    given: 'given_names',
    first_name: 'given_names',
    family_name: 'family_name',
    family: 'family_name',
    surname: 'family_name',
    last_name: 'family_name',
    gender: 'gender',
    phone: 'primary_phone',
    primary_phone: 'primary_phone',
    secondary_phone: 'secondary_phone',
    jamaat: 'jamaat',
    age: 'age',
    age_group: 'age_group',
    father_given_names: 'father_given_names',
    father_family_name: 'father_family_name',
    father_phone: 'father_phone',
    mother_given_names: 'mother_given_names',
    mother_family_name: 'mother_family_name',
    mother_phone: 'mother_phone',
    grandfather_given_names: 'grandfather_given_names',
    grandfather_family_name: 'grandfather_family_name',
};

/**
 * Build a SQL WHERE clause from a parsed search query.
 */
function buildWhere(search: string): string {
    const { columnFilters, freeText } = parseSearch(search);
    const clauses: string[] = [];

    // Column-specific filters (col:value)
    for (const cf of columnFilters) {
        const col = KNOWN_COLUMNS[cf.column];
        if (col) {
            const val = cf.value.replace(/'/g, "''");
            clauses.push(`${col} = '${val}'`);
        }
    }

    // Free-text search across all columns
    if (freeText) {
        const term = escapeLike(freeText);
        clauses.push(
            `(given_names ILIKE '%${term}%'`
            + ` OR family_name ILIKE '%${term}%'`
            + ` OR gender ILIKE '%${term}%'`
            + ` OR primary_phone ILIKE '%${term}%'`
            + ` OR secondary_phone ILIKE '%${term}%'`
            + ` OR jamaat ILIKE '%${term}%'`
            + ` OR age::VARCHAR ILIKE '%${term}%'`
            + ` OR age_group ILIKE '%${term}%'`
            + ` OR father_given_names ILIKE '%${term}%'`
            + ` OR father_family_name ILIKE '%${term}%'`
            + ` OR father_phone ILIKE '%${term}%'`
            + ` OR mother_given_names ILIKE '%${term}%'`
            + ` OR mother_family_name ILIKE '%${term}%'`
            + ` OR mother_phone ILIKE '%${term}%'`
            + ` OR grandfather_given_names ILIKE '%${term}%'`
            + ` OR grandfather_family_name ILIKE '%${term}%')`,
        );
    }

    return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

// ── Debounce hook ────────────────────────────────────────────────────

/**
 * Returns a debounced version of the value.
 * The returned value updates only after `delay` ms of inactivity.
 *
 * TODO: Replace with useDebouncedValue from @sqlrooms/ui once
 *       it becomes available in the installed version.
 */
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// ── Component ────────────────────────────────────────────────────────

export const TajneedPage: FC = () => {
    const { t } = useLanguage();
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

    // Debounce search by 300ms so the query doesn't fire on every keystroke
    const debouncedSearch = useDebounce(filters.search, 300);

    const { columnFilters, freeText } = parseSearch(debouncedSearch);
    const hasActiveFilters = debouncedSearch.trim().length > 0;
    const whereClause = buildWhere(debouncedSearch);
    const queryKey = `${debouncedSearch}`;

    const query = `
        SELECT
          given_names           AS "Given Names",
          family_name           AS "Family Name",
          gender                AS "Gender",
          primary_phone         AS "Primary Phone",
          secondary_phone       AS "Secondary Phone",
          jamaat                AS "Jama\'at",
          age                   AS "Age",
          age_group             AS "Age Group",
          father_given_names    AS "Father\'s Given Names",
          father_family_name    AS "Father\'s Family Name",
          father_phone          AS "Father\'s Phone",
          mother_given_names    AS "Mother\'s Given Names",
          mother_family_name    AS "Mother\'s Family Name",
          mother_phone          AS "Mother\'s Phone",
          grandfather_given_names AS "Grandfather\'s Given Names",
          grandfather_family_name AS "Grandfather\'s Family Name"
        FROM members
        ${whereClause}
        ORDER BY family_name, given_names
    `;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                    <TableIcon className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                        {t('title')}
                    </h2>
                </div>
            </div>

            {/* Filters bar */}
            <div className="border-b border-slate-200 px-6 py-3 dark:border-slate-700">
                <FiltersBar filters={filters} onChange={setFilters} />
                {/* Active column filter badges */}
                {hasActiveFilters && columnFilters.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {columnFilters.map((cf, i) => (
                            <Badge
                                key={i}
                                variant="outline"
                                className="gap-1 bg-brand-bg text-brand-dark"
                            >
                                <Filter className="h-3 w-3" />
                                {cf.column}: <strong>{cf.value}</strong>
                            </Badge>
                        ))}
                        {freeText && (
                            <Badge variant="secondary" className="gap-1">
                                <Search className="h-3 w-3" />
                                searching &quot;{freeText}&quot;
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Data table — fills remaining height */}
            <div className="flex-1 overflow-hidden px-6 py-4">
                <div className="wn-table h-full">
                    <QueryDataTable
                        key={queryKey}
                        query={query}
                        queryKeyComponents={[queryKey]}
                        fontSize="text-xs"
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
};
