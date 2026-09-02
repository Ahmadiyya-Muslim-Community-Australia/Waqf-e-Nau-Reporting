/**
 * PremiumTable.tsx — Enterprise-grade data table powered by AG Grid.
 *
 * Replaces SQLRooms' QueryDataTable with a professional grid that supports
 * sorting, filtering, column resize/reorder, virtual scrolling, and CSV export.
 * Data is fetched via @sqlrooms/duckdb's useSql hook — same DuckDB WASM pipeline.
 *
 * Column definitions are auto-generated from the Arrow schema (field name → header).
 */

import { useSql } from "@sqlrooms/duckdb";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridOptions, FilterModel } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import { Spinner } from "@sqlrooms/ui";
import { AlertCircle, Download, Check, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, type FC } from "react";
import { useLanguage } from "../i18n/LanguageContext";

// Register all AG Grid community modules (once)
ModuleRegistry.registerModules([AllCommunityModule]);

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extract rows from a query result.
 * Tries Arrow schema first; falls back to Object.keys() on the first row.
 */
function arrowToRows(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  try {
    const tbl = data as { toArray: () => Record<string, unknown>[] };
    const arr = tbl.toArray();
    if (arr.length === 0) return [];

    // Gather field names from first row's keys (most reliable)
    const fields = Object.keys(arr[0]);

    return arr.map((row) => {
      const obj: Record<string, unknown> = {};
      for (const field of fields) {
        obj[field] = row[field];
      }
      return obj;
    });
  } catch (err) {
    console.error("[PremiumTable] arrowToRows error:", err);
    return [];
  }
}

/**
 * Custom React cell renderer for boolean columns.
 * Renders a green Check icon for true, dimmed X icon for false/null.
 * Uses lucide-react icons for consistent styling with the rest of the app.
 */
const BooleanCellRenderer: FC<{ value: unknown }> = ({ value }) => {
  const isTrue =
    value === true || value === 1 || value === "true" || value === "1";
  return (
    <span className="flex h-full w-full items-center justify-center">
      {isTrue ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      )}
    </span>
  );
};

/**
 * Build AG Grid column definitions from a query result.
 * Tries Arrow schema first; falls back to Object.keys() on first row.
 * Detects boolean columns and applies a custom cell renderer.
 */
function detectColumns(data: unknown): ColDef[] {
  if (!data) return [];
  try {
    const arr = (
      data as { toArray: () => Record<string, unknown>[] }
    ).toArray();
    if (arr.length === 0) return [];

    const keys = Object.keys(arr[0]);
    const firstRow = arr[0];

    return keys.map((key) => {
      const val = firstRow[key];
      const isBoolean =
        typeof val === "boolean" ||
        val === 0 ||
        val === 1 ||
        val === "true" ||
        val === "false";

      return {
        field: key,
        headerName: key,
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: isBoolean ? 80 : 100,
        cellRenderer: isBoolean ? BooleanCellRenderer : undefined,
        /* For boolean columns, use a simple text filter */
        filterParams: isBoolean
          ? {
            filterOptions: ["equals"],
            defaultOption: "equals",
          }
          : undefined,
      };
    });
  } catch (err) {
    console.error("[PremiumTable] detectColumns error:", err);
    return [];
  }
}

// ── AG Grid brand theme ─────────────────────────────────────────────

/**
 * Our brand theme extends the Quartz theme with Waqf-e-Nau colors.
 * Light mode uses the default; dark mode is handled via CSS class on html.
 */
const brandTheme = themeQuartz.withParams({
  /* Use our CSS custom properties so light/dark switching just works */
  backgroundColor: "hsl(var(--card))",
  foregroundColor: "hsl(var(--foreground))",
  headerBackgroundColor: "var(--wn-color-primary)",
  headerTextColor: "hsl(var(--primary-foreground))",
  headerFontSize: 12,
  fontFamily: "var(--wn-font-sans)",
  fontSize: 13,
  rowHoverColor: "var(--wn-color-primary-bg)",
  borderColor: "hsl(var(--border))",
  spacing: 6,
  wrapperBorder: false,
  headerFontWeight: "600",
});

// ── Props ───────────────────────────────────────────────────────────

export interface PremiumTableProps {
  /** SQL query to execute (DuckDB WASM). Column aliases should be human-readable. */
  query: string;
  /** React key — changes cause re-fetch */
  queryKey: string;
  /** Whether the query is enabled (e.g. data source ready) */
  enabled?: boolean;
  /** Optional text for AG Grid's quick filter (client-side cross-column search). */
  quickFilterText?: string;
  /**
   * Optional initial AG Grid filter model to apply when data loads.
   * Used for drill-down navigation from analytics (e.g. `{ Gender: { filterType: 'text', type: 'equals', filter: 'Male' } }`).
   * Applied once on first data render, after which the user can modify filters freely.
   */
  initialFilterModel?: FilterModel | null;
  /**
   * Optional overrides for specific column definitions.
   * Keyed by column field name (the SQL alias). Overrides are merged on top of
   * auto-detected column configs — useful for custom cell renderers, widths, etc.
   */
  columnDefOverrides?: Record<string, Partial<ColDef>>;
  /** Optional additional AG Grid options */
  gridOptions?: Partial<GridOptions>;
  /** Whether the current role may export the query result. */
  canExport?: boolean;
}

// ── Component ───────────────────────────────────────────────────────

export const PremiumTable: FC<PremiumTableProps> = ({
  query,
  queryKey,
  enabled = true,
  quickFilterText,
  initialFilterModel,
  columnDefOverrides,
  gridOptions,
  canExport = false,
}) => {
  const { t } = useLanguage();
  const gridRef = useRef<AgGridReact>(null);

  const { data, isLoading, error } = useSql({ query, enabled });

  // Build column definitions from result rows, then merge overrides
  const colDefs = useMemo<ColDef[]>(() => {
    const cols = detectColumns(data);
    if (cols.length === 0 && data) {
      return detectColumns(data);
    }
    if (!columnDefOverrides || cols.length === 0) return cols;
    return cols.map((col) => {
      const override = columnDefOverrides[col.field ?? ""];
      return override ? { ...col, ...override } : col;
    });
  }, [data, columnDefOverrides]);

  // Convert Arrow data to AG Grid rows
  const rowData = useMemo(() => arrowToRows(data), [data]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true, // <-- filter input below every column header
      floatingFilterComponentParams: { suppressFilterButton: true },
    }),
    [],
  );

  // ── Apply initial filter model once data is loaded ────────────────
  const prevFilterModel = useRef<object | null>(null);
  useEffect(() => {
    if (!initialFilterModel || !rowData.length) return;
    // Skip if this exact filter model was already applied (prevents re-apply on re-render)
    if (prevFilterModel.current === initialFilterModel) return;
    const timer = setTimeout(() => {
      const api = gridRef.current?.api;
      if (api) {
        api.setFilterModel(initialFilterModel);
        prevFilterModel.current = initialFilterModel;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [initialFilterModel, rowData]);

  // ── Action: export to CSV ────────────────────────────────────────
  const handleExport = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `${queryKey || "export"}.csv`,
    });
  }, [queryKey]);

  // ── Loading state (DB init or query running) ────────────────────
  if (!enabled || isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Spinner className="h-6 w-6" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-red-300 dark:border-red-800">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm font-medium">{t("error")}</p>
          <p className="max-w-md text-center text-xs text-red-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────
  if (!rowData.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
        <p className="text-sm text-slate-400">{t("noResults")}</p>
        {canExport && (
          <button
            type="button"
            disabled
            aria-label="Export to CSV"
            title="No rows available to export"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        )}
      </div>
    );
  }

  // ── Grid ─────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-700">
        <div className="flex-1" />
        <span className="text-xs text-slate-400">
          {rowData.length.toLocaleString()} rows
        </span>
        {canExport && (
          <button
            onClick={handleExport}
            aria-label="Export to CSV"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Export to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        )}
      </div>

      {/* AG Grid */}
      <div className="ag-root-wrapper h-full w-full">
        <AgGridReact
          ref={gridRef}
          theme={brandTheme}
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          animateRows
          enableCellTextSelection
          ensureDomOrder
          rowSelection={{ mode: "multiRow" }}
          pagination
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
          domLayout="normal"
          reactiveCustomComponents
          {...gridOptions}
        />
      </div>
    </div>
  );
};
