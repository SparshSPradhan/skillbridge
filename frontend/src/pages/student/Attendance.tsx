import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageHeader, LoadingSpinner, AttendanceBadge, ProgressBar } from '../../components/shared';
import { format } from 'date-fns';

export default function StudentAttendance() {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'my'],
    queryFn: () => api.get('/attendance/my').then((r) => r.data),
  });

  const records = data?.records ?? [];
  const summary = data?.summary ?? { total: 0, present: 0, absent: 0, percentage: 0 };

  return (
    <div>
      <PageHeader title="My Attendance" description="Full attendance history across all batches" />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: summary.total },
          { label: 'Present / Late', value: summary.present },
          { label: 'Absent', value: summary.absent },
          { label: 'Rate', value: `${summary.percentage}%` },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-semibold text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-slate-300">Overall Attendance</span>
          <span className="text-sm font-medium text-slate-200">{summary.percentage}%</span>
        </div>
        <ProgressBar value={summary.percentage} />
        {summary.percentage < 75 && (
          <p className="text-xs text-amber-400 mt-2">⚠ Attendance below 75% threshold</p>
        )}
      </div>

      {/* Records table */}
      <div className="card">
        <h2 className="font-medium text-slate-200 mb-4 text-sm">Session History</h2>
        {isLoading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <p className="text-center text-slate-500 py-8 text-sm">No attendance records yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="table-header text-left">Session</th>
                <th className="table-header text-left">Batch</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Time</th>
                <th className="table-header text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: {
                id: string;
                status: 'PRESENT' | 'ABSENT' | 'LATE';
                markedAt: string;
                session: { title: string; date: string; startTime: string; endTime: string; batch: { name: string } };
              }) => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell text-slate-200 font-medium">{r.session.title}</td>
                  <td className="table-cell">{r.session.batch.name}</td>
                  <td className="table-cell">{format(new Date(r.session.date), 'dd MMM yyyy')}</td>
                  <td className="table-cell">{r.session.startTime}</td>
                  <td className="table-cell">
                    <AttendanceBadge status={r.status} />
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