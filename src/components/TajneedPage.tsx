/**
 * TajneedPage.tsx — Members data table with smart search.
 *
 * Uses PremiumTable (AG Grid) for a professional-grade data grid with
 * sorting, filtering, column resize/reorder, virtual scrolling, and CSV export.
 * DuckDB WASM pipeline via @sqlrooms/duckdb fetches from S3 parquet.
 *
 * A FiltersBar above the table provides a single search input that supports
 * col:value syntax for column-specific filtering alongside full-text search.
 *
 * The WHERE clause is built dynamically by parsing the search query into
 * column filters and free-text terms via the parseSearch() DSL.
 */

import { Badge } from "@sqlrooms/ui";
import { motion } from "framer-motion";
import { useState, useEffect, type FC } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parseSearch } from "./FiltersBar";
import { parseFilterString } from "../hooks/useMemberFilters";
import { PremiumTable } from "./PremiumTable";
import { FilterBadges } from "./FilterBadges";
import { useRoomStore } from "../store";
import { TableIcon, Search, X, ArrowUpFromLine, ArrowLeft } from "lucide-react";
import { escapeLike, injectJamaatFilter } from "../lib/sql";
import { useAuth } from "../lib/AuthContext";

const fadeInUp = {
    initial: { opacity: 0, y: 16 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 200, damping: 22 },
    },
} as const;

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

// ── Drill-down filter → AG Grid filter model ──────────────────────────

/**
 * Map from filter keys (used in analytics drill-down) to AG Grid column
 * field names (the SQL aliases used in the SELECT query below).
 */
const FILTER_KEY_TO_AG_GRID_COL: Record<string, string> = {
    gender: "Gender",
    jamaat: "Jama'at",
    age_group: "Age Group",
};

/**
 * Convert a search DSL string (e.g. "gender:Male jamaat:Sydney") into an
 * AG Grid filter model that applies column-level filters.
 */
function toFilterModel(search: string): Record<string, object> | null {
    const filters = parseFilterString(search);
    const model: Record<string, object> = {};
    let hasAny = false;
    for (const [key, col] of Object.entries(FILTER_KEY_TO_AG_GRID_COL)) {
        const val = (filters as Record<string, string | undefined>)[key];
        if (val) {
            model[col] = { filterType: "text", type: "equals", filter: val };
            hasAny = true;
        }
    }
    return hasAny ? model : null;
}

// ── Build WHERE clause from free-text only ────────────────────────────

/**
 * Build a DuckDB WHERE clause from free-text search terms only.
 * Column filters are handled by AG Grid, not SQL.
 */
function buildWhereFromFreeText(freeText: string): string {
    if (!freeText) return "";
    const term = escapeLike(freeText);
    return `WHERE (
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
        OR father_phone ILIKE '%${term}%'
        OR mother_given_names ILIKE '%${term}%'
        OR mother_family_name ILIKE '%${term}%'
        OR mother_phone ILIKE '%${term}%'
        OR grandfather_given_names ILIKE '%${term}%'
        OR grandfather_family_name ILIKE '%${term}%'
    )`;
}

// ── Component ────────────────────────────────────────────────────────

export const TajneedPage: FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { getJamaatFilter, hasPermission } = useAuth();
    const [searchParams] = useSearchParams();
    const initialFilter = searchParams.get("filter") || "";
    const [search, setSearch] = useState(initialFilter);
    const membersReady = useRoomStore((s) =>
        Boolean(s.db.findTableByName?.("members")),
    );

    // Debounce search by 300ms so the query doesn't fire on every keystroke
    const debouncedSearch = useDebounce(search, 300);

    // Parse: column filters → AG Grid model, free text → SQL WHERE
    const { columnFilters, freeText } = parseSearch(debouncedSearch);
    const filterModel = toFilterModel(debouncedSearch);
    const whereClause = buildWhereFromFreeText(freeText);
    const queryKey = `${debouncedSearch}`;

    // Fetch ALL data — column filters are applied client-side by AG Grid
    const jamaatFilter = getJamaatFilter();
    const baseQuery = `
        SELECT
          given_names           AS "Given Names",
          family_name           AS "Family Name",
          gender                AS "Gender",
          primary_phone         AS "Primary Phone",
          secondary_phone       AS "Secondary Phone",
          jamaat                AS "Jama'at",
          age                   AS "Age",
          age_group             AS "Age Group",
          father_given_names    AS "Father's Given Names",
          father_family_name    AS "Father's Family Name",
          father_phone          AS "Father's Phone",
          mother_given_names    AS "Mother's Given Names",
          mother_family_name    AS "Mother's Family Name",
          mother_phone          AS "Mother's Phone",
          grandfather_given_names AS "Grandfather's Given Names",
          grandfather_family_name AS "Grandfather's Family Name"
        FROM members
        ${whereClause}
        ORDER BY family_name, given_names
    `;
    const query = injectJamaatFilter(baseQuery, jamaatFilter);

    return (
        <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <motion.div
                className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
            >
                {initialFilter ? (
                    <button
                        onClick={() => navigate("/tajneed/analytics")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                        <TableIcon className="h-4 w-4" />
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                        {t("title")}
                    </h2>
                    {initialFilter && (
                        <Badge variant="secondary" className="gap-1.5">
                            <ArrowUpFromLine className="h-3 w-3" />
                            Drilled from Analytics
                        </Badge>
                    )}
                </div>
            </motion.div>

            {/* Search bar */}
            <motion.div
                className="flex items-center gap-3 border-b border-slate-200 px-6 py-3 dark:border-slate-700"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.05 }}
            >
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-ring"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {/* Active column filter badges */}
                <FilterBadges
                    filters={columnFilters.map((cf) => ({
                        label: cf.column,
                        value: cf.value,
                    }))}
                />
            </motion.div>

            {/* Data table — fills remaining height */}
            <motion.div
                className="flex-1 overflow-hidden px-6 py-4"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
            >
                <div className="ag-wrapper h-full">
                    <PremiumTable
                        key={queryKey}
                        query={query}
                        queryKey={queryKey}
                        enabled={membersReady}
                        quickFilterText={freeText}
                        initialFilterModel={filterModel}
                        canExport={hasPermission("reports:export")}
                    />
                </div>
            </motion.div>
        </div>
    );
};
