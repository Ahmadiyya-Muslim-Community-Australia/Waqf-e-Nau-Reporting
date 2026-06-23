/**
 * LanguageToggle.tsx — Sidebar button that switches between English and Urdu.
 *
 * Placed in RoomShell.Sidebar alongside the ThemeSwitch.
 * Uses the same icon-button pattern as ThemeSwitch for visual consistency.
 */

import { useLanguage } from '../i18n/LanguageContext';
import { Languages } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@sqlrooms/ui';
import type { FC } from 'react';

export const LanguageToggle: FC = () => {
    const { lang, setLang, t } = useLanguage();

    const nextLang = lang === 'en' ? 'ur' : 'en';
    const label = t('languageToggle');

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-none hover:bg-secondary/50"
                    onClick={() => setLang(nextLang)}
                >
                    <Languages className="h-5 w-5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};
