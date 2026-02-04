import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import MainLayout from './components/MainLayout';
import { NotificationProvider } from './contexts/NotificationContext';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForcePasswordResetPage = lazy(() => import('./pages/ForcePasswordResetPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const MemoryVaultPage = lazy(() => import('./pages/MemoryVaultPage'));
const PersonalSpacePage = lazy(() => import('./pages/PersonalSpacePage'));
const ConfessionsPage = lazy(() => import('./pages/ConfessionsPage'));
const TimeCapsulesPage = lazy(() => import('./pages/TimeCapsulesPage'));
const TeacherLettersPage = lazy(() => import('./pages/TeacherLettersPage'));
const ClassInsightsPage = lazy(() => import('./pages/ClassInsightsPage'));
const AlumniUpdatesPage = lazy(() => import('./pages/AlumniUpdatesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage message="Initializing ClassroomX..." />;
  }

  return (
    <NotificationProvider>
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route path="/force-reset-password" element={<ForcePasswordResetPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="create-post" element={<CreatePostPage />} />
            <Route path="post/:id" element={<PostDetailPage />} />
            <Route path="memory-vault" element={<MemoryVaultPage />} />
            <Route path="personal-space" element={<PersonalSpacePage />} />
            <Route path="confessions" element={<ConfessionsPage />} />
            <Route path="time-capsules" element={<TimeCapsulesPage />} />
            <Route path="teacher-letters" element={<TeacherLettersPage />} />
            <Route path="class-insights" element={<ClassInsightsPage />} />
            <Route path="alumni-updates" element={<AlumniUpdatesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<ProfileSettingsPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="directory" element={<DirectoryPage />} />
            <Route path="profile/:id" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </NotificationProvider>
  );
};

export default App;
