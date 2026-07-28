/**
 * CensusReports.tsx — Pre-built Census report templates with export.
 *
 * Reports:
 *   1. Census Summary — key metrics and demographic overview
 *   2. Khidmat Analysis — service roles distribution
 *   3. Education Status — education breakdown
 *   4. Volunteer Interests — interest areas and languages
 */

import { useSql } from '@sqlrooms/duckdb';
import { Card, CardContent } from '@sqlrooms/ui';
import { useState, useCallback, type FC } from 'react';
import { useRoomStore } from '../store';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  Heart, BookOpen, Globe, Award, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ReportTemplate } from './ReportTemplate';
import { downloadCsv } from '../utils/exportCsv';

/* ── Helpers ───────────────────────────────────────────────── */

function fromArrow(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  try {
    return (data as { toArray: () => Record<string, unknown>[] }).toArray().map((r) => ({ ...r }));
  } catch { return []; }
}

const C = {
  primary: '#00843d',
  accent: '#e6b400',
  teal: '#0d9488',
  navy: '#030620',
  purple: '#7c3aed',
  rose: '#e11d48',
} as const;

const COLORS = [C.primary, C.accent, C.teal, C.navy, C.purple, C.rose];

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

/* ── CensusReports ─────────────────────────────────────────── */

export const CensusReports: FC = () => {
  const ready = useRoomStore((s) => Boolean(s.db.findTableByName?.('census')));

  const countQ = useSql<{ total: number }>({
    query: `SELECT COUNT(*)::int AS total FROM census`,
    enabled: ready,
  });

  const khidmatJamaatQ = useSql<{ value: string; count: number }>({
    query: `SELECT CAST(khidmat_jamaat AS VARCHAR) AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
    enabled: ready,
  });

  const khidmatAuxQ = useSql<{ value: string; count: number }>({
    query: `SELECT CAST(khidmat_auxiliary AS VARCHAR) AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
    enabled: ready,
  });

  const eduQ = useSql<{ status: string; count: number }>({
    query: `SELECT education_status AS status, COUNT(*)::int AS count FROM census WHERE education_status IS NOT NULL GROUP BY status ORDER BY count DESC`,
    enabled: ready,
  });

  const interestQ = useSql<{ area: string; count: number }>({
    query: `SELECT interest_area AS area, COUNT(*)::int AS count FROM census WHERE interest_area IS NOT NULL GROUP BY area ORDER BY count DESC`,
    enabled: ready,
  });

  const langQ = useSql<{ lang: string; count: number }>({
    query: `SELECT languages AS lang, COUNT(*)::int AS count FROM census WHERE languages IS NOT NULL GROUP BY lang ORDER BY count DESC`,
    enabled: ready,
  });

  const volunteerQ = useSql<{ value: string; count: number }>({
    query: `SELECT CAST(wish_volunteer AS VARCHAR) AS value, COUNT(*)::int AS count FROM census GROUP BY value ORDER BY value`,
    enabled: ready,
  });

  const total = fromArrow(countQ.data)[0]?.total ?? 0;
  const khidmatJamaatData = fromArrow(khidmatJamaatQ.data);
  const khidmatAuxData = fromArrow(khidmatAuxQ.data);
  const eduData = fromArrow(eduQ.data);
  const interestData = fromArrow(interestQ.data);
  const langData = fromArrow(langQ.data);
  const volunteerData = fromArrow(volunteerQ.data);

  /* ── Pie config helper ────────────────────────────────────── */
  const pieConfig = (data: Record<string, unknown>[], valueKey: string) =>
    data.filter((r) => r[valueKey] != null).map((r, i) => ({
      name: String(r[valueKey] ?? 'Unknown'),
      value: Number(r.count ?? 0),
      fill: COLORS[i % COLORS.length],
    }));

  const handleCsv = useCallback((data: Record<string, unknown>[], name: string) =>
    () => downloadCsv(data, name), []);

  const loading = !ready;

  return (
    <ReportTemplate
      title="Census Reports"
      subtitle="Pre-built census survey reports with export options"
      hideToolbar
    >
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-brand">{total.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Census Responses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{eduData.length}</p>
                <p className="text-xs text-slate-500">Education Levels</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-teal-500">{interestData.length}</p>
                <p className="text-xs text-slate-500">Interest Areas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-500">{langData.length}</p>
                <p className="text-xs text-slate-500">Languages</p>
              </CardContent>
            </Card>
          </div>

          {/* 1. Khidmat Analysis */}
          <ReportSection icon={Heart} title="Khidmat Analysis" subtitle="Service roles in Jama'at and Auxiliary">
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsv(khidmatJamaatData, 'khidmat-jamaat')} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Khidmat in Jama'at</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieConfig(khidmatJamaatData, 'value')} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieConfig(khidmatJamaatData, 'value').map((e, i) => (<Cell key={i} fill={e.fill} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Khidmat in Auxiliary</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieConfig(khidmatAuxData, 'value')} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieConfig(khidmatAuxData, 'value').map((e, i) => (<Cell key={i} fill={e.fill} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ReportSection>

          {/* 2. Education Status */}
          <ReportSection icon={BookOpen} title="Education Status" subtitle="Distribution of education levels">
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsv(eduData, 'education-status')} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 font-semibold">Status</th><th className="px-3 py-2 font-semibold">Count</th></tr>
                  </thead>
                  <tbody>
                    {eduData.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                        <td className="px-3 py-1.5">{String(r.status ?? '')}</td>
                        <td className="px-3 py-1.5 font-medium">{(r.count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={eduData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={C.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportSection>

          {/* 3. Volunteer Interests */}
          <ReportSection icon={Award} title="Volunteer Interests" subtitle="Interest areas and languages">
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsv(interestData, 'interest-areas')} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 font-semibold">Interest Area</th><th className="px-3 py-2 font-semibold">Count</th></tr>
                  </thead>
                  <tbody>
                    {interestData.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                        <td className="px-3 py-1.5">{String(r.area ?? '')}</td>
                        <td className="px-3 py-1.5 font-medium">{(r.count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={interestData.slice(0, 15)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="area" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={C.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportSection>

          {/* 4. Languages */}
          <ReportSection icon={Globe} title="Languages" subtitle="Languages spoken by members">
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={handleCsv(langData, 'languages')} className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="max-h-60 overflow-y-auto rounded border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 font-semibold">Language</th><th className="px-3 py-2 font-semibold">Count</th></tr>
                  </thead>
                  <tbody>
                    {langData.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                        <td className="px-3 py-1.5">{String(r.lang ?? '')}</td>
                        <td className="px-3 py-1.5 font-medium">{(r.count as number).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Willing to Volunteer</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieConfig(volunteerData, 'value')} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieConfig(volunteerData, 'value').map((e, i) => (<Cell key={i} fill={e.fill} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ReportSection>
        </div>
      )}
    </ReportTemplate>
  );
};
