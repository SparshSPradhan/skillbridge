import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatCard, PageHeader, LoadingSpinner, ProgressBar } from '../../components/shared';
import { useAuthStore } from '../../store/auth.store';
import { Users, BookOpen, BarChart3 } from 'lucide-react';

export default function InstitutionDashboard() {
  const { user } = useAuthStore();

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['institution-summary', user?.id],
    queryFn: () => api.get(`/institutions/${user!.id}/summary`).then((r) => r.data),
    enabled: !!user,
  });

  const { data: trainersData } = useQuery({
    queryKey: ['users', 'institution'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const summary = summaryData;
  const trainers = (trainersData?.users ?? []).filter((u: { role: string }) => u.role === 'TRAINER');

  return (
    <div>
      <PageHeader title={user?.name ?? 'Institution'} description="Attendance overview for your institution" />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Total Batches"
              value={summary?.totalBatches ?? 0}
              icon={<Users size={18} />}
              color="blue"
            />
            <StatCard
              label="Trainers"
              value={trainers.length}
              icon={<BookOpen size={18} />}
              color="purple"
            />
            <StatCard
              label="Avg Attendance"
              value={`${summary?.batchSummaries?.length > 0
                ? Math.round(summary.batchSummaries.reduce((s: number, b: { attendanceRate: number }) => s + b.attendanceRate, 0) / summary.batchSummaries.length)
                : 0}%`}
              icon={<BarChart3 size={18} />}
              color="green"
            />
          </div>

          <div className="card">
            <h2 className="font-medium text-slate-200 mb-4 text-sm">Batch Attendance Summary</h2>
            {(summary?.batchSummaries ?? []).length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No batches yet</p>
            ) : (
              <div className="space-y-4">
                {(summary?.batchSummaries ?? []).map((b: {
                  batchId: string;
                  batchName: string;
                  totalStudents: number;
                  totalSessions: number;
                  attendanceRate: number;
                }) => (
                  <div key={b.batchId}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-200 font-medium">{b.batchName}</span>
                      <span className="text-slate-500 text-xs">
                        {b.totalStudents} students · {b.totalSessions} sessions
                      </span>
                    </div>
                    <ProgressBar value={b.attendanceRate} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}