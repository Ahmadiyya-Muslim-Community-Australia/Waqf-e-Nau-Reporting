import { useSql } from '@sqlrooms/duckdb';
import { Spinner } from '@sqlrooms/ui';
import { useRoomStore } from '../store';
import type { FC } from 'react';

/**
 * Initial dashboard panel — mirrors the key queries that were in Evidence.
 * Each useSql hook lazily queries DuckDB-WASM once the source table is ready.
 */

const MemberCount: FC = () => {
    const membersReady = useRoomStore((s) => Boolean(s.db.findTableByName('members')));

    const { data, isLoading, error } = useSql<{ total: number }>({
        query: `SELECT COUNT(*)::int AS total FROM members`,
        enabled: membersReady,
    });

    if (!membersReady) return null;
    if (isLoading) return <Spinner />;
    if (error) return <span className="text-red-500">Error: {error.message}</span>;

    const row = data?.toArray()[0];
    return (
        <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Members
            </span>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {row?.total?.toLocaleString() ?? '—'}
            </span>
        </div>
    );
};

const TallyFormsCount: FC = () => {
    const formsReady = useRoomStore((s) => Boolean(s.db.findTableByName('tally_forms')));

    const { data, isLoading, error } = useSql<{ total: number }>({
        query: `SELECT COUNT(*)::int AS total FROM tally_forms`,
        enabled: formsReady,
    });

    if (!formsReady) return null;
    if (isLoading) return <Spinner />;
    if (error) return <span className="text-red-500">Error: {error.message}</span>;

    const row = data?.toArray()[0];
    return (
        <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Tally Forms
            </span>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {row?.total?.toLocaleString() ?? '—'}
            </span>
        </div>
    );
};

const RecentRegistrations: FC = () => {
    const regReady = useRoomStore((s) => Boolean(s.db.findTableByName('registrations')));

    const { data, isLoading, error } = useSql<{
        created_at: string;
        form_name: string;
    }>({
        query: `
      SELECT created_at, form_name
      FROM registrations
      ORDER BY CAST(created_at AS TIMESTAMP) DESC
      LIMIT 5
    `,
        enabled: regReady,
    });

    if (!regReady) return null;
    if (isLoading) return <Spinner />;
    if (error) return <span className="text-red-500">Error: {error.message}</span>;

    const rows = data?.toArray() ?? [];
    return (
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                Recent Registrations
            </h3>
            {rows.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500">No data yet.</p>
            ) : (
                <ul className="space-y-2">
                    {rows.map((r, i) => (
                        <li
                            key={i}
                            className="flex items-center justify-between text-sm"
                        >
                            <span className="text-slate-700 dark:text-slate-200">
                                {r.form_name ?? 'Unknown'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                                {r.created_at}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

/**
 * Main dashboard — grid of metric cards and recent activity.
 * Each section independently lazy-loads its data through DuckDB-WASM.
 */
export const Dashboard: FC = () => {
    const initialized = useRoomStore((s) => s.room.initialized);

    if (!initialized) {
        return (
            <div className="flex h-full items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto p-6">
            <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                Waqf-e-Nau Reports
            </h1>

            {/* Metric cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MemberCount />
                <TallyFormsCount />
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Data Sources
                    </span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">5</span>
                </div>
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RecentRegistrations />

                {/* Placeholder — will be replaced with charts/tables from @sqlrooms/mosaic or @sqlrooms/recharts */}
                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
                    <h3 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Coming Soon
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500">
                        Charts, tables, and SQL query editor will be added in upcoming iterations.
                    </p>
                </div>
            </div>
        </div>
    );
};
