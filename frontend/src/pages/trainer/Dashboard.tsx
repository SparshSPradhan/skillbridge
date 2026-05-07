import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatCard, PageHeader, LoadingSpinner } from '../../components/shared';
import { useAuthStore } from '../../store/auth.store';
import { CalendarDays, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TrainerDashboard() {
  const { user } = useAuthStore();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', 'trainer'],
    queryFn: () => api.get('/sessions').then((r) => r.data),
  });

  const { data: batchesData } = useQuery({
    queryKey: ['batches', 'trainer'],
    queryFn: () => api.get('/batches').then((r) => r.data),
  });

  const sessions = sessionsData?.sessions ?? [];
  const batches = batchesData?.batches ?? [];

  const recentSessions = sessions.slice(0, 5);
  const totalStudents = batches.reduce(
    (sum: number, b: { students: unknown[] }) => sum + (b.students?.length ?? 0),
    0
  );

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}`} description="Your training overview" />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Sessions" value={sessions.length} icon={<CalendarDays size={18} />} color="blue" />
        <StatCard label="Active Batches" value={batches.length} icon={<Users size={18} />} color="purple" />
        <StatCard label="Total Students" value={totalStudents} icon={<CheckCircle size={18} />} color="green" />
      </div>

      <div className="card">
        <h2 className="font-medium text-slate-200 mb-4 text-sm">Recent Sessions</h2>
        {isLoading ? (
          <LoadingSpinner />
        ) : recentSessions.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">No sessions yet. Create one!</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="table-header text-left">Session</th>
                <th className="table-header text-left">Batch</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s: {
                id: string;
                title: string;
                date: string;
                batch: { name: string };
                _count: { attendance: number };
              }) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell text-slate-200 font-medium">{s.title}</td>
                  <td className="table-cell">{s.batch.name}</td>
                  <td className="table-cell">{format(new Date(s.date), 'dd MMM yyyy')}</td>
                  <td className="table-cell text-right">{s._count?.attendance ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}