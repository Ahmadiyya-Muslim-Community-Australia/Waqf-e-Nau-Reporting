/**
 * LanguageToggle.tsx — Sidebar button that switches between English and Urdu.
 *
 * Placed in RoomShell.Sidebar alongside the ThemeSwitch.
 * Uses the same icon-button pattern as ThemeSwitch for visual consistency.
 */

import { useLanguage } from '../i18n/LanguageContext';
import { Languages } from 'lucide-react';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@sqlrooms/ui';
import type { FC } from 'react';

export const LanguageToggle: FC = () => {
    const { lang, setLang, t } = useLanguage();

    const nextLang = lang === 'en' ? 'ur' : 'en';
    const label = t('languageToggle');

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={() => setLang(nextLang)}
                    className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-none',
                        'text-slate-400 transition-colors duration-150',
                        'hover:bg-secondary/40 hover:text-slate-600',
                        'dark:text-slate-400 dark:hover:bg-secondary/20 dark:hover:text-slate-200',
                    )}
                    aria-label={label}
                >
                    <Languages className="h-5 w-5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side={lang === 'ur' ? 'left' : 'right'}>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};
