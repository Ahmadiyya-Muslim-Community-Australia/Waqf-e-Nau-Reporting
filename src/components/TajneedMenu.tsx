/**
 * TajneedMenu.tsx — Premium tile-based navigation hub for the Tajneed section.
 *
 * Each tile is a spring-animated card with icon, title, description, and
 * a subtle background pattern. Clicking navigates to the sub-page.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
    TableIcon,
    BarChart3,
    FileText,
    Settings,
    ArrowRight,
} from 'lucide-react';
import type { FC } from 'react';

/* ── Tile definition ────────────────────────────────────────── */

interface Tile {
    id: string;
    icon: FC<{ className?: string }>;
    titleKey: string;
    descKey: string;
    path: string;
    color: string;    // Tailwind bg class for the icon area
    badge?: string;
}

const tiles: Tile[] = [
    {
        id: 'data',
        icon: TableIcon,
        titleKey: 'tajneedDataTitle',
        descKey: 'tajneedDataDesc',
        path: '/tajneed/data',
        color: 'bg-brand',
    },
    {
        id: 'analytics',
        icon: BarChart3,
        titleKey: 'tajneedAnalyticsTitle',
        descKey: 'tajneedAnalyticsDesc',
        path: '/tajneed/analytics',
        color: 'bg-amber-500',
    },
    {
        id: 'reports',
        icon: FileText,
        titleKey: 'tajneedReportsTitle',
        descKey: 'tajneedReportsDesc',
        path: '/tajneed/reports',
        color: 'bg-blue-500',
    },
    {
        id: 'settings',
        icon: Settings,
        titleKey: 'tajneedSettingsTitle',
        descKey: 'tajneedSettingsDesc',
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

/* ── Component ──────────────────────────────────────────────── */

export const TajneedMenu: FC = () => {
    const { t } = useLanguage();
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
                        {t('tajneed')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {t('tajneedMenuSubtitle')}
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

/* ── Tile card ──────────────────────────────────────────────── */

const TileCard: FC<{ tile: Tile; navigate: (path: string) => void }> = ({
    tile,
    navigate,
}) => {
    const { t } = useLanguage();
    const Icon = tile.icon;
    const isDisabled = !tile.path;

    return (
        <motion.button
            variants={tileVariants}
            onClick={() => tile.path && navigate(tile.path)}
            disabled={isDisabled}
            className={[
                'group relative overflow-hidden rounded-xl p-6 text-left',
                'transition-shadow duration-300',
                isDisabled
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer',
                'bg-white shadow-sm ring-1 ring-slate-200',
                'hover:shadow-lg',
                'dark:bg-slate-800 dark:ring-slate-700',
                !isDisabled && 'dark:hover:shadow-xl dark:hover:ring-brand/30',
            ].join(' ')}
        >
            {/* Hover lift — spring-powered */}
            <motion.div
                className="absolute inset-0"
                whileHover={!isDisabled ? { y: -3 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />

            {/* Background decoration */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.04] dark:opacity-[0.08]"
                style={{ background: 'radial-gradient(circle, currentColor, transparent)' }}
            />

            {/* Icon */}
            <div
                className={`relative mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white ${tile.color} transition-transform duration-300 group-hover:scale-110`}
            >
                <Icon className="h-6 w-6" />
            </div>

            {/* Badge */}
            {tile.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {tile.badge}
                </span>
            )}

            {/* Content */}
            <h3 className="relative mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                {t(tile.titleKey)}
            </h3>
            <p className="relative text-sm text-slate-500 dark:text-slate-400">
                {t(tile.descKey)}
            </p>

            {/* Arrow on hover */}
            {!isDisabled && (
                <div className="relative mt-4 flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span>Explore</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </div>
            )}
        </motion.button>
    );
};
