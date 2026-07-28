/**
 * AnnouncementBanner.tsx — Bismillah announcement banner.
 *
 * Uses Tailwind utility classes (guaranteed to work with the @tailwindcss/vite
 * plugin) with px-based arbitrary values matching the web site's rendered
 * banner size at default 16px base font.
 *
 * The CSS class is defined inline via Tailwind rather than in a separate
 * CSS file to avoid any cascade/layer/import ordering issues between
 * Tailwind v4's processing and our shared @waqfenau/design-tokens.
 */

import bismillahImg from '@waqfenau/design-tokens/bismillah.svg';
import type { FC } from 'react';

export const AnnouncementBanner: FC = () => (
    <div
        className="flex w-full items-center justify-center gap-1 overflow-hidden whitespace-nowrap bg-black px-3 py-[6px] text-sm text-muted dark:border-b dark:border-slate-800 dark:bg-transparent dark:text-slate-400 md:py-[8px] 2xl:py-[10px]"
    >
        <img
            src={bismillahImg}
            alt="Bismillah"
            className="inline-block h-[40px] w-auto invert md:h-[48px] lg:h-[56px] 2xl:h-[70px]"
        />
    </div>
);
