/**
 * MemberPopover.tsx — Premium Radix popover card showing full member details.
 *
 * Triggered by clicking the member's name/avatar in the census table.
 * Displays a rich card with member identity information, family tree,
 * and contact details — all sourced from the row's JOINed data.
 *
 * Uses @radix-ui/react-popover for accessible, floating UI with
 * framer-motion for the enter/exit animation.
 */

import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, Users, UserCircle } from 'lucide-react';
import { useState, type FC, type ReactNode } from 'react';

/* ── Avatar colours (same palette as MemberCellRenderer) ────── */

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
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/* ── Field row ──────────────────────────────────────────────── */

const FieldRow: FC<{ icon: FC<{ className?: string }>; label: string; value: string | number | boolean | null | undefined }> = ({
    icon: Icon,
    label,
    value,
}) => {
    if (value == null || value === false) return null;
    const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
        <div className="flex items-start gap-2 text-xs">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <div className="min-w-0">
                <span className="text-slate-400">{label}:</span>{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{display}</span>
            </div>
        </div>
    );
};

/* ── Props ──────────────────────────────────────────────────── */

interface MemberPopoverProps {
    /** Full AG Grid row data — all JOINed member fields are available. */
    rowData: Record<string, unknown>;
    children: ReactNode;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const MemberPopover: FC<MemberPopoverProps> = ({ rowData, children }) => {
    const [open, setOpen] = useState(false);

    const name = (rowData['Member Name'] as string) ?? '';
    const gender = rowData['Gender'] as string | undefined;
    const age = rowData['Age'] as number | undefined;
    const jamaat = rowData["Jama'at"] as string | undefined;
    const phone = rowData['Primary Phone'] as string | undefined;
    const secondaryPhone = rowData['Secondary Phone'] as string | undefined;
    const fatherGiven = rowData["Father's Given Names"] as string | undefined;
    const fatherFamily = rowData["Father's Family Name"] as string | undefined;
    const motherGiven = rowData["Mother's Given Names"] as string | undefined;
    const motherFamily = rowData["Mother's Family Name"] as string | undefined;
    const grandfatherGiven = rowData["Grandfather's Given Names"] as string | undefined;
    const grandfatherFamily = rowData["Grandfather's Family Name"] as string | undefined;

    const color = hashColor(name);
    const init = initials(name);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>{children}</Popover.Trigger>
            <AnimatePresence>
                {open && (
                    <Popover.Portal forceMount>
                        <Popover.Content asChild side="right" align="start" sideOffset={8} className="z-50">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="w-72 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
                            >
                                {/* Header with avatar */}
                                <div className="flex items-start gap-3 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-700">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
                                        {init}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
                                        <p className="text-xs text-slate-400">
                                            {[gender, age != null && `${age} years`, jamaat].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="flex h-5 w-5 items-center justify-center rounded text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* Details */}
                                <div className="space-y-2.5 px-4 py-3">
                                    <FieldRow icon={MapPin} label="Jama'at" value={jamaat} />
                                    <FieldRow icon={Phone} label="Primary Phone" value={phone} />
                                    <FieldRow icon={Phone} label="Secondary Phone" value={secondaryPhone} />

                                    <div className="border-t border-slate-100 pt-2 dark:border-slate-700">
                                        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            <Users className="h-3 w-3" /> Family
                                        </p>
                                        <FieldRow icon={UserCircle} label="Father" value={fatherGiven ? `${fatherGiven} ${fatherFamily}` : undefined} />
                                        <FieldRow icon={UserCircle} label="Mother" value={motherGiven ? `${motherGiven} ${motherFamily}` : undefined} />
                                        <FieldRow icon={UserCircle} label="Grandfather" value={grandfatherGiven ? `${grandfatherGiven} ${grandfatherFamily}` : undefined} />
                                    </div>
                                </div>

                                <Popover.Arrow className="fill-white dark:fill-slate-700" />
                            </motion.div>
                        </Popover.Content>
                    </Popover.Portal>
                )}
            </AnimatePresence>
        </Popover.Root>
    );
};
