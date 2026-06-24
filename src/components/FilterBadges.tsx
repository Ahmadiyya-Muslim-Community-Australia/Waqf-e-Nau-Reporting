/**
 * FilterBadges.tsx — Shared filter badge display for data table search bars.
 *
 * Renders active filters as animated badges with icons, positioned to the
 * right of the search bar.  Used by both TajneedPage and CensusPage for
 * consistent drill-down UX.
 *
 * Design pattern: **Composite** — renders a list of badge items with
 * consistent styling, animation, and icons.
 */

import { Badge } from '@sqlrooms/ui';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import type { FC } from 'react';

/* ── Props ──────────────────────────────────────────────────── */

export interface FilterBadgeItem {
    /** Display label (e.g. "gender", "Employed") */
    label: string;
    /** Display value (e.g. "Male", "true") */
    value: string;
}

export interface FilterBadgesProps {
    /** Array of active filter badges to display. */
    filters: FilterBadgeItem[];
}

/* ── Component ──────────────────────────────────────────────── */

export const FilterBadges: FC<FilterBadgesProps> = ({ filters }) => {
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f, i) => (
                <motion.div
                    key={`${f.label}-${f.value}-${i}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        type: 'spring' as const,
                        stiffness: 300,
                        damping: 20,
                        delay: i * 0.05,
                    }}
                >
                    <Badge variant="outline" className="gap-1 bg-brand-bg text-brand-dark">
                        <Filter className="h-3 w-3" />
                        {f.label}: <strong>{f.value}</strong>
                    </Badge>
                </motion.div>
            ))}
        </div>
    );
};
