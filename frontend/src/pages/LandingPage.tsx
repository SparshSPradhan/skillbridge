import { Link } from 'react-router-dom';
import { SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react';
import { BookOpen, Users, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-900 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm">SkillBridge</span>
        </div>
        <div className="flex items-center gap-3">
          {isSignedIn && user ? (
            <Link to="/dashboard" className="btn-primary flex items-center gap-1.5">
              Go to Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="btn-secondary">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary">Get Started</button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-blue-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          SkillBridge Attendance System
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-100 mb-4 leading-tight">
          Track attendance across<br />
          <span className="text-blue-400">every skilling programme</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
          A unified platform for students, trainers, institutions and programme managers to manage
          sessions and attendance in real time.
        </p>
        <div className="flex items-center justify-center gap-4">
          {isSignedIn && user ? (
            <Link to="/dashboard" className="btn-primary text-base px-6 py-2.5 flex items-center gap-2">
              Open Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <SignUpButton mode="modal">
              <button className="btn-primary text-base px-6 py-2.5 flex items-center gap-2">
                Get Started Free <ArrowRight size={16} />
              </button>
            </SignUpButton>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <BookOpen size={20} />,
            title: 'Session Management',
            desc: 'Trainers create sessions with full scheduling. Students mark attendance instantly.',
            color: 'text-blue-400 bg-blue-500/10',
          },
          {
            icon: <Users size={20} />,
            title: 'Batch Invites',
            desc: 'Generate invite links. Students join batches with a single click.',
            color: 'text-emerald-400 bg-emerald-500/10',
          },
          {
            icon: <BarChart3 size={20} />,
            title: 'Live Analytics',
            desc: 'Institutions and managers get real-time attendance summaries.',
            color: 'text-purple-400 bg-purple-500/10',
          },
          {
            icon: <Shield size={20} />,
            title: 'Role-Based Access',
            desc: '5 distinct roles, each with precisely scoped permissions.',
            color: 'text-amber-400 bg-amber-500/10',
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${f.color}`}>
              {f.icon}
            </div>
            <h3 className="font-medium text-slate-200 text-sm mb-1">{f.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Roles */}
      <section className="border-t border-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl font-semibold text-center mb-8">Five roles, one system</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { role: 'Student', desc: 'Mark attendance', color: 'border-emerald-600/30 bg-emerald-600/5' },
              { role: 'Trainer', desc: 'Create sessions', color: 'border-blue-600/30 bg-blue-600/5' },
              { role: 'Institution', desc: 'Manage batches', color: 'border-purple-600/30 bg-purple-600/5' },
              { role: 'Programme Manager', desc: 'Cross-institution view', color: 'border-amber-600/30 bg-amber-600/5' },
              { role: 'Monitoring Officer', desc: 'Read-only oversight', color: 'border-red-600/30 bg-red-600/5' },
            ].map((r) => (
              <div key={r.role} className={`border rounded-xl p-4 text-center ${r.color}`}>
                <CheckCircle size={16} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-200">{r.role}</p>
                <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}