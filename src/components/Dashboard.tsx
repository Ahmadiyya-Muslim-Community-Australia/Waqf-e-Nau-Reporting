import { useSql } from '@sqlrooms/duckdb';
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Card,
    CardContent,
    Skeleton,
    Spinner,
} from '@sqlrooms/ui';
import { useRoomStore } from '../store';
import { useLanguage } from '../i18n/LanguageContext';
import { Users, FileText, Database, AlertCircle, Clock, LayoutDashboard } from 'lucide-react';
import type { FC } from 'react';

// ── Metric card wrapper ──────────────────────────────────────

interface MetricCardProps {
    icon: FC<{ className?: string }>;
    label: string;
    value: string;
    loading?: boolean;
    error?: string | null;
}

const MetricCard: FC<MetricCardProps> = ({ icon: Icon, label, value, loading, error }) => {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:ring-brand/20 dark:hover:ring-brand/30">
            {/* Green accent bar */}
            <div className="absolute left-0 top-0 h-full w-1 bg-brand" />

            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand dark:bg-brand/20 dark:text-brand-light">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                            {label}
                        </p>
                        {error ? (
                            <p className="flex items-center gap-1 text-sm text-red-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {error}
                            </p>
                        ) : (
                            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {value}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ── Query sub-components ─────────────────────────────────────

const MemberCount: FC = () => {
    const { t } = useLanguage();
    const membersReady = useRoomStore((s) => Boolean(s.db.findTableByName('members')));

    const { data, isLoading, error } = useSql<{ total: number }>({
        query: `SELECT COUNT(*)::int AS total FROM members`,
        enabled: membersReady,
    });

    if (!membersReady) return <MetricCard icon={Users} label={t('totalMembers')} value="—" loading />;
    const row = data?.toArray()[0];
    return (
        <MetricCard
            icon={Users}
            label={t('totalMembers')}
            value={row?.total?.toLocaleString() ?? '—'}
            loading={isLoading}
            error={error?.message}
        />
    );
};

const TallyFormsCount: FC = () => {
    const { t } = useLanguage();
    const formsReady = useRoomStore((s) => Boolean(s.db.findTableByName('tally_forms')));

    const { data, isLoading, error } = useSql<{ total: number }>({
        query: `SELECT COUNT(*)::int AS total FROM tally_forms`,
        enabled: formsReady,
    });

    if (!formsReady) return <MetricCard icon={FileText} label={t('tallyForms')} value="—" loading />;
    const row = data?.toArray()[0];
    return (
        <MetricCard
            icon={FileText}
            label={t('tallyForms')}
            value={row?.total?.toLocaleString() ?? '—'}
            loading={isLoading}
            error={error?.message}
        />
    );
};

const StaticDataSources: FC = () => {
    const { t } = useLanguage();
    return (
        <MetricCard
            icon={Database}
            label={t('dataSources')}
            value="5"
        />
    );
};

const RecentRegistrations: FC = () => {
    const { t } = useLanguage();
    const regReady = useRoomStore((s) => Boolean(s.db.findTableByName('registrations')));

    const { data, isLoading, error } = useSql<{
        submitted_at: string;
        form_name: string;
    }>({
        query: `
      SELECT submitted_at, form_name
      FROM registrations
      ORDER BY CAST(submitted_at AS TIMESTAMP) DESC
      LIMIT 5
    `,
        enabled: regReady,
    });

    if (!regReady || isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-6">
                    <Spinner className="h-5 w-5 text-slate-400" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('error')}</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    const rows = data?.toArray() ?? [];
    return (
        <Card className="transition-all duration-200 hover:shadow-md">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t('recentRegistrations')}
                    </h3>
                </div>
            </div>
            <CardContent className="p-6">
                {rows.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                        {t('noData')}
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                        {rows.map((r, i) => (
                            <li
                                key={i}
                                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                            >
                                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {r.form_name ?? 'Unknown'}
                                </span>
                                <span className="ml-4 shrink-0 text-xs text-slate-400 dark:text-slate-500">
                                    {r.submitted_at}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};

// ── Loading state ────────────────────────────────────────────

const DashboardSkeleton: FC = () => (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Header skeleton */}
        <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        {/* Cards skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
        </div>
        {/* Bottom skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card><CardContent className="p-6"><Skeleton className="h-36 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-36 w-full" /></CardContent></Card>
        </div>
    </div>
);

// ── Main Dashboard ───────────────────────────────────────────

/**
 * Main dashboard — grid of metric cards and recent activity.
 * Each section independently lazy-loads its data through DuckDB-WASM.
 */
export const Dashboard: FC = () => {
    const { t } = useLanguage();
    const initialized = useRoomStore((s) => s.room.initialized);

    if (!initialized) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
            <div className="mx-auto w-full max-w-7xl px-6 py-8">
                {/* ── Header banner ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {t('title')}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t('subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Metric cards ── */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MemberCount />
                    <TallyFormsCount />
                    <StaticDataSources />
                </div>

                {/* ── Bottom section ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <RecentRegistrations />

                    {/* Placeholder — will be replaced with charts/tables */}
                    <Card className="transition-all duration-200 hover:shadow-md">
                        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-brand" />
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {t('comingSoon')}
                                </h3>
                            </div>
                        </div>
                        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
                            <LayoutDashboard className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                {t('comingSoonDesc')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Footer ── */}
                <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    {t('footer')}
                </div>
            </div>
        </div>
    );
};
