import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const colorMap = {
  blue: 'text-blue-400 bg-blue-500/10',
  green: 'text-emerald-400 bg-emerald-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  red: 'text-red-400 bg-red-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
};

export function StatCard({ label, value, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-slate-100 mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
        </div>
        {icon && (
          <div className={clsx('p-2 rounded-lg', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
        {description && <p className="text-slate-400 text-sm mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-slate-600 mb-3">{icon}</div>
      <h3 className="text-slate-300 font-medium">{title}</h3>
      {description && <p className="text-slate-500 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center py-12', className)}>
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  );
}

// ─── Attendance Badge ─────────────────────────────────────────────────────────
export function AttendanceBadge({ status }: { status: 'PRESENT' | 'ABSENT' | 'LATE' | null }) {
  if (status === 'PRESENT')
    return <span className="badge-green">Present</span>;
  if (status === 'LATE')
    return <span className="badge-yellow">Late</span>;
  return <span className="badge-red">Absent</span>;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
const roleBadgeClass: Record<string, string> = {
  STUDENT: 'badge-green',
  TRAINER: 'badge-blue',
  INSTITUTION: 'badge-purple',
  PROGRAMME_MANAGER: 'badge-yellow',
  MONITORING_OFFICER: 'badge-red',
};

const roleLabel: Record<string, string> = {
  STUDENT: 'Student',
  TRAINER: 'Trainer',
  INSTITUTION: 'Institution',
  PROGRAMME_MANAGER: 'Programme Manager',
  MONITORING_OFFICER: 'Monitoring Officer',
};

export function RoleBadge({ role }: { role: string }) {
  return <span className={roleBadgeClass[role] || 'badge'}>{roleLabel[role] || role}</span>;
}