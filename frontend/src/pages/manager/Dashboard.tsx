import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatCard, PageHeader, LoadingSpinner, ProgressBar } from '../../components/shared';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, Users, CalendarDays, TrendingUp } from 'lucide-react';

export default function ManagerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['programme-summary'],
    queryFn: () => api.get('/programme/summary').then((r) => r.data),
  });

  const summary = data;
  const institutions = summary?.institutions ?? [];

  const chartData = institutions.map((i: { institutionName: string; attendanceRate: number }) => ({
    name: i.institutionName.length > 15 ? i.institutionName.slice(0, 15) + '…' : i.institutionName,
    rate: i.attendanceRate,
  }));

  return (
    <div>
      <PageHeader
        title="Programme Overview"
        description="Attendance data across all institutions and batches"
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Institutions" value={summary?.totalInstitutions ?? 0} icon={<Building2 size={18} />} color="blue" />
            <StatCard label="Total Students" value={summary?.totalStudents ?? 0} icon={<Users size={18} />} color="purple" />
            <StatCard label="Total Sessions" value={summary?.totalSessions ?? 0} icon={<CalendarDays size={18} />} color="amber" />
            <StatCard label="Avg Attendance" value={`${summary?.avgAttendanceRate ?? 0}%`} icon={<TrendingUp size={18} />} color="green" />
          </div>

          {chartData.length > 0 && (
            <div className="card mb-6">
              <h2 className="font-medium text-slate-200 mb-4 text-sm">Attendance Rate by Institution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }}
                    itemStyle={{ color: '#60a5fa' }}
                    formatter={(v: number) => [`${v}%`, 'Attendance']}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: { rate: number }, i: number) => (
                      <Cell
                        key={i}
                        fill={entry.rate >= 75 ? '#10b981' : entry.rate >= 50 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <h2 className="font-medium text-slate-200 mb-4 text-sm">Institution Breakdown</h2>
            {institutions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No institutions registered yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="table-header text-left">Institution</th>
                    <th className="table-header text-right">Batches</th>
                    <th className="table-header text-right">Sessions</th>
                    <th className="table-header text-right">Students</th>
                    <th className="table-header text-left w-40">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst: {
                    institutionId: string;
                    institutionName: string;
                    totalBatches: number;
                    totalSessions: number;
                    totalStudents: number;
                    attendanceRate: number;
                  }) => (
                    <tr key={inst.institutionId} className="table-row">
                      <td className="table-cell text-slate-200 font-medium">{inst.institutionName}</td>
                      <td className="table-cell text-right">{inst.totalBatches}</td>
                      <td className="table-cell text-right">{inst.totalSessions}</td>
                      <td className="table-cell text-right">{inst.totalStudents}</td>
                      <td className="table-cell w-40">
                        <ProgressBar value={inst.attendanceRate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}