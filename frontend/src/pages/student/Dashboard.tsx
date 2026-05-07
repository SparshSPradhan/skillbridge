import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { StatCard, LoadingSpinner, PageHeader, AttendanceBadge } from '../../components/shared';
import { CalendarDays, ClipboardCheck, BookOpen, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', 'student'],
    queryFn: () => api.get('/sessions').then((r) => r.data),
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', 'my'],
    queryFn: () => api.get('/attendance/my').then((r) => r.data),
  });

  const sessions = sessionsData?.sessions ?? [];
  const summary = attendanceData?.summary ?? { total: 0, present: 0, absent: 0, percentage: 0 };

  // Upcoming/today sessions
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s: { date: string }) => new Date(s.date).toDateString() === today
  );

  return (
    <div>
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0]} 👋`}
        description="Here's your attendance overview"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Sessions"
          value={summary.total}
          icon={<CalendarDays size={18} />}
          color="blue"
        />
        <StatCard
          label="Attended"
          value={summary.present}
          icon={<ClipboardCheck size={18} />}
          color="green"
        />
        <StatCard
          label="Absent"
          value={summary.absent}
          icon={<BookOpen size={18} />}
          color="red"
        />
        <StatCard
          label="Attendance Rate"
          value={`${summary.percentage}%`}
          icon={<TrendingUp size={18} />}
          color={summary.percentage >= 75 ? 'green' : 'amber'}
        />
      </div>

      {/* Today's sessions */}
      <div className="card mb-6">
        <h2 className="font-medium text-slate-200 mb-4 text-sm">Today's Sessions</h2>
        {loadingSessions ? (
          <LoadingSpinner />
        ) : todaySessions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No sessions today</p>
        ) : (
          <div className="space-y-3">
            {todaySessions.map((session: {
              id: string;
              title: string;
              startTime: string;
              endTime: string;
              batch: { name: string };
              attendance: { status: string }[];
            }) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-200">{session.title}</p>
                  <p className="text-xs text-slate-500">
                    {session.batch.name} · {session.startTime} – {session.endTime}
                  </p>
                </div>
                <AttendanceBadge
                  status={(session.attendance[0]?.status as 'PRESENT' | 'ABSENT' | 'LATE') ?? null}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="card">
        <h2 className="font-medium text-slate-200 mb-4 text-sm">Recent Sessions</h2>
        {loadingAttendance ? (
          <LoadingSpinner />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="table-header text-left">Session</th>
                <th className="table-header text-left">Batch</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(attendanceData?.records ?? []).slice(0, 8).map((record: {
                id: string;
                status: 'PRESENT' | 'ABSENT' | 'LATE';
                session: { title: string; date: string; batch: { name: string } };
              }) => (
                <tr key={record.id} className="table-row">
                  <td className="table-cell font-medium text-slate-200">{record.session.title}</td>
                  <td className="table-cell">{record.session.batch.name}</td>
                  <td className="table-cell">{format(new Date(record.session.date), 'dd MMM yyyy')}</td>
                  <td className="table-cell">
                    <AttendanceBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}