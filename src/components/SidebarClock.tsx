/**
 * SidebarClock.tsx — Dual-time clock widget for the premium sidebar.
 *
 * Shows:
 *  1. **Headquarters time** — fixed to Australia/Sydney (AEST/AEDT)
 *  2. **Local time** — detected from the browser's `Intl` settings
 *
 * Updates every second via `setInterval`.  Styled to blend with the
 * glass-morphism sidebar theme.
 *
 * Design patterns:
 *  - **Observer**: subscribes to the system clock via setInterval
 *  - **Strategy**: uses Intl.DateTimeFormat for locale-aware formatting
 */

import { useEffect, useState, type FC } from 'react';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@sqlrooms/ui';
import { useLanguage } from '../i18n/LanguageContext';

/* ── Constants ──────────────────────────────────────────────── */

const TZ_SYDNEY = 'Australia/Sydney';
const HQ_LABEL = 'Sydney, Australia';

/** Extract a human-readable city from a tz database name e.g. "Australia/Perth" → "Perth". */
function tzToCity(tz: string): string {
    const parts = tz.split('/');
    const city = parts[parts.length - 1]?.replace(/_/g, ' ') ?? tz;
    return city;
}

/** Format a time string from a Date and timezone. */
function formatTime(date: Date, tz: string, locale: string): string {
    try {
        return new Intl.DateTimeFormat(locale, {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }).format(date);
    } catch {
        return '--:--:--';
    }
}

/** Get the timezone abbreviation e.g. "AEST", "AWST". */
function formatTzAbbr(date: Date, tz: string, locale: string): string {
    try {
        return new Intl.DateTimeFormat(locale, {
            timeZone: tz,
            timeZoneName: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
            .formatToParts(date)
            .find((p) => p.type === 'timeZoneName')?.value ?? '';
    } catch {
        return '';
    }
}

/** Format a date string (e.g. "Wed 24 Jun"). */
function formatDate(date: Date, tz: string, locale: string): string {
    try {
        return new Intl.DateTimeFormat(locale, {
            timeZone: tz,
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).format(date);
    } catch {
        return '---';
    }
}

/* ── Time row ───────────────────────────────────────────────── */

const TimeRow: FC<{
    label: string;
    tooltip: string;
    time: string;
    date: string;
    tzAbbr: string;
}> = ({ label, tooltip, time, date, tzAbbr }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div
                className={cn(
                    'flex cursor-default items-center justify-between rounded-md px-1 py-1',
                    'transition-colors duration-150',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
            >
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {label}
                </span>
                <div className="text-right">
                    <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {time}
                    </span>
                    <span className="ml-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {date}
                    </span>
                </div>
            </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
            <p>
                <span className="font-semibold">{tooltip}</span>
                {tzAbbr && (
                    <span className="ml-1.5 text-slate-400">({tzAbbr})</span>
                )}
            </p>
        </TooltipContent>
    </Tooltip>
);

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const SidebarClock: FC = () => {
    const { isUrdu } = useLanguage();
    const [now, setNow] = useState<Date>(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const locale = isUrdu ? 'ur-PK' : 'en-AU';
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const sydneyTime = formatTime(now, TZ_SYDNEY, locale);
    const sydneyDate = formatDate(now, TZ_SYDNEY, locale);
    const sydneyTz = formatTzAbbr(now, TZ_SYDNEY, locale);

    const localTime = formatTime(now, localTz, locale);
    const localDate = formatDate(now, localTz, locale);
    const localTzAbbr = formatTzAbbr(now, localTz, locale);
    const localCity = tzToCity(localTz);

    return (
        <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
            <TimeRow
                label="H.Q."
                tooltip={HQ_LABEL}
                time={sydneyTime}
                date={sydneyDate}
                tzAbbr={sydneyTz}
            />
            <TimeRow
                label="Local"
                tooltip={localCity}
                time={localTime}
                date={localDate}
                tzAbbr={localTzAbbr}
            />
        </div>
    );
};
