import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageHeader, LoadingSpinner, AttendanceBadge, EmptyState, Modal } from '../../components/shared';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function StudentSessions() {
  const qc = useQueryClient();
  const [markingSession, setMarkingSession] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', 'student'],
    queryFn: () => api.get('/sessions').then((r) => r.data),
  });

  const markMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      api.post('/attendance/mark', { sessionId, status }),
    onSuccess: () => {
      toast.success('Attendance marked!');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setMarkingSession(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sessions = data?.sessions ?? [];

  return (
    <div>
      <PageHeader title="My Sessions" description="All sessions in your enrolled batches" />

      {isLoading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={40} />}
          title="No sessions yet"
          description="You'll see sessions here once you join a batch."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session: {
            id: string;
            title: string;
            date: string;
            startTime: string;
            endTime: string;
            batch: { name: string };
            attendance: { status: string }[];
          }) => {
            const sessionDate = parseISO(session.date);
            const isSessionToday = isToday(sessionDate);
            const myAttendance = session.attendance[0];

            return (
              <div key={session.id} className="card flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-200 text-sm">{session.title}</p>
                    {isSessionToday && (
                      <span className="badge-blue text-xs">Today</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {session.batch.name} · {format(sessionDate, 'dd MMM yyyy')} · {session.startTime}–{session.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <AttendanceBadge status={(myAttendance?.status as 'PRESENT' | 'ABSENT' | 'LATE') ?? null} />
                  {isSessionToday && !myAttendance && (
                    <button
                      onClick={() => setMarkingSession({ id: session.id, title: session.title })}
                      className="btn-primary flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Mark
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Attendance Modal */}
      <Modal
        open={!!markingSession}
        onClose={() => setMarkingSession(null)}
        title="Mark Attendance"
      >
        <p className="text-slate-400 text-sm mb-6">
          Session: <span className="text-slate-200 font-medium">{markingSession?.title}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => markMutation.mutate({ sessionId: markingSession!.id, status: 'PRESENT' })}
            disabled={markMutation.isPending}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-emerald-600/30 bg-emerald-600/10 hover:bg-emerald-600/20 transition-colors"
          >
            <CheckCircle className="text-emerald-400" size={24} />
            <span className="text-emerald-400 font-medium text-sm">Present</span>
          </button>
          <button
            onClick={() => markMutation.mutate({ sessionId: markingSession!.id, status: 'LATE' })}
            disabled={markMutation.isPending}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/20 transition-colors"
          >
            <CheckCircle className="text-amber-400" size={24} />
            <span className="text-amber-400 font-medium text-sm">Late</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}