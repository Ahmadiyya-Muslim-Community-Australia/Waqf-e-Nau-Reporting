/**
 * MemberCellRenderer.tsx — Premium AG Grid cell renderer for member identity.
 *
 * Renders a coloured initial-avatar + full name. When clicked, opens a rich
 * MemberPopover card with full member details (gender, age, jama'at, phone,
 * family tree).
 *
 * The AG Grid React cell renderer receives the cell `value` as prop, plus
 * the full row data via `data` on the props object.
 */

import type { FC } from 'react';
import { MemberPopover } from './MemberPopover';

/* ── Colour palette for avatars ─────────────────────────────── */

const AVATAR_COLORS = [
    'bg-brand',
    'bg-amber-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-orange-500',
];

function hashColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════ */

interface MemberCellRendererProps {
    value: string;
    data?: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const MemberCellRenderer: FC<MemberCellRendererProps> = ({ value, data }) => {
    if (!value || !data) {
        return <span className="text-sm text-slate-400">—</span>;
    }

    const color = hashColor(value);
    const init = initials(value);

    return (
        <MemberPopover rowData={data}>
            <div className="flex h-full cursor-pointer items-center gap-2.5 py-1">
                {/* Initials avatar */}
                <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}
                >
                    {init}
                </span>
                {/* Name */}
                <div className="min-w-0 overflow-hidden">
                    <div className="truncate text-sm font-semibold text-slate-900 underline decoration-dotted underline-offset-2 hover:decoration-solid dark:text-white">
                        {value}
                    </div>
                </div>
            </div>
        </MemberPopover>
    );
};
