/**
 * TajneedAnalytics.tsx — Analytics dashboard querying the DuckDB data lake.
 *
 * KISS structure with clear visual sections:
 *   1. Header + Key metrics
 *   2. Demographics — gender distribution, age breakdown
 *   3. Geography — members by Jama'at
 *   4. Activity — registration trends, survey responses
 *   5. Summary — key insights at a glance
 *
 * All data sourced dynamically from parquet files via DuckDB WASM.
 */

import { useSql } from '@sqlrooms/duckdb';
import { Card, CardContent } from '@sqlrooms/ui';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { useRoomStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    AreaChart, Area,
} from 'recharts';
import {
    Users, FileText, ClipboardList,
    BarChart3, ArrowLeft, MapPin, Activity,
} from 'lucide-react';
import type { FC } from 'react';
import { AustraliaMap } from './AustraliaMap';
import { navigateToTable } from '../hooks/useMemberFilters';
import { injectJamaatFilter } from '../lib/sql';
import { useAuth } from '../lib/AuthContext';

/* ── Brand colours ─────────────────────────────────────────── */

const C = {
    male: '#00843d',
    female: '#e6b400',
    primary: '#00843d',
    accent: '#e6b400',
    navy: '#030620',
    teal: '#0d9488',
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

export const TajneedAnalytics: FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const ready = useRoomStore((s) => Boolean(s.db.findTableByName?.('members')));
    const { getJamaatFilter } = useAuth();

    /* ── Queries ──────────────────────────────────────────────── */
    const jamaatFilter = getJamaatFilter();
    const genderQ = useSql<{ gender: string; count: number }>({ query: injectJamaatFilter(`SELECT gender, COUNT(*)::int AS count FROM members GROUP BY gender ORDER BY gender`, jamaatFilter), enabled: ready });
    const ageGroupQ = useSql<{ age_group: string; gender: string; count: number }>({ query: injectJamaatFilter(`SELECT age_group, gender, COUNT(*)::int AS count FROM members GROUP BY age_group, gender ORDER BY age_group`, jamaatFilter), enabled: ready });
    const jamaatQ = useSql<{ jamaat: string; count: number }>({ query: injectJamaatFilter(`SELECT jamaat, COUNT(*)::int AS count FROM members GROUP BY jamaat ORDER BY count DESC`, jamaatFilter), enabled: ready });
    const totalQ = useSql<{ total: number }>({ query: injectJamaatFilter(`SELECT COUNT(*)::int AS total FROM members`, jamaatFilter), enabled: ready });
    const regCountQ = useSql<{ total: number }>({ query: `SELECT COUNT(*)::int AS total FROM registrations`, enabled: ready });
    const surveyCountQ = useSql<{ total: number }>({ query: `SELECT COUNT(*)::int AS total FROM surveys`, enabled: ready });
    const regTrendQ = useSql<{ month: string; count: number }>({ query: `SELECT strftime(submitted_at, '%Y-%m') AS month, COUNT(*)::int AS count FROM registrations GROUP BY month ORDER BY month`, enabled: ready });
    const surveyAvgQ = useSql<{ avg: number }>({ query: `SELECT ROUND(AVG(satisfaction_rating), 1)::float AS avg FROM surveys`, enabled: ready });

    /* ── Derive chart data ────────────────────────────────────── */
    const genderData = fromArrow(genderQ.data);
    const totalMale = Number(genderData.find((d: any) => d.gender === 'Male')?.count ?? 0);
    const totalFemale = Number(genderData.find((d: any) => d.gender === 'Female')?.count ?? 0);
    const genderPie = [
        { name: 'Male', value: totalMale, color: C.male },
        { name: 'Female', value: totalFemale, color: C.female },
    ];

    const ageRows = fromArrow(ageGroupQ.data);
    const ageGroups = [...new Set(ageRows.map((r: any) => r.age_group))].sort();
    const ageChartData = ageGroups.map((grp) => {
        const row: any = { age_group: grp };
        ageRows.filter((r: any) => r.age_group === grp).forEach((r: any) => { row[r.gender] = r.count; });
        row.Male ??= 0; row.Female ??= 0;
        return row;
    });

    const jamaatData = fromArrow(jamaatQ.data);
    const totalMembers = Number(fromArrow(totalQ.data)[0]?.total ?? 0);
    const regCount = Number(fromArrow(regCountQ.data)[0]?.total ?? 0);
    const surveyCount = Number(fromArrow(surveyCountQ.data)[0]?.total ?? 0);
    const regTrend = fromArrow(regTrendQ.data);
    const surveyAvg = Number(fromArrow(surveyAvgQ.data)[0]?.avg ?? 0);

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
                        <button onClick={() => navigate('/tajneed/')}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>

                        </div>
                    </div>
                </motion.div>

                {/* ═══ SUMMARY ═══ */}
                <motion.div variants={item} className="mb-10">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <motion.div
                            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
                            <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{totalMembers.toLocaleString()}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total Members</p>
                        </motion.div>
                        {/* More summary tiles to be added */}
                    </div>
                </motion.div>

                {/* ═══ SECTION 1: DEMOGRAPHICS ═══ */}
                <Section icon={Users} title="Demographics" subtitle="Gender and age distribution of registered members">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Gender pie */}
                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Gender Split</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={genderPie} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                                        paddingAngle={4} dataKey="value" animationBegin={200} animationDuration={1000}
                                        onClick={(entry) => navigateToTable(navigate, { gender: entry.name })}
                                        className="cursor-pointer">
                                        {genderPie.map((e, i) => <Cell key={i} fill={e.color} stroke="none"
                                            onClick={() => navigateToTable(navigate, { gender: e.name })}
                                            className="cursor-pointer" />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex items-center justify-center gap-8 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3 w-3 rounded-full bg-[#00843d]" />
                                    <span><strong className="text-green-700">{totalMale}</strong> Male</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block h-3 w-3 rounded-full bg-[#e6b400]" />
                                    <span><strong className="text-amber-600">{totalFemale}</strong> Female</span>
                                </div>
                            </div>
                        </ChartCard>

                        {/* Age bars */}
                        <ChartCard>
                            <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Age Groups</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={ageChartData} barGap={4} barCategoryGap="16%">
                                    <XAxis dataKey="age_group" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="Male" fill={C.male} radius={[4, 4, 0, 0]} animationDuration={800}
                                        onClick={(data: any) => data?.age_group && navigateToTable(navigate, { gender: 'Male', age_group: data.age_group })}
                                        className="cursor-pointer" />
                                    <Bar dataKey="Female" fill={C.female} radius={[4, 4, 0, 0]} animationDuration={800}
                                        onClick={(data: any) => data?.age_group && navigateToTable(navigate, { gender: 'Female', age_group: data.age_group })}
                                        className="cursor-pointer" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                                <span><span className="font-semibold text-slate-600">Groups:</span> {ageChartData.map((d: any) => d.age_group).join(' · ')}</span>
                            </div>
                        </ChartCard>
                    </div>
                </Section>

                {/* ═══ SECTION 2: GEOGRAPHY ═══ */}
                <Section icon={MapPin} title="Geography" subtitle="Member distribution across Australia by Jama'at">
                    {jamaatData.length > 0 ? (
                        <AustraliaMap
                            data={jamaatData as { jamaat: string; count: number }[]}
                            onCityClick={(jamaat) => navigateToTable(navigate, { jamaat })}
                        />
                    ) : (
                        <ChartCard>
                            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
                                No geographic data available
                            </div>
                        </ChartCard>
                    )}
                </Section>

                {/* ═══ SECTION 3: ACTIVITY ═══ */}
                <Section icon={Activity} title="Activity" subtitle="Form submissions and survey engagement">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Registration trend */}
                        <ChartCard>
                            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Registration Trends</h3>
                            {regTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={regTrend}>
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="count" stroke={C.primary} fill={C.primary} fillOpacity={0.1} strokeWidth={2} animationDuration={1000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data</div>}
                        </ChartCard>

                        {/* Quick stats */}
                        <ChartCard>
                            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Data Overview</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: FileText, label: 'Registrations', value: regCount, color: C.primary },
                                    { icon: ClipboardList, label: 'Survey Responses', value: surveyCount, color: C.teal },
                                    { icon: BarChart3, label: 'Avg Satisfaction', value: `${surveyAvg} / 5`, color: C.accent },
                                    { icon: Users, label: 'Data Sources', value: '4 tables (members, registrations, surveys, tally)', color: C.navy },
                                ].map((s, i) => (
                                    <motion.div key={i}
                                        className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 200, damping: 22 }}>
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                                            style={{ backgroundColor: s.color }}>
                                            <s.icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.value}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>
                </Section>

                {/* ═══ FOOTER ═══ */}
                <motion.div variants={item}
                    className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    Data from S3 data lake · DuckDB WASM · Updated on load
                </motion.div>
            </div>
        </div>
    );
};
