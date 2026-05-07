import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuthStore, UserRole } from '../../store/auth.store';
import { BookOpen, Loader2 } from 'lucide-react';

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'STUDENT', label: 'Student', description: 'Join batches and mark attendance' },
  { value: 'TRAINER', label: 'Trainer', description: 'Create sessions and manage batches' },
  { value: 'INSTITUTION', label: 'Institution', description: 'Oversee trainers and batches' },
  { value: 'PROGRAMME_MANAGER', label: 'Programme Manager', description: 'Regional oversight of all institutions' },
  { value: 'MONITORING_OFFICER', label: 'Monitoring Officer', description: 'Read-only programme-wide access' },
];

export default function RegisterPage() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!selectedRole || !clerkUser) return;
    setIsLoading(true);

    try {
      const token = await getToken();
      const res = await api.post(
        '/auth/register',
        {
          clerkUserId: clerkUser.id,
          name: clerkUser.fullName || clerkUser.username || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: selectedRole,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      toast.success(`Welcome to SkillBridge!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-semibold text-slate-100">SkillBridge</span>
        </div>

        <div className="card">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">Complete your profile</h1>
          <p className="text-slate-400 text-sm mb-6">
            Welcome, {clerkUser?.firstName}! Choose your role to get started.
          </p>

          <div className="space-y-2 mb-6">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedRole === role.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-700 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium text-sm">{role.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{role.description}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleRegister}
            disabled={!selectedRole || isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Setting up…
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}