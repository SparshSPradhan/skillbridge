import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageHeader, LoadingSpinner, EmptyState, Modal } from '../../components/shared';
import { Users, Link, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Batch {
  id: string;
  name: string;
  students?: unknown[];
  sessions?: unknown[];
}

export default function TrainerBatches() {
  const qc = useQueryClient();
  const [inviteModal, setInviteModal] = useState<{ batchId: string; batchName: string } | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['batches', 'trainer'],
    queryFn: () => api.get('/batches').then((r) => r.data),
  });

  const generateInvite = useMutation({
    mutationFn: (batchId: string) => api.post(`/batches/${batchId}/invite`),
    onSuccess: (res) => {
      setInviteUrl(res.data.inviteUrl);
      qc.invalidateQueries({
        queryKey: ['batches', 'trainer'],
      });
      toast.success('Invite link generated!');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const batches: Batch[] = data?.batches ?? [];

  return (
    <div>
      <PageHeader title="My Batches" description="Batches you train and manage" />

      {isLoading ? (
        <LoadingSpinner />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No batches yet"
          description="You'll appear here once assigned to a batch by your institution."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {batches.map((batch) => (
            <div key={batch.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-200">{batch.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {batch.students?.length ?? 0} students · {batch.sessions?.length ?? 0} sessions
                  </p>
                </div>
                <Users size={18} className="text-slate-600" />
              </div>
              <button
                onClick={() => {
                  setInviteModal({ batchId: batch.id, batchName: batch.name });
                  setInviteUrl('');
                  generateInvite.mutate(batch.id);
                }}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
              >
                <Link size={13} /> Generate Invite Link
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      <Modal
        open={!!inviteModal}
        onClose={() => { setInviteModal(null); setInviteUrl(''); }}
        title={`Invite Link – ${inviteModal?.batchName}`}
      >
        <p className="text-slate-400 text-sm mb-4">
          Share this link with students to let them join the batch automatically.
        </p>
        {generateInvite.isPending ? (
          <LoadingSpinner />
        ) : inviteUrl ? (
          <>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 break-all font-mono mb-3">
              {inviteUrl}
            </div>
            <button
              onClick={handleCopy}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
            </button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Valid for 7 days · Up to 200 uses
            </p>
          </>
        ) : null}
      </Modal>
    </div>
  );
}