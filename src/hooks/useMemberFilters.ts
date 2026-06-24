/**
 * useMemberFilters.ts — Repository + Mediator + Command patterns for
 * sharing member data filtering between the Tajneed table and Analytics
 * visualisations.
 *
 * ── Architecture ──────────────────────────────────────────────────
 *
 * **Repository** — `parseFilterString()` / `buildSearchString()` /
 *   `buildWhereFromFilters()` provide a typed abstraction over the
 *   search-bar DSL and DuckDB WHERE clauses.  Both `TajneedPage` and
 *   `TajneedAnalytics` use these instead of inline parsing.
 *
 * **Mediator** — `useMemberFilters()` reads/writes filter state via
 *   the URL search params (?filter=…).  When the analytics page
 *   navigates to the table it encodes the filter in the URL; the table
 *   page reads it back and pre-populates the search bar.
 *
 * **Command** — `navigateToTable()` encapsulates the "drill down to
 *   filtered table" action that every chart element invokes on click.
 *
 * ── Usage ─────────────────────────────────────────────────────────
 *
 *   // In analytics: drill from a pie slice
 *   <Pie dataKey="value" onClick={(entry) =>
 *     navigateToTable(navigate, { gender: entry.name })
 *   } />
 *
 *   // In the data table: read the pre-applied filter
 *   const { filterString } = useMemberFilters();
 *   const [search, setSearch] = useState(filterString);
 */

import { useSearchParams } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { parseSearch } from '../components/FiltersBar';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

/** Structured filter criteria understood by both the table and charts. */
export interface MemberFilters {
    /** Exact match on the Gender column. */
    gender?: string;
    /** Exact match on the Jama'at column. */
    jamaat?: string;
    /** Exact match on the Age Group column. */
    age_group?: string;
    /** Free-text search across all columns. */
    search?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   REPOSITORY — filter ↔ string conversion utilities
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Convert structured `MemberFilters` to the search-bar DSL string.
 *
 * Values containing spaces are automatically wrapped in double quotes
 * so the parser (see `parseSearch` in FiltersBar) treats them as a
 * single token rather than splitting on the space.
 *
 * Examples:
 *   { gender: 'Male', jamaat: 'Sydney' }
 *   → "gender:Male jamaat:Sydney"
 *
 *   { jamaat: 'Gold Coast' }
 *   → 'jamaat:"Gold Coast"'
 */
export function buildSearchString(filters: MemberFilters): string {
    const parts: string[] = [];
    const enc = (v: string) => (/\s/.test(v) ? `"${v}"` : v);
    if (filters.gender) parts.push(`gender:${enc(filters.gender)}`);
    if (filters.jamaat) parts.push(`jamaat:${enc(filters.jamaat)}`);
    if (filters.age_group) parts.push(`age_group:${enc(filters.age_group)}`);
    return parts.join(' ');
}

/**
 * Parse a search-bar DSL string into structured `MemberFilters`.
 *
 * Example:
 *   "gender:Male jamaat:Sydney"
 *   → { gender: 'Male', jamaat: 'Sydney' }
 */
export function parseFilterString(search: string): MemberFilters {
    const filters: MemberFilters = {};
    if (!search) return filters;
    const { columnFilters } = parseSearch(search);
    for (const cf of columnFilters) {
        if (cf.column === 'gender') filters.gender = cf.value;
        if (cf.column === 'jamaat') filters.jamaat = cf.value;
        if (cf.column === 'age_group') filters.age_group = cf.value;
    }
    return filters;
}

/**
 * Build a safe DuckDB `WHERE` clause from structured filters.
 * Escapes single quotes to prevent SQL injection from user input.
 *
 * Example:
 *   { gender: 'Male', jamaat: "Sydney" }
 *   → "WHERE gender = 'Male' AND jamaat = 'Sydney'"
 */
export function buildWhereFromFilters(filters: MemberFilters): string {
    const clauses: string[] = [];
    const esc = (s: string) => s.replace(/'/g, "''");

    if (filters.gender) clauses.push(`gender = '${esc(filters.gender)}'`);
    if (filters.jamaat) clauses.push(`jamaat = '${esc(filters.jamaat)}'`);
    if (filters.age_group) clauses.push(`age_group = '${esc(filters.age_group)}'`);

    if (filters.search) {
        const term = esc(filters.search);
        clauses.push(`(
      given_names ILIKE '%${term}%'
      OR family_name ILIKE '%${term}%'
      OR gender ILIKE '%${term}%'
      OR primary_phone ILIKE '%${term}%'
      OR secondary_phone ILIKE '%${term}%'
      OR jamaat ILIKE '%${term}%'
      OR age::VARCHAR ILIKE '%${term}%'
      OR age_group ILIKE '%${term}%'
      OR father_given_names ILIKE '%${term}%'
      OR father_family_name ILIKE '%${term}%'
      OR mother_given_names ILIKE '%${term}%'
      OR mother_family_name ILIKE '%${term}%'
      OR grandfather_given_names ILIKE '%${term}%'
      OR grandfather_family_name ILIKE '%${term}%'
    )`);
    }

    return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

/* ═══════════════════════════════════════════════════════════════════
   MEDIATOR — URL-based filter state
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Hook that reads/writes filter state via the `?filter=` URL search
 * parameter.  This lets the analytics page "pass" filter context to the
 * data table page through the URL (Mediator pattern).
 */
export function useMemberFilters() {
    const [searchParams, setSearchParams] = useSearchParams();

    /** The raw filter string from the URL (?filter=…). */
    const filterString = searchParams.get('filter') || '';

    /** Parse the current URL filter into structured filters. */
    const filters = parseFilterString(filterString);

    /**
     * Update the URL filter parameter.
     * Pass `MemberFilters` and it will be serialised to the search DSL.
     */
    const setFilters = (next: MemberFilters) => {
        const search = buildSearchString(next);
        setSearchParams(search ? { filter: search } : {}, { replace: true });
    };

    /** Clear all filters from the URL. */
    const clearFilters = () => {
        setSearchParams({}, { replace: true });
    };

    return { filterString, filters, setFilters, clearFilters } as const;
}

/* ═══════════════════════════════════════════════════════════════════
   COMMAND — drill-down navigation
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Navigate to the data-table page with the given filters encoded in
 * the URL.  This is the "command" that every chart element fires when
 * clicked — implementing the **Command pattern** for drill-down.
 *
 * @param navigate  React Router's `navigate` function.
 * @param filters   Structured filter criteria to apply.
 */
export function navigateToTable(
    navigate: NavigateFunction,
    filters: MemberFilters,
): void {
    const search = buildSearchString(filters);
    const qs = search ? `?filter=${encodeURIComponent(search)}` : '';
    navigate(`/tajneed/data${qs}`);
}
