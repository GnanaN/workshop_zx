import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/Login';
import { VerifyPage } from './pages/Verify';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/Dashboard';
import { CompetitorDetailPage } from './pages/CompetitorDetail';
import { InboxPage } from './pages/Inbox';
import { ReportDetailPage } from './pages/ReportDetail';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/competitors/:id" element={<CompetitorDetailPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/inbox/:reportId" element={<ReportDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
