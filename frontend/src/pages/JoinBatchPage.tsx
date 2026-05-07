import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JoinBatchPage() {
  const { token } = useParams<{ token: string }>();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return; // show sign-in prompt
    if (!user) return; // not registered
    if (user.role !== 'STUDENT') {
      setStatus('error');
      setMessage('Only students can join a batch via invite link.');
      return;
    }

    // Auto-join
    setStatus('joining');
    api
      .post(`/batches/undefined/join`, { token })
      .then(() => {
        setStatus('success');
        setMessage(`You've joined the batch successfully!`);
        toast.success('Joined batch!');
        setTimeout(() => navigate('/dashboard/student'), 2000);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message || 'Failed to join batch');
      });
  }, [isLoaded, isSignedIn, user, token, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full text-center">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-semibold mb-2">Batch Invite</h1>

        {!isLoaded || status === 'joining' ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="animate-spin text-blue-500" size={28} />
            <p className="text-slate-400 text-sm">Processing invite…</p>
          </div>
        ) : !isSignedIn ? (
          <div>
            <p className="text-slate-400 text-sm mb-4">Sign in to join this batch.</p>
            <Link to="/" className="btn-primary inline-block">
              Go to Sign In
            </Link>
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="text-emerald-400" size={36} />
            <p className="text-emerald-400 font-medium">{message}</p>
            <p className="text-slate-500 text-xs">Redirecting to dashboard…</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="text-red-400" size={36} />
            <p className="text-red-400 font-medium text-sm">{message}</p>
            <Link to="/dashboard" className="btn-secondary mt-2 inline-block text-xs">
              Back to Dashboard
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}