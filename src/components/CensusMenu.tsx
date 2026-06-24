/**
 * CensusMenu.tsx — Premium tile-based navigation hub for the Census section.
 *
 * Follows the same pattern as TajneedMenu (DRY).
 * Each tile is a spring-animated card with icon, title, description, and
 * a subtle background pattern. Clicking navigates to the sub-page.
 */

import { cn } from '@sqlrooms/ui';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    BarChart3,
    FileText,
    Settings,
} from 'lucide-react';
import type { FC } from 'react';

/* ── Tile definition ────────────────────────────────────────── */

interface Tile {
    id: string;
    icon: FC<{ className?: string }>;
    title: string;
    desc: string;
    path: string;
    color: string;
    badge?: string;
}

const tiles: Tile[] = [
    {
        id: 'data',
        icon: ClipboardList,
        title: 'Census Data',
        desc: 'View and search census survey responses for all members',
        path: '/census/data',
        color: 'bg-brand',
    },
    {
        id: 'analytics',
        icon: BarChart3,
        title: 'Census Analytics',
        desc: 'Visualise trends and insights from census data',
        path: '/census/analytics',
        color: 'bg-amber-500',
    },
    {
        id: 'reports',
        icon: FileText,
        title: 'Reports',
        desc: 'Generate and export census summary reports',
        path: '',
        color: 'bg-blue-500',
        badge: 'Coming Soon',
    },
    {
        id: 'settings',
        icon: Settings,
        title: 'Settings',
        desc: 'Configure census fields and survey parameters',
        path: '',
        color: 'bg-slate-500',
        badge: 'Coming Soon',
    },
];

/* ── Container variants (staggered entrance) ────────────────── */

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

const tileVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 200, damping: 22 },
    },
};

/* ── TileCard ───────────────────────────────────────────────── */

const TileCard: FC<{ tile: Tile; navigate: ReturnType<typeof useNavigate> }> = ({
    tile,
    navigate,
}) => {
    const handleClick = () => {
        if (tile.path) navigate(tile.path);
    };

    return (
        <motion.button
            variants={tileVariants}
            onClick={handleClick}
            disabled={!tile.path}
            className={cn(
                'group relative flex items-start gap-5 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200',
                'hover:shadow-lg hover:-translate-y-0.5',
                'dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-2xl dark:hover:shadow-black/20',
                tile.path
                    ? 'cursor-pointer'
                    : 'cursor-default opacity-70',
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105',
                    tile.color,
                )}
            >
                <tile.icon className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {tile.title}
                    </h3>
                    {tile.badge && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                            {tile.badge}
                        </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {tile.desc}
                </p>
            </div>

            {/* Active arrow */}
            {tile.path && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full text-slate-300 transition-colors group-hover:text-brand dark:text-slate-600 dark:group-hover:text-brand-light">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}
        </motion.button>
    );
};

/* ── Component ──────────────────────────────────────────────── */

export const CensusMenu: FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="mx-auto w-full max-w-5xl px-6 py-10">
                {/* ── Header ── */}
                <motion.div
                    className="mb-10"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                >
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Census
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Member census survey data and insights
                    </p>
                </motion.div>

                {/* ── Tile grid ── */}
                <motion.div
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {tiles.map((tile) => (
                        <TileCard key={tile.id} tile={tile} navigate={navigate} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
