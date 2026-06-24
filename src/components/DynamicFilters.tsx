/**
 * DynamicFilters.tsx — Composable, column-agnostic filter builder.
 *
 * Users click "Add filter" → pick ANY member column → enter/filter a value.
 * Each active filter becomes a chip.  The parent builds the SQL WHERE clause.
 *
 * Design patterns:
 *  - **Builder**: constructs filter clauses incrementally
 *  - **Strategy**: input UI adapts to column type (dropdown vs text vs number)
 *  - **Repository**: fetches distinct values from DuckDB for categorical columns
 *
 * Usage:
 *   <DynamicFilters
 *     columns={FILTERABLE_MEMBER_COLUMNS}
 *     filters={activeFilters}
 *     onChange={setActiveFilters}
 *   />
 */

import { useSql } from '@sqlrooms/duckdb';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '../store';
import {
    Plus,
    X,
    ChevronDown,
    Check,
    Search as SearchIcon,
} from 'lucide-react';
import { useCallback, useMemo, useState, type FC } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

/** Describes a filterable column from the members table. */
export interface FilterableColumn {
    /** Unique key (lowercase, matches the column filter key) */
    key: string;
    /** Human-readable label shown in the UI */
    label: string;
    /** SQL column reference with table alias, e.g. "m.gender" */
    sqlCol: string;
    /** Value type — determines which input UI to show */
    type: 'text' | 'number' | 'boolean' | 'categorical';
}

/** A single active filter clause. */
export interface FilterClause {
    column: FilterableColumn;
    value: string;
}

export interface DynamicFiltersProps {
    /** All member columns the user can filter by. */
    columns: FilterableColumn[];
    /** Currently active filters. */
    filters: FilterClause[];
    /** Called whenever filters change (add / remove / update). */
    onChange: (filters: FilterClause[]) => void;
}

/* ═══════════════════════════════════════════════════════════════
   FILTERABLE MEMBER COLUMNS — single source of truth
   ═══════════════════════════════════════════════════════════════ */

export const FILTERABLE_MEMBER_COLUMNS: FilterableColumn[] = [
    { key: 'given_names', label: 'Given Names', sqlCol: 'm.given_names', type: 'text' },
    { key: 'family_name', label: 'Family Name', sqlCol: 'm.family_name', type: 'text' },
    { key: 'gender', label: 'Gender', sqlCol: 'm.gender', type: 'categorical' },
    { key: 'jamaat', label: "Jama'at", sqlCol: 'm.jamaat', type: 'categorical' },
    { key: 'age', label: 'Age', sqlCol: 'm.age', type: 'number' },
    { key: 'age_group', label: 'Age Group', sqlCol: 'm.age_group', type: 'categorical' },
    { key: 'primary_phone', label: 'Primary Phone', sqlCol: 'm.primary_phone', type: 'text' },
    { key: 'secondary_phone', label: 'Secondary Phone', sqlCol: 'm.secondary_phone', type: 'text' },
    { key: 'father_given_names', label: "Father's Given Names", sqlCol: 'm.father_given_names', type: 'text' },
    { key: 'father_family_name', label: "Father's Family Name", sqlCol: 'm.father_family_name', type: 'text' },
    { key: 'mother_given_names', label: "Mother's Given Names", sqlCol: 'm.mother_given_names', type: 'text' },
    { key: 'mother_family_name', label: "Mother's Family Name", sqlCol: 'm.mother_family_name', type: 'text' },
    { key: 'grandfather_given_names', label: "Grandfather's Given Names", sqlCol: 'm.grandfather_given_names', type: 'text' },
    { key: 'grandfather_family_name', label: "Grandfather's Family Name", sqlCol: 'm.grandfather_family_name', type: 'text' },
];

/* ═══════════════════════════════════════════════════════════════
   BUILD WHERE CLAUSE FROM FILTERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Convert an array of `FilterClause` into a DuckDB-safe SQL WHERE fragment.
 */
export function buildFilterWhere(filters: FilterClause[]): string {
    if (filters.length === 0) return '';
    const esc = (s: string) => s.replace(/'/g, "''");
    const clauses = filters.map((f) => {
        const col = f.column.sqlCol;
        const val = esc(f.value);
        switch (f.column.type) {
            case 'number':
                return `${col} = ${val}`;
            case 'boolean':
                return `${col} = ${val === 'true' ? 'true' : 'false'}`;
            default:
                return `${col} = '${val}'`;
        }
    });
    return clauses.join(' AND ');
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORICAL VALUE PICKER
   ═══════════════════════════════════════════════════════════════ */

const CategoricalValuePicker: FC<{
    sqlCol: string;
    selected?: string;
    onSelect: (value: string) => void;
}> = ({ sqlCol, selected, onSelect }) => {
    const ready = useRoomStore((s) => Boolean(s.db.findTableByName?.('members')));
    const q = useSql<{ val: string; count: number }>({
        query: `SELECT ${sqlCol.replace(/^m\./, '')} AS val, COUNT(*)::int AS count FROM members GROUP BY val ORDER BY count DESC`,
        enabled: ready,
    });
    const [open, setOpen] = useState(false);

    const options = useMemo(
        () => q.data?.toArray().map((r: any) => ({ value: r.val, count: r.count })) ?? [],
        [q.data],
    );

    const displayValue = selected
        ? options.find((o) => o.value === selected)?.value ?? selected
        : '';

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button
                    className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs transition-colors
                        ${selected
                            ? 'border-brand/40 bg-brand/5 text-brand dark:border-brand/30 dark:bg-brand/10'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:text-slate-400'
                        }`}
                >
                    <span>{displayValue || 'Select...'}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content asChild align="start" sideOffset={4} className="z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        {q.isLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
                            </div>
                        ) : (
                            <div className="max-h-52 overflow-y-auto">
                                {options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { onSelect(opt.value); setOpen(false); }}
                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors
                                            ${opt.value === selected
                                                ? 'bg-brand/10 text-brand dark:bg-brand/15'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Check className={`h-3.5 w-3.5 ${opt.value === selected ? 'opacity-100' : 'opacity-0'}`} />
                                        <span className="flex-1 text-left">{opt.value}</span>
                                        <span className="text-slate-400">{opt.count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <Popover.Arrow className="fill-white dark:fill-slate-700" />
                    </motion.div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

/* ═══════════════════════════════════════════════════════════════
   FILTER ROW
   ═══════════════════════════════════════════════════════════════ */

const FilterRow: FC<{
    clause: FilterClause;
    onUpdate: (value: string) => void;
    onRemove: () => void;
}> = ({ clause, onUpdate, onRemove }) => {
    const { column, value } = clause;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
            <span className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                {column.label}:
            </span>

            {column.type === 'categorical' ? (
                <CategoricalValuePicker
                    sqlCol={column.sqlCol}
                    selected={value}
                    onSelect={onUpdate}
                />
            ) : column.type === 'number' ? (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onUpdate(e.target.value)}
                    className="h-8 w-20 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    placeholder="Value"
                />
            ) : column.type === 'boolean' ? (
                <select
                    value={value}
                    onChange={(e) => onUpdate(e.target.value)}
                    className="h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onUpdate(e.target.value)}
                    className="h-8 w-36 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    placeholder="Filter value..."
                />
            )}

            <button
                onClick={onRemove}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   COLUMN PICKER (for "Add filter")
   ═══════════════════════════════════════════════════════════════ */

const ColumnPicker: FC<{
    columns: FilterableColumn[];
    existingKeys: string[];
    onSelect: (col: FilterableColumn) => void;
}> = ({ columns, existingKeys, onSelect }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const available = useMemo(
        () => columns.filter((c) => !existingKeys.includes(c.key) && (!query || c.label.toLowerCase().includes(query.toLowerCase()))),
        [columns, existingKeys, query],
    );

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Tajneed filter
                </motion.button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content asChild align="start" sideOffset={4} className="z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        {/* Search */}
                        <div className="relative mb-1 px-1 pt-1">
                            <SearchIcon className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search columns..."
                                className="h-8 w-full rounded-lg border border-slate-200 bg-transparent pl-8 pr-2 text-xs outline-none focus:border-brand dark:border-slate-600 dark:text-slate-200"
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                            {available.length === 0 ? (
                                <div className="px-3 py-4 text-center text-xs text-slate-400">
                                    {query ? 'No matching columns' : 'All columns added'}
                                </div>
                            ) : (
                                available.map((col) => (
                                    <button
                                        key={col.key}
                                        onClick={() => { onSelect(col); setOpen(false); setQuery(''); }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                    >
                                        <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span>{col.label}</span>
                                        <span className="ml-auto text-[10px] uppercase text-slate-400">{col.type}</span>
                                    </button>
                                ))
                            )}
                        </div>
                        <Popover.Arrow className="fill-white dark:fill-slate-700" />
                    </motion.div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

/* ═══════════════════════════════════════════════════════════════
   DYNAMIC FILTERS
   ═══════════════════════════════════════════════════════════════ */

export const DynamicFilters: FC<DynamicFiltersProps> = ({
    columns,
    filters,
    onChange,
}) => {
    const existingKeys = useMemo(() => filters.map((f) => f.column.key), [filters]);

    const addFilter = useCallback(
        (col: FilterableColumn) => {
            onChange([...filters, { column: col, value: '' }]);
        },
        [filters, onChange],
    );

    const updateFilter = useCallback(
        (index: number, value: string) => {
            const next = [...filters];
            next[index] = { ...next[index], value };
            onChange(next);
        },
        [filters, onChange],
    );

    const removeFilter = useCallback(
        (index: number) => {
            onChange(filters.filter((_, i) => i !== index));
        },
        [filters, onChange],
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Active filter chips */}
            <AnimatePresence mode="popLayout">
                {filters.map((clause, i) => (
                    <FilterRow
                        key={`${clause.column.key}-${i}`}
                        clause={clause}
                        onUpdate={(value) => updateFilter(i, value)}
                        onRemove={() => removeFilter(i)}
                    />
                ))}
            </AnimatePresence>

            {/* Add filter button */}
            <ColumnPicker
                columns={columns}
                existingKeys={existingKeys}
                onSelect={addFilter}
            />

            {/* Clear all */}
            {filters.length > 0 && (
                <button
                    onClick={() => onChange([])}
                    className="text-xs text-slate-400 underline-offset-2 hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                >
                    Clear all
                </button>
            )}
        </div>
    );
};
