import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  PageHeader, LoadingSpinner, EmptyState, Modal, AttendanceBadge
} from '../../components/shared';
import { CalendarDays, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  batch: { name: string };
  _count?: { attendance: number };
}

interface Batch { id: string; name: string }

export default function TrainerSessions() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewAttendance, setViewAttendance] = useState<Session | null>(null);
  const [form, setForm] = useState({ batchId: '', title: '', date: '', startTime: '', endTime: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', 'trainer'],
    queryFn: () => api.get('/sessions').then((r) => r.data),
  });

  const { data: batchData } = useQuery({
    queryKey: ['batches', 'trainer'],
    queryFn: () => api.get('/batches').then((r) => r.data),
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['session-attendance', viewAttendance?.id],
    queryFn: () => api.get(`/sessions/${viewAttendance!.id}/attendance`).then((r) => r.data),
    enabled: !!viewAttendance,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/sessions', data),
    onSuccess: () => {
      toast.success('Session created!');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setShowCreate(false);
      setForm({ batchId: '', title: '', date: '', startTime: '', endTime: '' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sessions: Session[] = data?.sessions ?? [];
  const batches: Batch[] = batchData?.batches ?? [];

  return (
    <div>
      <PageHeader
        title="Sessions"
        description="Create and manage your training sessions"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New Session
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={40} />}
          title="No sessions yet"
          description="Create your first session to get started"
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Session
            </button>
          }
        />
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="table-header text-left">Title</th>
                <th className="table-header text-left">Batch</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Time</th>
                <th className="table-header text-right">Marked</th>
                <th className="table-header" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell text-slate-200 font-medium">{s.title}</td>
                  <td className="table-cell">{s.batch.name}</td>
                  <td className="table-cell">{format(new Date(s.date), 'dd MMM yyyy')}</td>
                  <td className="table-cell">{s.startTime}–{s.endTime}</td>
                  <td className="table-cell text-right">{s._count?.attendance ?? 0}</td>
                  <td className="table-cell text-right">
                    <button
                      onClick={() => setViewAttendance(s)}
                      className="text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Session Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Session">
        <div className="space-y-4">
          <div>
            <label className="label">Batch</label>
            <select
              className="input"
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
            >
              <option value="">Select batch…</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. Introduction to React" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending || !form.batchId || !form.title || !form.date}
            className="btn-primary w-full"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Session'}
          </button>
        </div>
      </Modal>

      {/* Attendance View Modal */}
      <Modal
        open={!!viewAttendance}
        onClose={() => setViewAttendance(null)}
        title={`Attendance – ${viewAttendance?.title}`}
      >
        {loadingAttendance ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {['present', 'late', 'absent'].map((k) => (
                <div key={k} className="bg-slate-800 rounded-lg p-2">
                  <p className="text-lg font-semibold">{attendanceData?.summary?.[k] ?? 0}</p>
                  <p className="text-xs text-slate-500 capitalize">{k}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(attendanceData?.attendance ?? []).map((a: { student: { id: string; name: string }; status: 'PRESENT' | 'ABSENT' | 'LATE' }) => (
                <div key={a.student.id} className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-200">{a.student.name}</span>
                  <AttendanceBadge status={a.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}