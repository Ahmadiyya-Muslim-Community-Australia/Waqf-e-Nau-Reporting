/**
 * TajneedReports.tsx — Pre-built Tajneed report templates with export.
 *
 * Reports:
 *   1. Member Roster — full member list sorted by Jama'at
 *   2. Jama'at Summary — member counts by Jama'at
 *   3. Age Group Distribution — members by age group and gender
 *   4. Registration Trends — registrations over time
 */

import { useSql } from '@sqlrooms/duckdb';
import { Card, CardContent } from '@sqlrooms/ui';
import { useState, useCallback, type FC } from 'react';
import { useRoomStore } from '../store';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area,
} from 'recharts';
import {
  Users, MapPin, BarChart3, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ReportTemplate } from './ReportTemplate';
import { downloadCsv } from '../utils/exportCsv';
import { injectJamaatFilter } from '../lib/sql';
import { useAuth } from '../lib/AuthContext';

/* ── Helpers ───────────────────────────────────────────────── */

function fromArrow(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  try {
    return (data as { toArray: () => Record<string, unknown>[] }).toArray().map((r) => ({ ...r }));
  } catch { return []; }
}

const C = {
  male: '#00843d',
  female: '#e6b400',
  primary: '#00843d',
  accent: '#e6b400',
  navy: '#030620',
  teal: '#0d9488',
} as const;

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

/* ── Report section ────────────────────────────────────────── */

const ReportSection: FC<{
  icon: FC<{ className?: string }>;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-brand" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <CardContent className="px-5 pb-5 pt-0">{children}</CardContent>}
    </Card>
  );
};

/* ── TajneedReports ────────────────────────────────────────── */

export const TajneedReports: FC = () => {
  const ready = useRoomStore((s) => Boolean(s.db.findTableByName?.('members')));
  const registrationsReady = useRoomStore((s) => Boolean(s.db.findTableByName?.('registrations')));
  const { getJamaatFilter } = useAuth();

  const jamaatFilter = getJamaatFilter();

  const rosterQ = useSql<Record<string, unknown>>({
    query: injectJamaatFilter(`SELECT member_id, given_names, family_name, gender, age, age_group, jamaat, primary_phone
FROM members ORDER BY jamaat, family_name, given_names`, jamaatFilter),
    enabled: ready,
  });

  const jamaatQ = useSql<{ jamaat: string; count: number }>({
    query: injectJamaatFilter(`SELECT jamaat, COUNT(*)::int AS count FROM members GROUP BY jamaat ORDER BY count DESC`, jamaatFilter),
    enabled: ready,
  });

  const ageGroupQ = useSql<{ age_group: string; gender: string; count: number }>({
    query: injectJamaatFilter(`SELECT age_group, gender, COUNT(*)::int AS count FROM members GROUP BY age_group, gender ORDER BY age_group`, jamaatFilter),
    enabled: ready,
  });

  const trendsQ = useSql<{ month: string; count: number }>({
    query: `SELECT strftime(submitted_at, '%Y-%m') AS month, COUNT(*)::int AS count FROM registrations GROUP BY month ORDER BY month`,
    enabled: registrationsReady,
  });

  const roster = fromArrow(rosterQ.data);
  const jamaatData = fromArrow(jamaatQ.data);
  const ageGroupData = fromArrow(ageGroupQ.data);
  const trendsData = fromArrow(trendsQ.data);

  /* ── Export handlers ──────────────────────────────────────── */

  const handleCsvRoster = useCallback(() => downloadCsv(roster, 'member-roster'), [roster]);
  const handleCsvJamaat = useCallback(() => downloadCsv(jamaatData, 'jamaat-summary'), [jamaatData]);
  const handleCsvAge = useCallback(() => downloadCsv(ageGroupData, 'age-group-distribution'), [ageGroupData]);
  const handleCsvTrends = useCallback(() => downloadCsv(trendsData, 'registration-trends'), [trendsData]);

  const loading = !ready;

  return (
    <ReportTemplate
      title="Tajneed Reports"
      subtitle="Pre-built member data reports with export options"
      hideToolbar
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. Member Roster */}
          <ReportSection icon={Users} title="Member Roster" subtitle={`${roster.length} members sorted by Jama'at`}>
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsvRoster} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-2 max-h-80 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Gender</th>
                    <th className="px-3 py-2 font-semibold">Age</th>
                    <th className="px-3 py-2 font-semibold">Age Group</th>
                    <th className="px-3 py-2 font-semibold">Jama'at</th>
                    <th className="px-3 py-2 font-semibold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                      <td className="px-3 py-1.5 font-medium">{String(r.given_names ?? '')} {String(r.family_name ?? '')}</td>
                      <td className="px-3 py-1.5">{String(r.gender ?? '')}</td>
                      <td className="px-3 py-1.5">{String(r.age ?? '')}</td>
                      <td className="px-3 py-1.5">{String(r.age_group ?? '')}</td>
                      <td className="px-3 py-1.5">{String(r.jamaat ?? '')}</td>
                      <td className="px-3 py-1.5">{String(r.primary_phone ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {/* 2. Jama'at Summary */}
          <ReportSection icon={MapPin} title="Jama'at Summary" subtitle={`${jamaatData.length} Jama'ats`}>
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsvJamaat} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 font-semibold">Jama'at</th><th className="px-3 py-2 font-semibold">Members</th></tr>
                  </thead>
                  <tbody>
                    {jamaatData.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                        <td className="px-3 py-1.5">{String(r.jamaat ?? '')}</td>
                        <td className="px-3 py-1.5 font-medium">{(r.count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={jamaatData.slice(0, 15)}>
                  <XAxis dataKey="jamaat" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={C.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportSection>

          {/* 3. Age Group Distribution */}
          <ReportSection icon={BarChart3} title="Age Group Distribution" subtitle="Breakdown by age group and gender">
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsvAge} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 font-semibold">Age Group</th><th className="px-3 py-2 font-semibold">Gender</th><th className="px-3 py-2 font-semibold">Count</th></tr>
                  </thead>
                  <tbody>
                    {ageGroupData.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                        <td className="px-3 py-1.5">{String(r.age_group ?? '')}</td>
                        <td className="px-3 py-1.5">{String(r.gender ?? '')}</td>
                        <td className="px-3 py-1.5 font-medium">{(r.count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ageGroupData}>
                  <XAxis dataKey="age_group" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={C.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportSection>

          {/* 4. Registration Trends */}
          <ReportSection icon={Activity} title="Registration Trends" subtitle="Form registrations over time">
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsvTrends} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 font-semibold">Month</th><th className="px-3 py-2 font-semibold">Registrations</th></tr>
                  </thead>
                  <tbody>
                    {trendsData.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                        <td className="px-3 py-1.5">{String(r.month ?? '')}</td>
                        <td className="px-3 py-1.5 font-medium">{(r.count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendsData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ReportSection>
        </div>
      )}
    </ReportTemplate>
  );
};
