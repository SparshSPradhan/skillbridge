import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
  Building2,
  GraduationCap,
  ClipboardCheck,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore, UserRole } from '../../store/auth.store';
import { clsx } from 'clsx';

const roleConfig: Record<
  UserRole,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    nav: { label: string; to: string; icon: React.ReactNode }[];
  }
> = {
  STUDENT: {
    label: 'Student',
    color: 'text-emerald-400',
    icon: <GraduationCap size={16} />,
    nav: [
      { label: 'Dashboard', to: '/dashboard/student', icon: <LayoutDashboard size={16} /> },
      { label: 'My Sessions', to: '/dashboard/student/sessions', icon: <CalendarDays size={16} /> },
      { label: 'Attendance', to: '/dashboard/student/attendance', icon: <ClipboardCheck size={16} /> },
    ],
  },
  TRAINER: {
    label: 'Trainer',
    color: 'text-blue-400',
    icon: <BookOpen size={16} />,
    nav: [
      { label: 'Dashboard', to: '/dashboard/trainer', icon: <LayoutDashboard size={16} /> },
      { label: 'Sessions', to: '/dashboard/trainer/sessions', icon: <CalendarDays size={16} /> },
      { label: 'Batches', to: '/dashboard/trainer/batches', icon: <Users size={16} /> },
    ],
  },
  INSTITUTION: {
    label: 'Institution',
    color: 'text-purple-400',
    icon: <Building2 size={16} />,
    nav: [
      { label: 'Dashboard', to: '/dashboard/institution', icon: <LayoutDashboard size={16} /> },
      { label: 'Batches', to: '/dashboard/institution/batches', icon: <Users size={16} /> },
      { label: 'Trainers', to: '/dashboard/institution/trainers', icon: <BookOpen size={16} /> },
    ],
  },
  PROGRAMME_MANAGER: {
    label: 'Programme Manager',
    color: 'text-amber-400',
    icon: <BarChart3 size={16} />,
    nav: [
      { label: 'Dashboard', to: '/dashboard/manager', icon: <LayoutDashboard size={16} /> },
    ],
  },
  MONITORING_OFFICER: {
    label: 'Monitoring Officer',
    color: 'text-red-400',
    icon: <Eye size={16} />,
    nav: [
      { label: 'Dashboard', to: '/dashboard/officer', icon: <ShieldCheck size={16} /> },
    ],
  },
};

export default function AppLayout() {
  const { user } = useAuthStore();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  if (!user) return null;

  const config = roleConfig[user.role];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-100 text-sm">SkillBridge</span>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className={clsx('flex items-center gap-1.5 text-xs font-medium', config.color)}>
            {config.icon}
            {config.label}
          </div>
          <p className="text-slate-400 text-xs mt-0.5 truncate">{user.name}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {config.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}