import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatCard, PageHeader, LoadingSpinner, ProgressBar } from '../../components/shared';
import { Building2, Users, CalendarDays, TrendingUp, Eye, Lock } from 'lucide-react';
import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';

export default function OfficerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['programme-summary'],
    queryFn: () => api.get('/programme/summary').then((r) => r.data),
  });

  const summary = data;
  const institutions = summary?.institutions ?? [];

  const radialData = [
    {
      name: 'Attendance Rate',
      value: summary?.avgAttendanceRate ?? 0,
      fill: (summary?.avgAttendanceRate ?? 0) >= 75 ? '#10b981' : '#f59e0b',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <PageHeader title="Programme Monitor" description="Read-only overview of the entire SkillBridge programme" />
      </div>

      {/* Read-only banner */}
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 mb-6 text-amber-400 text-xs">
        <Lock size={13} />
        <span>You have read-only access. No actions can be performed from this dashboard.</span>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Institutions" value={summary?.totalInstitutions ?? 0} icon={<Building2 size={18} />} color="blue" />
            <StatCard label="Students" value={summary?.totalStudents ?? 0} icon={<Users size={18} />} color="purple" />
            <StatCard label="Sessions" value={summary?.totalSessions ?? 0} icon={<CalendarDays size={18} />} color="amber" />
            <StatCard label="Avg Attendance" value={`${summary?.avgAttendanceRate ?? 0}%`} icon={<TrendingUp size={18} />} color="green" />
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Radial chart */}
            <div className="card flex flex-col items-center justify-center">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Programme Avg</p>
              <ResponsiveContainer width="100%" height={140}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(v: number) => [`${v}%`, 'Attendance']}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-2xl font-semibold text-slate-100 -mt-4">
                {summary?.avgAttendanceRate ?? 0}%
              </p>
            </div>

            {/* Quick stats */}
            <div className="col-span-2 card">
              <h3 className="text-sm font-medium text-slate-200 mb-4">Institution Performance</h3>
              <div className="space-y-3">
                {institutions.slice(0, 5).map((inst: {
                  institutionId: string;
                  institutionName: string;
                  attendanceRate: number;
                  totalStudents: number;
                }) => (
                  <div key={inst.institutionId}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300">{inst.institutionName}</span>
                      <span className="text-slate-500">{inst.totalStudents} students</span>
                    </div>
                    <ProgressBar value={inst.attendanceRate} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full table */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={15} className="text-slate-500" />
              <h2 className="font-medium text-slate-200 text-sm">All Institutions – Detailed View</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="table-header text-left">Institution</th>
                  <th className="table-header text-right">Batches</th>
                  <th className="table-header text-right">Sessions</th>
                  <th className="table-header text-right">Students</th>
                  <th className="table-header text-left w-40">Attendance Rate</th>
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
                    <td className="table-cell w-40"><ProgressBar value={inst.attendanceRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}