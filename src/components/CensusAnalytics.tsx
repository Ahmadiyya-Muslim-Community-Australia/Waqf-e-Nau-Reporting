/**
 * CensusAnalytics.tsx — Analytics dashboard for census survey data.
 *
 * KISS layout with sections:
 *   1. Header + Key metrics
 *   2. Khidmat — service roles distribution
 *   3. Education — education status breakdown
 *   4. Languages & Interests — language/interest area distribution
 *   5. Waqf Commitment — reconfirmation, Jamia intention
 *   6. Huzoor's Guidance — studies guidance, work permission
 *   7. Summary — key metrics at a glance
 *
 * All data sourced from census.parquet via DuckDB WASM.
 */

import { useSql } from '@sqlrooms/duckdb';
import { Card, CardContent } from '@sqlrooms/ui';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { useRoomStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { navigateToCensusTable } from '../hooks/useCensusFilters';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
    Heart, BookOpen, Globe, Award,
    ArrowLeft, Activity, Briefcase,
    UserCheck, ShieldCheck,
} from 'lucide-react';
import type { FC } from 'react';

/* ── Brand colours ─────────────────────────────────────────── */

const C = {
    primary: '#00843d',
    accent: '#e6b400',
    teal: '#0d9488',
    navy: '#030620',
    purple: '#7c3aed',
    rose: '#e11d48',
} as const;

/* ── Animation ─────────────────────────────────────────────── */

const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 22 } },
};

/* ── Tooltip wrapper ───────────────────────────────────────── */

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">
                    {p.name}: {p.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

/* ── Section wrapper ───────────────────────────────────────── */

const Section: FC<{ icon: FC<{ className?: string }>; title: string; subtitle?: string; children: React.ReactNode }> = ({
    icon: Icon, title, subtitle, children,
}) => (
    <motion.div variants={item} className="mb-10">
        <div className="mb-4 flex items-center gap-2">
            <Icon className="h-5 w-5 text-brand" />
            <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
        </div>
        {children}
    </motion.div>
);

/* ── Chart card wrapper ────────────────────────────────────── */

const ChartCard: FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <Card className={`overflow-hidden transition-shadow duration-300 hover:shadow-lg ${className ?? ''}`}>
        <CardContent className="p-5">{children}</CardContent>
    </Card>
);

/** Safely convert an Arrow table result to a plain object array. */
function fromArrow(data: unknown): Record<string, unknown>[] {
    if (!data) return [];
    try {
        return (data as { toArray: () => Record<string, unknown>[] }).toArray().map((r) => ({ ...r }));
    } catch { return []; }
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const CensusAnalytics: FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const ready = useRoomStore((s) => Boolean(s.db.findTableByName?.('census')));

    /* ── Queries ──────────────────────────────────────────────── */
    const totalQ = useSql<{ total: number }>({ query: `SELECT COUNT(*)::int AS total FROM census`, enabled: ready });

    const khidmatJamaatQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT khidmat_jamaat AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const khidmatAuxQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT khidmat_auxiliary AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const educationQ = useSql<{ status: string; count: number }>({
        query: `SELECT education_status AS status, COUNT(*)::int AS count FROM census WHERE education_status IS NOT NULL GROUP BY status ORDER BY count DESC`,
        enabled: ready,
    });
    const languageQ = useSql<{ lang: string; count: number }>({
        query: `SELECT languages AS lang, COUNT(*)::int AS count FROM census WHERE languages IS NOT NULL GROUP BY lang ORDER BY count DESC`,
        enabled: ready,
    });
    const interestQ = useSql<{ area: string; count: number }>({
        query: `SELECT interest_area AS area, COUNT(*)::int AS count FROM census WHERE interest_area IS NOT NULL GROUP BY area ORDER BY count DESC`,
        enabled: ready,
    });
    const reconfirmed15Q = useSql<{ value: boolean; count: number }>({
        query: `SELECT reconfirmed_15 AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const reconfirmed18Q = useSql<{ value: boolean; count: number }>({
        query: `SELECT reconfirmed_18 AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const continueWaqfQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT continue_waqf AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const intendJamiaQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT intend_jamia AS value, COUNT(*)::int AS count FROM census WHERE intend_jamia IS NOT NULL GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const employedQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT employed AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const moosiQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT is_moosi AS value, COUNT(*)::int AS count FROM census WHERE is_moosi IS NOT NULL GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const syllabusQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT syllabus_current AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const volunteerQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT wish_volunteer AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const guidanceHuzoorQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT guidance_huzoor AS value, COUNT(*)::int AS count FROM census WHERE guidance_huzoor IS NOT NULL GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    const permissionHuzoorQ = useSql<{ value: boolean; count: number }>({
        query: `SELECT permission_huzoor AS value, COUNT(*)::int AS count FROM census WHERE permission_huzoor IS NOT NULL GROUP BY value ORDER BY value`,
        enabled: ready,
    });
    /** Cross-tab: employment vs permission from Huzoor */
    const employPermissionQ = useSql<{ employed: boolean; permission: boolean; count: number }>({
        query: `SELECT employed, permission_huzoor AS permission, COUNT(*)::int AS count FROM census WHERE permission_huzoor IS NOT NULL GROUP BY employed, permission_huzoor ORDER BY employed, permission_huzoor`,
        enabled: ready,
    });

    /* ── Derive chart data ────────────────────────────────────── */
    const total = Number(fromArrow(totalQ.data)[0]?.total ?? 0);

    const toBoolPie = (data: unknown, trueLabel: string, falseLabel: string) => {
        const rows = fromArrow(data);
        const t = Number(rows.find((r: any) => r.value === true || r.value === 1)?.count ?? 0);
        const f = Number(rows.find((r: any) => r.value === false || r.value === 0)?.count ?? 0);
        return [
            { name: trueLabel, value: t, color: C.primary },
            { name: falseLabel, value: f, color: '#e2e8f0' },
        ].filter((d) => d.value > 0);
    };

    const khidmatJamaatData = toBoolPie(khidmatJamaatQ.data, 'Has Khidmat', 'No Khidmat');
    const khidmatAuxData = toBoolPie(khidmatAuxQ.data, 'Has Aux. Khidmat', 'No Aux. Khidmat');
    const reconfirmed15Data = toBoolPie(reconfirmed15Q.data, 'Reconfirmed at 15', 'Not Yet');
    const reconfirmed18Data = toBoolPie(reconfirmed18Q.data, 'Reconfirmed at 18', 'Not Yet');
    const continueWaqfData = toBoolPie(continueWaqfQ.data, 'Will Continue', 'Will Not');
    const intendJamiaData = toBoolPie(intendJamiaQ.data, 'Intends Jamia', 'Does Not');
    const employedData = toBoolPie(employedQ.data, 'Employed', 'Not Employed');
    const moosiData = toBoolPie(moosiQ.data, 'Moosi', 'Not Moosi');
    const syllabusData = toBoolPie(syllabusQ.data, 'Up to Date', 'Behind');
    const volunteerData = toBoolPie(volunteerQ.data, 'Wishes to Volunteer', 'No');

    const guidanceHuzoorData = toBoolPie(guidanceHuzoorQ.data, 'Sought Guidance', 'Not Sought');
    const permissionHuzoorData = toBoolPie(permissionHuzoorQ.data, 'Has Permission', 'No Permission');

    /** Build cross-tab data: employed working-permission vs working-without-permission */
    const employPermRows = fromArrow(employPermissionQ.data);
    const employPermData = employPermRows.reduce((acc: Record<string, { name: string; value: number; color: string }>, r: any) => {
        const employed = r.employed === true || r.employed === 1;
        const permitted = r.permission === true || r.permission === 1;
        let key: string;
        if (employed && permitted) key = 'Employed with Permission';
        else if (employed && !permitted) key = 'Employed without Permission';
        else key = 'Not Employed';
        if (!acc[key]) {
            acc[key] = { name: key, value: 0, color: key === 'Employed with Permission' ? C.primary : key === 'Employed without Permission' ? '#e11d48' : '#e2e8f0' };
        }
        acc[key].value += r.count as number;
        return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);
    const employPermChartData = Object.values(employPermData);

    const educationData = fromArrow(educationQ.data);
    const languageData = fromArrow(languageQ.data);
    const interestData = fromArrow(interestQ.data);

    if (!ready) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
                    <span className="text-sm">{t('loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="mx-auto w-full max-w-7xl px-6 py-8">

                {/* ═══ HEADER ═══ */}
                <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/census/')}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Census Analytics</h1>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ SECTION 1: SERVICE/KHIDMAT ═══ */}
                <Section icon={Heart} title="Khidmat & Service" subtitle="Service roles and volunteer interest">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Khidmat in Jama'at</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={khidmatJamaatData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                        paddingAngle={4} dataKey="value" animationBegin={200} animationDuration={800}>
                                        {khidmatJamaatData.map((e, i) => <Cell key={i} fill={e.color} stroke="none"
                                            onClick={() => navigateToCensusTable(navigate, [{ column: 'khidmat_jamaat', value: e.name === 'Has Khidmat' }])}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {khidmatJamaatData[0] && (
                                <p className="text-center text-xs text-slate-500">
                                    <strong className="text-green-700">{khidmatJamaatData[0].value}</strong> {khidmatJamaatData[0].name.toLowerCase()}
                                </p>
                            )}
                        </ChartCard>

                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Khidmat in Auxiliary</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={khidmatAuxData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                        paddingAngle={4} dataKey="value" animationBegin={400} animationDuration={800}>
                                        {khidmatAuxData.map((e, i) => <Cell key={i} fill={e.color} stroke="none"
                                            onClick={() => navigateToCensusTable(navigate, [{ column: 'khidmat_auxiliary', value: e.name === 'Has Aux. Khidmat' }])}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {khidmatAuxData[0] && (
                                <p className="text-center text-xs text-slate-500">
                                    <strong className="text-green-700">{khidmatAuxData[0].value}</strong> {khidmatAuxData[0].name.toLowerCase()}
                                </p>
                            )}
                        </ChartCard>

                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Wishes to Volunteer</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={volunteerData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                        paddingAngle={4} dataKey="value" animationBegin={600} animationDuration={800}>
                                        {volunteerData.map((e, i) => <Cell key={i} fill={e.color} stroke="none"
                                            onClick={() => navigateToCensusTable(navigate, [{ column: 'wish_volunteer', value: e.name === 'Wishes to Volunteer' }])}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {volunteerData[0] && (
                                <p className="text-center text-xs text-slate-500">
                                    <strong className="text-green-700">{volunteerData[0].value}</strong> wish to volunteer
                                </p>
                            )}
                        </ChartCard>
                    </div>
                </Section>

                {/* ═══ SECTION 2: EDUCATION ═══ */}
                <Section icon={BookOpen} title="Education" subtitle="Education status and qualifications">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ChartCard>
                            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Education Status</h3>
                            {educationData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={Math.max(200, educationData.length * 36)}>
                                    <BarChart data={educationData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="count" fill={C.primary} radius={[0, 4, 4, 0]} animationDuration={800}
                                            onClick={(entry: any) => entry?.status && navigateToCensusTable(navigate, [{ column: 'education_status', value: entry.status }])}
                                            className="cursor-pointer" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">No data</div>}
                        </ChartCard>

                        <ChartCard>
                            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Interest Areas</h3>
                            {interestData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={Math.max(200, interestData.length * 50)}>
                                    <BarChart data={interestData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <YAxis dataKey="area" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="count" fill={C.teal} radius={[0, 4, 4, 0]} animationDuration={800}
                                            onClick={(entry: any) => entry?.area && navigateToCensusTable(navigate, [{ column: 'interest_area', value: entry.area }])}
                                            className="cursor-pointer" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">No data</div>}
                        </ChartCard>
                    </div>
                </Section>

                {/* ═══ SECTION 3: LANGUAGES ═══ */}
                <Section icon={Globe} title="Languages" subtitle="Languages spoken by members">
                    <ChartCard>
                        {languageData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={Math.max(200, languageData.length * 45)}>
                                <BarChart data={languageData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis dataKey="lang" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="count" fill={C.accent} radius={[0, 4, 4, 0]} animationDuration={800}
                                        onClick={(entry: any) => entry?.lang && navigateToCensusTable(navigate, [{ column: 'languages', value: entry.lang }])}
                                        className="cursor-pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">No data</div>}
                    </ChartCard>
                </Section>

                {/* ═══ SECTION 4: WAQF COMMITMENT ═══ */}
                <Section icon={Award} title="Waqf Commitment" subtitle="Reconfirmation, Jamia intention, and continued commitment">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {[
                            { title: 'Reconfirmed at 15', data: reconfirmed15Data },
                            { title: 'Reconfirmed at 18', data: reconfirmed18Data },
                            { title: 'Continue Waqf', data: continueWaqfData },
                            { title: 'Intends Jamia', data: intendJamiaData },
                        ].map((s, i) => (
                            <ChartCard key={i}>
                                <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{s.title}</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={s.data} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                                            paddingAngle={4} dataKey="value" animationBegin={i * 200} animationDuration={600}>
                                            {s.data.map((e, j) => <Cell key={j} fill={e.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {s.data[0] && (
                                    <p className="text-center text-xs text-slate-500">
                                        <strong className="text-green-700">{s.data[0].value}</strong> yes
                                    </p>
                                )}
                            </ChartCard>
                        ))}
                    </div>
                </Section>

                {/* ═══ SECTION 5: HUZOOR'S GUIDANCE ═══ */}
                <Section icon={UserCheck} title="Huzoor's Guidance" subtitle="Sought guidance for studies and permission to work">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Guidance for Studies</h3>
                            <p className="mb-2 text-xs text-slate-400">Sought guidance from Huzoor-e-Anwar (aba)</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={guidanceHuzoorData} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                                        paddingAngle={4} dataKey="value" animationBegin={200} animationDuration={800}>
                                        {guidanceHuzoorData.map((e, i) => <Cell key={i} fill={e.color} stroke="none"
                                            onClick={() => navigateToCensusTable(navigate, [{ column: 'guidance_huzoor', value: e.name === 'Sought Guidance' }])}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {guidanceHuzoorData[0] && (
                                <p className="text-center text-xs text-slate-500">
                                    <strong className="text-green-700">{((guidanceHuzoorData[0].value / (guidanceHuzoorData[0].value + (guidanceHuzoorData[1]?.value ?? 0))) * 100).toFixed(0)}%</strong> sought guidance
                                </p>
                            )}
                        </ChartCard>

                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Permission to Work</h3>
                            <p className="mb-2 text-xs text-slate-400">Sought permission from Huzoor-e-Anwar (aba)</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={permissionHuzoorData} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                                        paddingAngle={4} dataKey="value" animationBegin={400} animationDuration={800}>
                                        {permissionHuzoorData.map((e, i) => <Cell key={i} fill={e.color} stroke="none"
                                            onClick={() => navigateToCensusTable(navigate, [{ column: 'permission_huzoor', value: e.name === 'Has Permission' }])}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {permissionHuzoorData[0] && (
                                <p className="text-center text-xs text-slate-500">
                                    <strong className="text-green-700">{((permissionHuzoorData[0].value / (permissionHuzoorData[0].value + (permissionHuzoorData[1]?.value ?? 0))) * 100).toFixed(0)}%</strong> have permission
                                </p>
                            )}
                        </ChartCard>

                        <ChartCard>
                            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <ShieldCheck className="h-4 w-4 text-brand" /> Work & Permission
                            </h3>
                            <p className="mb-2 text-xs text-slate-400">Employment status × Huzoor's permission</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={employPermChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                                        paddingAngle={4} dataKey="value" animationBegin={600} animationDuration={800}>
                                        {employPermChartData.map((e: Record<string, unknown>, i: number) => <Cell key={i} fill={(e.color as string) || '#00843d'} stroke="none"
                                            onClick={() => {
                                                if (e.name === 'Employed with Permission') {
                                                    navigateToCensusTable(navigate, [{ column: 'employed', value: true }, { column: 'permission_huzoor', value: true }]);
                                                } else if (e.name === 'Employed without Permission') {
                                                    navigateToCensusTable(navigate, [{ column: 'employed', value: true }, { column: 'permission_huzoor', value: false }]);
                                                } else {
                                                    navigateToCensusTable(navigate, [{ column: 'employed', value: false }]);
                                                }
                                            }}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {employPermChartData.find((d: Record<string, unknown>) => d.name === 'Employed without Permission') && (
                                <p className="text-center text-xs text-rose-600">
                                    ⚠️ {String((employPermChartData.find((d: Record<string, unknown>) => d.name === 'Employed without Permission') as Record<string, unknown> | undefined)?.value ?? '')} employed without permission
                                </p>
                            )}
                        </ChartCard>
                    </div>
                </Section>

                {/* ═══ SECTION 6: SUMMARY ═══ */}
                <Section icon={Activity} title="At a Glance" subtitle="Key metrics from census data">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {[
                            { icon: Briefcase, label: 'Employment', data: employedData },
                            { icon: Award, label: 'Moosi Status', data: moosiData },
                            { icon: BookOpen, label: 'Syllabus', data: syllabusData },
                            { icon: Heart, label: 'Volunteer Interest', data: volunteerData },
                        ].map((s, i) => (
                            <ChartCard key={i}>
                                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <s.icon className="h-4 w-4 text-brand" /> {s.label}
                                </h3>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={s.data} cx="50%" cy="50%" innerRadius={35} outerRadius={58}
                                            paddingAngle={4} dataKey="value" animationBegin={i * 200} animationDuration={600}>
                                            {s.data.map((e, j) => <Cell key={j} fill={e.color} stroke="none"
                                                onClick={() => {
                                                    const cols = ['employed', 'is_moosi', 'syllabus_current', 'wish_volunteer'];
                                                    navigateToCensusTable(navigate, [{ column: cols[i], value: e.name === s.data[0].name }]);
                                                }}
                                                className="cursor-pointer" />)}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {s.data[0] && (
                                    <p className="text-center text-xs text-slate-500">
                                        <strong className="text-green-700">{((s.data[0].value / total) * 100).toFixed(0)}%</strong> {s.data[0].name.toLowerCase()}
                                    </p>
                                )}
                            </ChartCard>
                        ))}
                    </div>
                </Section>

                {/* ═══ FOOTER ═══ */}
                <motion.div variants={item}
                    className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    {total.toLocaleString()} census responses · Data from S3 data lake · DuckDB WASM
                </motion.div>
            </div>
        </div>
    );
};
