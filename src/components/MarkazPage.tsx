/**
 * MarkazPage.tsx — Markaz data table placeholder.
 *
 * Follows the same pattern as CensusPage (DRY).
 * Data source and columns to be defined.
 */

import { motion } from 'framer-motion';
import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { PremiumTable } from './PremiumTable';
import { Building2, ArrowLeft, Search, X } from 'lucide-react';

const fadeInUp = {
    initial: { opacity: 0, y: 16 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 200, damping: 22 },
    },
} as const;

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export const MarkazPage: FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const debouncedSearch = useDebounce(search, 300);
    const queryKey = `markaz-${debouncedSearch}`;

    // Placeholder query — no markaz table exists yet, returns empty
    const query = `
        SELECT 'No data yet' AS "Status"
        FROM (VALUES (1)) AS t(dummy)
        WHERE 1 = 0
    `;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
            <motion.div
                className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
            >
                <button onClick={() => navigate('/markaz/')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                    <Building2 className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                        Markaz Data
                    </h2>
                </div>
            </motion.div>

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
                        placeholder="Search markaz data..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 placeholder-slate-400 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-ring"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </motion.div>

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
                        quickFilterText={debouncedSearch || undefined}
                    />
                </div>
            </motion.div>
        </div>
    );
};
