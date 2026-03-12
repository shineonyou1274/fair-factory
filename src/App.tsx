import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

// Pages - Lazy loaded
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const TeacherLoginPage = lazy(() => import('@/pages/auth/TeacherLoginPage'));
const StudentJoinPage = lazy(() => import('@/pages/auth/StudentJoinPage'));
const TeacherDashboard = lazy(() => import('@/pages/teacher/TeacherDashboard'));
const SessionCreate = lazy(() => import('@/pages/teacher/SessionCreate'));
const SessionControl = lazy(() => import('@/pages/teacher/SessionControl'));
const StudentOnboarding = lazy(() => import('@/pages/student/StudentOnboarding'));
const GameRoom = lazy(() => import('@/pages/game/GameRoom'));
const GameResults = lazy(() => import('@/pages/game/GameResults'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-radial bg-stars flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-gold)] animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[var(--color-emerald)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-[var(--text-secondary)] text-sm animate-pulse">게임을 불러오는 중...</p>
      </div>
    </div>
  );
}

// Protected Route
function ProtectedTeacher({ children }: { children: React.ReactNode }) {
  const { isTeacher } = useAuthStore();
  return isTeacher ? <>{children}</> : <Navigate to="/teacher/login" replace />;
}

function ProtectedStudent({ children }: { children: React.ReactNode }) {
  const { studentProfile } = useAuthStore();
  return studentProfile ? <>{children}</> : <Navigate to="/join" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/join" element={<StudentJoinPage />} />
        <Route path="/onboarding" element={<StudentOnboarding />} />

        {/* Teacher Protected */}
        <Route path="/teacher/dashboard" element={
          <ProtectedTeacher><TeacherDashboard /></ProtectedTeacher>
        } />
        <Route path="/teacher/session/new" element={
          <ProtectedTeacher><SessionCreate /></ProtectedTeacher>
        } />
        <Route path="/teacher/session/:sessionId" element={
          <ProtectedTeacher><SessionControl /></ProtectedTeacher>
        } />

        {/* Student Protected */}
        <Route path="/game/:sessionId" element={
          <ProtectedStudent><GameRoom /></ProtectedStudent>
        } />
        <Route path="/game/:sessionId/results" element={
          <ProtectedStudent><GameResults /></ProtectedStudent>
        } />

        {/* Admin */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
