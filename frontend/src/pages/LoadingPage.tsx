import { BookOpen, Loader2 } from 'lucide-react';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
        <BookOpen size={20} className="text-white" />
      </div>
      <Loader2 className="animate-spin text-blue-500" size={24} />
      <p className="text-slate-500 text-sm">Loading SkillBridge…</p>
    </div>
  );
}