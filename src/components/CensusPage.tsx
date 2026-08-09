/**
 * CensusPage.tsx — Census survey data table.
 *
 * Displays the census.parquet data (extension of members table) in an
 * AG Grid PremiumTable with column-level floating filters, CSV export,
 * and a clean header with back navigation.
 *
 * Uses the same Patterns as TajneedPage (DRY):
 *  - PremiumTable for the data grid
 *  - useDebounce for search input
 *  - URL-based filter state for drill-down
 *  - RTL-aware layout
 */

import { Badge } from "@sqlrooms/ui";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { PremiumTable } from "./PremiumTable";
import { MemberCellRenderer } from "./MemberCellRenderer";
import { FilterBadges } from "./FilterBadges";
import { parseSearch } from "./FiltersBar";
import {
  DynamicFilters,
  FILTERABLE_MEMBER_COLUMNS,
  type FilterClause,
  buildFilterWhere,
} from "./DynamicFilters";
import {
  type CensusFilter,
  buildCensusWhere,
  buildCensusAgGridModel,
  buildCensusFilterLabels,
  subscribeToChartFilters,
  getChartFilters,
  clearChartFilters,
} from "../hooks/useCensusFilters";
import { useRoomStore } from "../store";
import {
  ClipboardList,
  ArrowLeft,
  ArrowUpFromLine,
  Search,
  X,
} from "lucide-react";
import { buildJamaatClause } from "../lib/sql";
import { useAuth } from "../lib/AuthContext";

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 22 },
  },
} as const;

/* ── Debounce hook ──────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ── Component ──────────────────────────────────────────────────── */

export const CensusPage: FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilters, setMemberFilters] = useState<FilterClause[]>([]);
  const [chartFilters, setChartFilters] = useState<CensusFilter[]>(() =>
    getChartFilters(),
  );
  const censusReady = useRoomStore((s) =>
    Boolean(s.db.findTableByName?.("census")),
  );

  // Subscribe to chart drill-down filters from analytics via module-level event bus
  useEffect(() => {
    const unsub = subscribeToChartFilters((filters) => {
      setChartFilters(filters);
    });
    return unsub;
  }, []);

  // Clear shared state after consuming so stale filters don't persist
  useEffect(() => {
    if (chartFilters.length > 0) {
      clearChartFilters();
    }
  }, [chartFilters]);

  // Build SQL WHERE + AG Grid filter model + badge labels from chart filters
  const censusWhereFilter = useMemo(
    () => buildCensusWhere(chartFilters),
    [chartFilters],
  );
  const chartFilterModel = useMemo(
    () => buildCensusAgGridModel(chartFilters),
    [chartFilters],
  );
  const chartFilterLabels = useMemo(
    () => buildCensusFilterLabels(chartFilters),
    [chartFilters],
  );

  const debouncedSearch = useDebounce(search, 300);

  // Parse search with col:value DSL (same as TajneedPage)
  const { columnFilters: searchColumnFilters, freeText } = useMemo(
    () => parseSearch(debouncedSearch),
    [debouncedSearch],
  );

  // Map search column filter keys → AG Grid column names + SQL column refs
  const SEARCH_COL_MAP: Record<string, { agGrid: string; sql: string }> = {
    khidmat_jamaat: { agGrid: "Khidmat in Jama'at", sql: "c.khidmat_jamaat" },
    khidmat_auxiliary: {
      agGrid: "Khidmat in Auxiliary",
      sql: "c.khidmat_auxiliary",
    },
    wish_volunteer: { agGrid: "Wishes to Volunteer", sql: "c.wish_volunteer" },
    interest_area: { agGrid: "Area of Interest", sql: "c.interest_area" },
    languages: { agGrid: "Languages", sql: "c.languages" },
    reconfirmed_15: { agGrid: "Reconfirmed at 15", sql: "c.reconfirmed_15" },
    reconfirmed_18: { agGrid: "Reconfirmed at 18", sql: "c.reconfirmed_18" },
    continue_waqf: { agGrid: "Continue Waqf", sql: "c.continue_waqf" },
    intend_jamia: { agGrid: "Intends Jamia", sql: "c.intend_jamia" },
    education_status: { agGrid: "Education Status", sql: "c.education_status" },
    guidance_huzoor: {
      agGrid: "Guidance from Huzoor",
      sql: "c.guidance_huzoor",
    },
    employed: { agGrid: "Employed", sql: "c.employed" },
    permission_huzoor: {
      agGrid: "Permission from Huzoor",
      sql: "c.permission_huzoor",
    },
    is_moosi: { agGrid: "Moosi", sql: "c.is_moosi" },
    syllabus_current: {
      agGrid: "Syllabus Up to Date",
      sql: "c.syllabus_current",
    },
    given_names: { agGrid: "Given Names", sql: "m.given_names" },
    family_name: { agGrid: "Family Name", sql: "m.family_name" },
    gender: { agGrid: "Gender", sql: "m.gender" },
    jamaat: { agGrid: "Jama'at", sql: "m.jamaat" },
    age: { agGrid: "Age", sql: "m.age" },
  };

  // Build AG Grid filter model from search column filters
  const searchFilterModel = useMemo(() => {
    const model: Record<string, object> = {};
    for (const cf of searchColumnFilters) {
      const m = SEARCH_COL_MAP[cf.column];
      if (m)
        model[m.agGrid] = {
          filterType: "text",
          type: "equals",
          filter: cf.value,
        };
    }
    return Object.keys(model).length > 0 ? model : null;
  }, [searchColumnFilters]);

  // Merge chart filter model + search filter model
  const mergedFilterModel = useMemo(() => {
    if (!chartFilterModel && !searchFilterModel) return null;
    return { ...(chartFilterModel ?? {}), ...(searchFilterModel ?? {}) };
  }, [chartFilterModel, searchFilterModel]);

  // ── Member search (Tajneed columns only) ───────────────────────
  const debouncedMemberSearch = useDebounce(memberSearch, 300);
  const { columnFilters: memberSearchColumnFilters, freeText: memberFreeText } =
    useMemo(() => parseSearch(debouncedMemberSearch), [debouncedMemberSearch]);

  // Map member column keys → SQL column refs for member search
  const MEMBER_SEARCH_COL: Record<string, string> = {
    given_names: "m.given_names",
    family_name: "m.family_name",
    gender: "m.gender",
    jamaat: "m.jamaat",
    age: "m.age",
    age_group: "m.age_group",
    primary_phone: "m.primary_phone",
    secondary_phone: "m.secondary_phone",
    father_given_names: "m.father_given_names",
    father_family_name: "m.father_family_name",
    mother_given_names: "m.mother_given_names",
    mother_family_name: "m.mother_family_name",
    grandfather_given_names: "m.grandfather_given_names",
    grandfather_family_name: "m.grandfather_family_name",
  };

  const queryKey = useMemo(
    () =>
      `census-${debouncedSearch}-${memberFilters.map((f) => `${f.column.key}:${f.value}`).join("-")}-${censusWhereFilter}` +
      `-${debouncedMemberSearch}`,
    [debouncedSearch, memberFilters, censusWhereFilter, debouncedMemberSearch],
  );

  // Build WHERE clause from all search/filter sources
  const esc = (s: string) => s.replace(/'/g, "''");
  const { getJamaatFilter, hasPermission } = useAuth();
  const whereClause = useMemo(() => {
    const clauses: string[] = [];

    // Free-text search across ALL columns (census + member)
    if (freeText) {
      const term = esc(freeText);
      clauses.push(`(
                m.given_names ILIKE '%${term}%' OR m.family_name ILIKE '%${term}%'
                OR m.gender ILIKE '%${term}%' OR m.primary_phone ILIKE '%${term}%'
                OR m.jamaat ILIKE '%${term}%' OR m.age::VARCHAR ILIKE '%${term}%'
                OR c.khidmat_jamaat_detail ILIKE '%${term}%'
                OR c.khidmat_auxiliary_detail ILIKE '%${term}%'
                OR c.interest_area ILIKE '%${term}%'
                OR c.languages ILIKE '%${term}%'
                OR c.serve_plan ILIKE '%${term}%'
                OR c.education_status ILIKE '%${term}%'
                OR c.education_detail ILIKE '%${term}%'
                OR c.university_qual ILIKE '%${term}%'
            )`);
    }

    // General search column filters (col:value DSL on any column)
    for (const cf of searchColumnFilters) {
      const m = SEARCH_COL_MAP[cf.column];
      if (m) clauses.push(`${m.sql} = '${esc(cf.value)}'`);
    }

    // Member-specific free-text search (Tajneed columns only)
    if (memberFreeText) {
      const term = esc(memberFreeText);
      clauses.push(`(
                m.given_names ILIKE '%${term}%' OR m.family_name ILIKE '%${term}%'
                OR m.gender ILIKE '%${term}%' OR m.jamaat ILIKE '%${term}%'
                OR m.age::VARCHAR ILIKE '%${term}%' OR m.age_group ILIKE '%${term}%'
                OR m.primary_phone ILIKE '%${term}%' OR m.secondary_phone ILIKE '%${term}%'
                OR m.father_given_names ILIKE '%${term}%' OR m.father_family_name ILIKE '%${term}%'
                OR m.mother_given_names ILIKE '%${term}%' OR m.mother_family_name ILIKE '%${term}%'
                OR m.grandfather_given_names ILIKE '%${term}%' OR m.grandfather_family_name ILIKE '%${term}%'
            )`);
    }

    // Member search column filters (col:value on member columns)
    for (const cf of memberSearchColumnFilters) {
      const sqlCol = MEMBER_SEARCH_COL[cf.column];
      if (sqlCol) clauses.push(`${sqlCol} = '${esc(cf.value)}'`);
    }

    // Dynamic member attribute filters (from Tajneed filter panel)
    const memberWhere = buildFilterWhere(memberFilters);
    if (memberWhere) clauses.push(memberWhere);

    // Chart drill-down filter (from analytics → census data)
    if (censusWhereFilter) clauses.push(censusWhereFilter);

    // Jama'at filter (RBAC — restricts to user's jama'at)
    const jamaatFilter = getJamaatFilter();
    const jamaatClause = buildJamaatClause(jamaatFilter, "m");
    if (jamaatClause) clauses.push(jamaatClause);

    return clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  }, [
    freeText,
    searchColumnFilters,
    memberFreeText,
    memberSearchColumnFilters,
    memberFilters,
    censusWhereFilter,
    getJamaatFilter,
  ]);

  const query = `
        SELECT
            c.member_id               AS "Member ID",
            m.given_names || ' ' || m.family_name AS "Member Name",
            m.gender                  AS "Gender",
            m.age                     AS "Age",
            m.jamaat                  AS "Jama'at",
            m.primary_phone           AS "Primary Phone",
            m.secondary_phone         AS "Secondary Phone",
            m.father_given_names      AS "Father's Given Names",
            m.father_family_name      AS "Father's Family Name",
            m.mother_given_names      AS "Mother's Given Names",
            m.mother_family_name      AS "Mother's Family Name",
            m.grandfather_given_names AS "Grandfather's Given Names",
            m.grandfather_family_name AS "Grandfather's Family Name",
            CAST(c.khidmat_jamaat AS VARCHAR) AS "Khidmat in Jama'at",
            c.khidmat_jamaat_detail   AS "Khidmat Detail (Jama'at)",
            CAST(c.khidmat_auxiliary AS VARCHAR) AS "Khidmat in Auxiliary",
            c.khidmat_auxiliary_detail AS "Khidmat Detail (Auxiliary)",
            CAST(c.wish_volunteer AS VARCHAR) AS "Wishes to Volunteer",
            c.interest_area           AS "Area of Interest",
            c.languages               AS "Languages",
            CAST(c.reconfirmed_15 AS VARCHAR) AS "Reconfirmed at 15",
            CAST(c.reconfirmed_18 AS VARCHAR) AS "Reconfirmed at 18",
            CAST(c.continue_waqf AS VARCHAR) AS "Continue Waqf",
            CAST(c.intend_jamia AS VARCHAR) AS "Intends Jamia",
            c.serve_plan              AS "Plan to Serve",
            c.education_status        AS "Education Status",
            c.education_detail        AS "Education Detail",
            c.education_year_expected AS "Expected Completion",
            c.education_year_completed AS "Year Completed",
            c.university_qual         AS "University Qualification",
            CAST(c.guidance_huzoor AS VARCHAR) AS "Guidance from Huzoor",
            CAST(c.employed AS VARCHAR) AS "Employed",
            CAST(c.permission_huzoor AS VARCHAR) AS "Permission from Huzoor",
            CAST(c.is_moosi AS VARCHAR) AS "Moosi",
            CAST(c.syllabus_current AS VARCHAR) AS "Syllabus Up to Date"
        FROM census c
        LEFT JOIN members m ON c.member_id = m.member_id
        ${whereClause}
        ORDER BY m.family_name, m.given_names
    `;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <button
          onClick={() => navigate("/census/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Census Data
          </h2>
          {chartFilters.length > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <ArrowUpFromLine className="h-3 w-3" />
              Chart drill-down active
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Search bar + filter badges */}
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
            placeholder="Search census data..."
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
        <FilterBadges
          filters={[
            // Chart drill-down filter labels
            ...chartFilterLabels.map((label) => {
              const [l, ...rest] = label.split(": ");
              return { label: l, value: rest.join(": ") };
            }),
            // Search column filter labels (col:value DSL)
            ...searchColumnFilters.map((cf) => ({
              label: cf.column,
              value: cf.value,
            })),
          ]}
        />
      </motion.div>

      {/* Member filters + member search */}
      <motion.div
        className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-6 py-2.5 dark:border-slate-700"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.08 }}
      >
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search members..."
            className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500"
          />
          {memberSearch && (
            <button
              onClick={() => setMemberSearch("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <DynamicFilters
          columns={FILTERABLE_MEMBER_COLUMNS}
          filters={memberFilters}
          onChange={setMemberFilters}
        />
        <FilterBadges
          filters={memberSearchColumnFilters.map((cf) => ({
            label: cf.column,
            value: cf.value,
          }))}
        />
      </motion.div>

      {/* Data table */}
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
            enabled={censusReady}
            quickFilterText={debouncedSearch || undefined}
            initialFilterModel={mergedFilterModel}
            canExport={hasPermission("reports:export")}
            columnDefOverrides={{
              "Member Name": {
                cellRenderer: MemberCellRenderer,
                width: 220,
                pinned: "left",
                filter: "agTextColumnFilter",
              },
              "Member ID": { hide: true },
              Gender: { hide: true },
              Age: { hide: true },
              "Jama'at": { hide: true },
              "Primary Phone": { hide: true },
              "Secondary Phone": { hide: true },
              "Father's Given Names": { hide: true },
              "Father's Family Name": { hide: true },
              "Mother's Given Names": { hide: true },
              "Mother's Family Name": { hide: true },
              "Grandfather's Given Names": { hide: true },
              "Grandfather's Family Name": { hide: true },
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
