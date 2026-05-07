import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setTokenGetter } from './lib/api';
import { useAuthStore } from './store/auth.store';
import { api } from './lib/api';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoadingPage from './pages/LoadingPage';
import JoinBatchPage from './pages/JoinBatchPage';

// Role dashboards
import StudentDashboard from './pages/student/Dashboard';
import StudentSessions from './pages/student/Sessions';
import StudentAttendance from './pages/student/Attendance';

import TrainerDashboard from './pages/trainer/Dashboard';
import TrainerSessions from './pages/trainer/Sessions';
import TrainerBatches from './pages/trainer/Batches';

import InstitutionDashboard from './pages/institution/Dashboard';
import InstitutionBatches from './pages/institution/Batches';
import InstitutionTrainers from './pages/institution/Trainers';

import ManagerDashboard from './pages/manager/Dashboard';
import OfficerDashboard from './pages/officer/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user: appUser, isLoading } = useAuthStore();

  if (!isLoaded || isLoading) return <LoadingPage />;
  if (!isSignedIn) return <Navigate to="/" replace />;
  if (!appUser) return <Navigate to="/register" replace />;

  return <>{children}</>;
}

function RoleRoute({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function DashboardRedirect() {
  const { user } = useAuthStore();
  if (!user) return <LoadingPage />;

  const roleRoutes: Record<string, string> = {
    STUDENT: '/dashboard/student',
    TRAINER: '/dashboard/trainer',
    INSTITUTION: '/dashboard/institution',
    PROGRAMME_MANAGER: '/dashboard/manager',
    MONITORING_OFFICER: '/dashboard/officer',
  };

  return <Navigate to={roleRoutes[user.role] || '/'} replace />;
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Fetch user profile from our backend
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        // User exists in Clerk but not in our DB → redirect to register
        setUser(null);
        setLoading(false);
      });
  }, [isLoaded, isSignedIn, clerkUser, setUser, setLoading]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/join/:token" element={<JoinBatchPage />} />

          {/* Dashboard redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Protected routes inside shared layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Student */}
            <Route
              path="student"
              element={
                <RoleRoute roles={['STUDENT']}>
                  <StudentDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="student/sessions"
              element={
                <RoleRoute roles={['STUDENT']}>
                  <StudentSessions />
                </RoleRoute>
              }
            />
            <Route
              path="student/attendance"
              element={
                <RoleRoute roles={['STUDENT']}>
                  <StudentAttendance />
                </RoleRoute>
              }
            />

            {/* Trainer */}
            <Route
              path="trainer"
              element={
                <RoleRoute roles={['TRAINER']}>
                  <TrainerDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="trainer/sessions"
              element={
                <RoleRoute roles={['TRAINER']}>
                  <TrainerSessions />
                </RoleRoute>
              }
            />
            <Route
              path="trainer/batches"
              element={
                <RoleRoute roles={['TRAINER']}>
                  <TrainerBatches />
                </RoleRoute>
              }
            />

            {/* Institution */}
            <Route
              path="institution"
              element={
                <RoleRoute roles={['INSTITUTION']}>
                  <InstitutionDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="institution/batches"
              element={
                <RoleRoute roles={['INSTITUTION']}>
                  <InstitutionBatches />
                </RoleRoute>
              }
            />
            <Route
              path="institution/trainers"
              element={
                <RoleRoute roles={['INSTITUTION']}>
                  <InstitutionTrainers />
                </RoleRoute>
              }
            />

            {/* Programme Manager */}
            <Route
              path="manager"
              element={
                <RoleRoute roles={['PROGRAMME_MANAGER']}>
                  <ManagerDashboard />
                </RoleRoute>
              }
            />

            {/* Monitoring Officer */}
            <Route
              path="officer"
              element={
                <RoleRoute roles={['MONITORING_OFFICER']}>
                  <OfficerDashboard />
                </RoleRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  );
}