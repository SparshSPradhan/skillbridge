import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageHeader, LoadingSpinner, EmptyState, RoleBadge } from '../../components/shared';
import { BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function InstitutionTrainers() {
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'institution'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const trainers = (data?.users ?? []).filter((u: { role: string }) => u.role === 'TRAINER');

  return (
    <div>
      <PageHeader title="Trainers" description="All trainers under your institution" />

      {isLoading ? (
        <LoadingSpinner />
      ) : trainers.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No trainers yet"
          description="Trainers will appear here once they join your institution."
        />
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="table-header text-left">Name</th>
                <th className="table-header text-left">Email</th>
                <th className="table-header text-left">Role</th>
                <th className="table-header text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t: { id: string; name: string; email: string; role: string; createdAt: string }) => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell text-slate-200 font-medium">{t.name}</td>
                  <td className="table-cell">{t.email}</td>
                  <td className="table-cell"><RoleBadge role={t.role} /></td>
                  <td className="table-cell">{format(new Date(t.createdAt), 'dd MMM yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}