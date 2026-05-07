import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageHeader, LoadingSpinner, EmptyState, Modal, ProgressBar } from '../../components/shared';
import { Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';

interface BatchSummary {
  batchId: string;
  batchName: string;
  totalStudents: number;
  totalSessions: number;
  attendanceRate: number;
  trainers: { id: string; name: string }[];
}

export default function InstitutionBatches() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [batchName, setBatchName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['institution-summary', user?.id],
    queryFn: () => api.get(`/institutions/${user!.id}/summary`).then((r) => r.data),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/batches', { name }),
    onSuccess: () => {
      toast.success('Batch created!');
      qc.invalidateQueries({ queryKey: ['institution-summary'] });
      setShowCreate(false);
      setBatchName('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const batches: BatchSummary[] = data?.batchSummaries ?? [];

  return (
    <div>
      <PageHeader
        title="Batches"
        description="All batches under your institution"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New Batch
          </button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No batches yet"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Batch</button>}
        />
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <div key={b.batchId} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-200">{b.batchName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trainers: {b.trainers?.map((t) => t.name).join(', ') || 'None assigned'}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{b.totalStudents} students</p>
                  <p>{b.totalSessions} sessions</p>
                </div>
              </div>
              <ProgressBar value={b.attendanceRate} />
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Batch">
        <div className="space-y-4">
          <div>
            <label className="label">Batch Name</label>
            <input
              className="input"
              placeholder="e.g. Web Development Cohort A"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>
          <button
            onClick={() => createMutation.mutate(batchName)}
            disabled={!batchName || createMutation.isPending}
            className="btn-primary w-full"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Batch'}
          </button>
        </div>
      </Modal>
    </div>
  );
}