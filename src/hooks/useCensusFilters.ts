/**
 * useCensusFilters.ts — Drill-down navigation for Census Analytics → Census Data.
 *
 * Maps chart-click events to SQL WHERE clauses on census columns.
 *
 * Uses a **module-level shared state** (simple export + subscribe pattern)
 * instead of URL params to communicate between CensusAnalytics and CensusPage.
 * This avoids React Router re-render issues in v7 where `useSearchParams()`
 * doesn't always trigger updates when navigating within the same SPA panel.
 */

import type { NavigateFunction } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   SHARED STATE — module-level event bus for chart drill-down
   ═══════════════════════════════════════════════════════════════════ */

type Listener = (filters: CensusFilter[]) => void;

let _sharedFilters: CensusFilter[] = [];
const _listeners = new Set<Listener>();

/** Subscribe to chart filter changes. Returns an unsubscribe function. */
export function subscribeToChartFilters(fn: Listener): () => void {
    _listeners.add(fn);
    // Immediately call with current value (if any)
    if (_sharedFilters.length > 0) fn(_sharedFilters);
    return () => { _listeners.delete(fn); };
}

/** Publish new chart filters — called by CensusAnalytics before navigating. */
export function publishChartFilters(filters: CensusFilter[]): void {
    _sharedFilters = filters;
    _listeners.forEach((fn) => fn(filters));
}

/** Read the current chart filters (for CensusPage to use on mount). */
export function getChartFilters(): CensusFilter[] {
    return _sharedFilters;
}

/** Clear chart filters (called by CensusPage after consuming). */
export function clearChartFilters(): void {
    _sharedFilters = [];
}

/* ═══════════════════════════════════════════════════════════════════
   CENSUS COLUMN MAPPINGS
   ═══════════════════════════════════════════════════════════════════ */

const CENSUS_SQL_COL: Record<string, string> = {
    khidmat_jamaat: 'c.khidmat_jamaat',
    khidmat_auxiliary: 'c.khidmat_auxiliary',
    wish_volunteer: 'c.wish_volunteer',
    interest_area: 'c.interest_area',
    languages: 'c.languages',
    reconfirmed_15: 'c.reconfirmed_15',
    reconfirmed_18: 'c.reconfirmed_18',
    continue_waqf: 'c.continue_waqf',
    intend_jamia: 'c.intend_jamia',
    serve_plan: 'c.serve_plan',
    education_status: 'c.education_status',
    education_detail: 'c.education_detail',
    guidance_huzoor: 'c.guidance_huzoor',
    employed: 'c.employed',
    permission_huzoor: 'c.permission_huzoor',
    is_moosi: 'c.is_moosi',
    syllabus_current: 'c.syllabus_current',
};

/* ── Census column key → AG Grid column field name ───────── */

const CENSUS_AG_GRID_COL: Record<string, string> = {
    khidmat_jamaat: "Khidmat in Jama'at",
    khidmat_auxiliary: 'Khidmat in Auxiliary',
    wish_volunteer: 'Wishes to Volunteer',
    interest_area: 'Area of Interest',
    languages: 'Languages',
    reconfirmed_15: 'Reconfirmed at 15',
    reconfirmed_18: 'Reconfirmed at 18',
    continue_waqf: 'Continue Waqf',
    intend_jamia: 'Intends Jamia',
    serve_plan: 'Plan to Serve',
    education_status: 'Education Status',
    education_detail: 'Education Detail',
    guidance_huzoor: 'Guidance from Huzoor',
    employed: 'Employed',
    permission_huzoor: 'Permission from Huzoor',
    is_moosi: 'Moosi',
    syllabus_current: 'Syllabus Up to Date',
};

/* ── Types ──────────────────────────────────────────────────── */

export interface CensusFilter {
    column: string;
    value: string | boolean;
}

/* ── Build AG Grid filter model from filters ─────────────── */

/**
 * Build an AG Grid filter model from CensusFilter[] so the floating
 * column filters show the active filter in the data table.
 */
export function buildCensusAgGridModel(filters: CensusFilter[]): Record<string, object> | null {
    const model: Record<string, object> = {};
    for (const f of filters) {
        const col = CENSUS_AG_GRID_COL[f.column];
        if (!col) continue;
        model[col] = { filterType: 'text', type: 'equals', filter: String(f.value) };
    }
    return Object.keys(model).length > 0 ? model : null;
}

/* ── Build SQL WHERE clause from filters ──────────────────── */

/**
 * Convert CensusFilter entries into a DuckDB-safe SQL WHERE fragment.
 */
export function buildCensusWhere(filters: CensusFilter[]): string {
    if (filters.length === 0) return '';
    const clauses: string[] = [];
    for (const f of filters) {
        const sqlCol = CENSUS_SQL_COL[f.column];
        if (!sqlCol) continue;
        const val = typeof f.value === 'boolean' ? (f.value ? 'true' : 'false') : `'${String(f.value).replace(/'/g, "''")}'`;
        clauses.push(`${sqlCol} = ${val}`);
    }
    return clauses.join(' AND ');
}

/**
 * Build human-readable filter display strings for badges.
 * e.g. [{ column: 'employed', value: true }] → ["Employed: true"]
 */
export function buildCensusFilterLabels(filters: CensusFilter[]): string[] {
    return filters
        .map((f) => {
            const label = CENSUS_AG_GRID_COL[f.column] ?? f.column;
            return `${label}: ${String(f.value)}`;
        });
}

/**
 * Command: navigate to the census data table and publish chart filters.
 */
export function navigateToCensusTable(
    navigate: NavigateFunction,
    filters: CensusFilter[],
): void {
    publishChartFilters(filters);
    navigate('/census/data');
}
