import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './utils/AuthContext';

import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import FanLayout from './layouts/FanLayout';
import AdminLayout from './layouts/AdminLayout';

import GillianManagementHomePage from './components/GillianManagementHomePage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AboutPage from './pages/AboutPage';
import AppearancesPage from './pages/AppearancesPage';
import MediaPage from './pages/MediaPage';
import NewsPage from './pages/NewsPage';
import NewsArticlePage from './pages/NewsArticlePage';
import ContactPage from './pages/ContactPage';
import FanAccessPage from './pages/FanAccessPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

import SignInPage from './pages/auth/SignInPage';
import CreateAccountPage from './pages/auth/CreateAccountPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import EmailVerifiedPage from './pages/auth/EmailVerifiedPage';

import FanHomePage from './pages/fan/FanHomePage';
import FanMessagesPage from './pages/fan/FanMessagesPage';
import FanRequestsPage from './pages/fan/FanRequestsPage';
import FanMembershipPage from './pages/fan/FanMembershipPage';
import FanNotificationsPage from './pages/fan/FanNotificationsPage';
import FanProfilePage from './pages/fan/FanProfilePage';
import FanSettingsPage from './pages/fan/FanSettingsPage';

import { LoadingState } from './components/ui/States';

/** Gate for the private Management Office. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="ed-shell ed-section">
        <LoadingState label="Checking your access" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  if (profile && profile.role !== 'admin') {
    return <Navigate to="/fan" replace />;
  }
  return <>{children}</>;
}

/** Legacy /portal bookmark — always points at the current private area. */
function PortalRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="ed-shell ed-section">
        <LoadingState label="Opening your area" />
      </div>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/fan'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route index element={<GillianManagementHomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="appearances" element={<AppearancesPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:slug" element={<NewsArticlePage />} />
        <Route path="fan-access" element={<FanAccessPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
      </Route>

      {/* Auth entry */}
      <Route element={<AuthLayout />}>
        <Route path="sign-in" element={<SignInPage />} />
        <Route path="create-account" element={<CreateAccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="confirm-email" element={<VerifyEmailPage />} />
        <Route path="email-verified" element={<EmailVerifiedPage />} />
      </Route>

      {/* Private fan area */}
      <Route path="fan" element={<FanLayout />}>
        <Route index element={<FanHomePage />} />
        <Route path="messages" element={<FanMessagesPage />} />
        <Route path="requests" element={<FanRequestsPage />} />
        <Route path="membership" element={<FanMembershipPage />} />
        <Route path="notifications" element={<FanNotificationsPage />} />
        <Route path="profile" element={<FanProfilePage />} />
        <Route path="settings" element={<FanSettingsPage />} />
      </Route>

      {/* Management office */}
      <Route
        path="admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminHomePage />} />
      </Route>

      {/* Legacy URL kept working */}
      <Route path="portal" element={<PortalRedirect />} />
      <Route path="login" element={<Navigate to="/sign-in" replace />} />
      <Route path="register" element={<Navigate to="/create-account" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
