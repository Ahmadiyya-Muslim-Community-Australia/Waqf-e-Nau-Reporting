/**
 * PremiumSidebar.tsx — Industry-grade sidebar with glass morphism,
 * spring animations, brand styling, and full RTL support.
 *
 * Renders the inner content of RoomShell.Sidebar (brand mark, navigation,
 * utilities). The outer sidebar wrapper is applied in App.tsx via
 * `RoomShell.Sidebar` with premium className overrides.
 *
 * Design patterns:
 *  - **Composite**: groups nav items, utilities into logical sections
 *  - **Strategy**: switches between LTR/RTL layout via CSS
 *  - **Observer**: reacts to panel changes via RoomShell store
 */

import { useBaseRoomShellStore } from '@sqlrooms/room-shell';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@sqlrooms/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { SidebarClock } from './SidebarClock';
import { useAuth } from '../lib/AuthContext';
import {
    LayoutDashboard,
    TableIcon,
    Sun,
    Moon,
    ClipboardList,
    Building2,
    LogOut,
    type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FC } from 'react';

/* ── Spring presets ─────────────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

/* ── Theme Toggle ───────────────────────────────────────────── */

const STORAGE_KEY = 'waqfenau-reports-theme';

function getStoredTheme(): 'light' | 'dark' {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch { /* noop */ }
    return 'light';
}

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
}

const ThemeToggle: FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);
    const { isUrdu } = useLanguage();

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'light' ? 'dark' : 'light';
            try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
            applyTheme(next);
            return next;
        });
    }, []);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={toggle}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
            </TooltipTrigger>
            <TooltipContent side={isUrdu ? 'left' : 'right'}>
                <p>{theme === 'light' ? 'Dark mode' : 'Light mode'}</p>
            </TooltipContent>
        </Tooltip>
    );
};

/* ── Nav item config ────────────────────────────────────────── */

interface NavItemConfig {
    panelType: string;
    label: string;
    icon: LucideIcon;
    slug: string;
}

const NAV_ITEMS: NavItemConfig[] = [
    { panelType: 'main', label: 'Dashboard', icon: LayoutDashboard, slug: '/' },
    { panelType: 'tajneed-menu', label: 'Tajneed', icon: TableIcon, slug: '/tajneed/' },
    { panelType: 'census-menu', label: 'Census', icon: ClipboardList, slug: '/census/' },
    { panelType: 'markaz-menu', label: 'Markaz', icon: Building2, slug: '/markaz/' },
];

const NavItem: FC<{ item: NavItemConfig }> = ({ item }) => {
    const { isUrdu } = useLanguage();
    const navigate = useNavigate();
    const initialized = useBaseRoomShellStore((s) => s.room.initialized);
    const nodes = useBaseRoomShellStore((s) => s.layout.config?.nodes);
    const setConfig = useBaseRoomShellStore((s) => s.layout.setConfig);

    const isActive = nodes === item.panelType;

    const handleClick = () => {
        if (isActive) return;
        setConfig({ type: 'mosaic', nodes: item.panelType });
        navigate(item.slug, { replace: true });
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    disabled={!initialized}
                    onClick={handleClick}
                    className={cn(
                        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                            ? 'bg-brand/10 text-brand dark:bg-brand/15 dark:text-brand-light'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                        !initialized && 'cursor-not-allowed opacity-40',
                        isUrdu ? 'flex-row-reverse' : '',
                    )}
                >
                    <span className="relative z-10 flex h-5 w-5 items-center justify-center">
                        <item.icon className="h-5 w-5" />
                    </span>
                    <span className="relative z-10">{item.label}</span>
                    <AnimatePresence>
                        {isActive && (
                            <motion.div
                                layoutId="sidebar-active"
                                className="absolute inset-0 rounded-lg bg-brand/10 dark:bg-brand/15"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={spring}
                            />
                        )}
                    </AnimatePresence>
                </button>
            </TooltipTrigger>
            <TooltipContent side={isUrdu ? 'left' : 'right'}>
                <p>{item.label}</p>
            </TooltipContent>
        </Tooltip>
    );
};

/* ── Section label ──────────────────────────────────────────── */

const SectionLabel: FC<{ label: string }> = ({ label }) => (
    <div className="px-3 pb-1 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {label}
        </p>
    </div>
);

/* ── Divider ────────────────────────────────────────────────── */

const SidebarDivider: FC = () => (
    <div className="mx-3 my-2 h-px bg-slate-200 dark:bg-slate-700" />
);

/* ═══════════════════════════════════════════════════════════════
   PREMIUM SIDEBAR CONTENT
   ═══════════════════════════════════════════════════════════════ */

export const PremiumSidebar: FC = () => {
    const { isUrdu, t } = useLanguage();
    const { isAuthenticated, signOut } = useAuth();

    return (
        <>
            {/* ── Brand mark ─────────────────────────────────── */}
            <div className={cn(
                'flex w-full items-center gap-2.5 px-4 pb-4',
                isUrdu ? 'flex-row-reverse' : '',
            )}>
                <img src="/logo.png" alt="Waqf-e-Nau" className="h-8 w-auto" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Reports
                </span>
            </div>

            <SidebarDivider />

            {/* ── Navigation ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto w-full px-2">
                <SectionLabel label="Pages" />
                <nav className="flex flex-col gap-0.5">
                    {NAV_ITEMS.map((item) => (
                        <NavItem key={item.panelType} item={item} />
                    ))}
                </nav>
            </div>

            {/* ── Utilities ───────────────────────────────────── */}
            <div className="w-full border-t border-slate-200 px-2 pt-3 dark:border-slate-700">
                <SectionLabel label={t('settings')} />
                <div className={cn(
                    'flex items-center gap-1 px-3 py-1',
                    isUrdu ? 'flex-row-reverse' : '',
                )}>
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
                {isAuthenticated && (
                    <div className={cn(
                        'flex items-center px-3 py-1',
                        isUrdu ? 'flex-row-reverse' : '',
                    )}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={signOut}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    aria-label={t('signOut')}
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side={isUrdu ? 'left' : 'right'}>
                                <p>{t('signOut')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </div>

            {/* ── Clock ───────────────────────────────────────── */}
            <SidebarClock />
        </>
    );
};
