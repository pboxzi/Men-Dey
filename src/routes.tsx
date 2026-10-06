import {lazy, Suspense} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

import {
  RedirectIfAuthed,
  RequireAdmin,
  RequireAuth,
  RequireManagement,
} from './auth/guards';
import {ErrorBoundary} from './components/ErrorBoundary';
import {DashboardLayout} from './components/layout/DashboardLayout';
import {HomeLayout} from './components/layout/HomeLayout';
import {ManagementLayout} from './components/layout/ManagementLayout';
import {PublicLayout} from './components/layout/PublicLayout';
import {FullPageLoader} from './components/ui/FullPageLoader';
import {ForbiddenPage, NotFoundPage} from './pages/ErrorPages';
import {AcknowledgementPage} from './pages/auth/AcknowledgementPage';
import {ForgotPasswordPage} from './pages/auth/ForgotPasswordPage';
import {ResetPasswordPage} from './pages/auth/ResetPasswordPage';
import {SignInPage} from './pages/auth/SignInPage';
import {VerifyEmailPage} from './pages/auth/VerifyEmailPage';
import {
  ApplicationGate,
  ApplicationProvider,
} from './pages/auth/application/ApplicationProvider';
import {AboutStep} from './pages/auth/application/steps/AboutStep';
import {ContactStep} from './pages/auth/application/steps/ContactStep';
import {CredentialsStep} from './pages/auth/application/steps/CredentialsStep';
import {InterestsStep} from './pages/auth/application/steps/InterestsStep';
import {PersonalStep} from './pages/auth/application/steps/PersonalStep';
import {ReviewStep} from './pages/auth/application/steps/ReviewStep';
import {LandingPage} from './pages/public/LandingPage';
import {DashboardHomePage} from './pages/user/DashboardHomePage';
import {HomePage} from './pages/user/HomePage';

// Second-pass bundles: everything behind the auth gates is lazy-loaded so the
// public landing and sign-in first paint stays small.
const ManagementApplicantDetailPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementApplicantDetailPage'))
    .ManagementApplicantDetailPage,
}));
const ManagementApplicantsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementApplicantsPage')).ManagementApplicantsPage,
}));
const ManagementAuditPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementAuditPage')).ManagementAuditPage,
}));
const ManagementBookingsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementBookingsPage')).ManagementBookingsPage,
}));
const ManagementCalendarPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementCalendarPage')).ManagementCalendarPage,
}));
const ManagementCmsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementCmsPage')).ManagementCmsPage,
}));
const ManagementDashboardPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementDashboardPage')).ManagementDashboardPage,
}));
const ManagementDocumentsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementDocumentsPage')).ManagementDocumentsPage,
}));
const ManagementExperienceDetailPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementExperienceDetailPage'))
    .ManagementExperienceDetailPage,
}));
const ManagementExperiencesPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementExperiencesPage')).ManagementExperiencesPage,
}));
const ManagementFanDetailPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementFanDetailPage')).ManagementFanDetailPage,
}));
const ManagementFansPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementFansPage')).ManagementFansPage,
}));
const ManagementMembershipDetailPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementMembershipDetailPage'))
    .ManagementMembershipDetailPage,
}));
const ManagementMembershipsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementMembershipsPage'))
    .ManagementMembershipsPage,
}));
const ManagementMediaPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementMediaPage')).ManagementMediaPage,
}));
const ManagementMessagesPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementMessagesPage')).ManagementMessagesPage,
}));
const ManagementNotificationsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementNotificationsPage'))
    .ManagementNotificationsPage,
}));
const ManagementPaymentsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementPaymentsPage')).ManagementPaymentsPage,
}));
const ManagementProposalsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementProposalsPage')).ManagementProposalsPage,
}));
const ManagementRequestDetailPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementRequestDetailPage'))
    .ManagementRequestDetailPage,
}));
const ManagementRequestsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementRequestsPage')).ManagementRequestsPage,
}));
const ManagementSecurityPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementSecurityPage')).ManagementSecurityPage,
}));
const ManagementSettingsPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementSettingsPage')).ManagementSettingsPage,
}));
const ManagementStaffPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementStaffPage')).ManagementStaffPage,
}));
const ManagementTasksPage = lazy(async () => ({
  default: (await import('./pages/management/ManagementTasksPage')).ManagementTasksPage,
}));

const ConversationPage = lazy(async () => ({
  default: (await import('./pages/user/messages/ConversationPage')).ConversationPage,
}));
const MessagesListPage = lazy(async () => ({
  default: (await import('./pages/user/messages/MessagesListPage')).MessagesListPage,
}));
const NewRequestPage = lazy(async () => ({
  default: (await import('./pages/user/requests/NewRequestPage')).NewRequestPage,
}));
const RequestDetailPage = lazy(async () => ({
  default: (await import('./pages/user/requests/RequestDetailPage')).RequestDetailPage,
}));
const RequestsListPage = lazy(async () => ({
  default: (await import('./pages/user/requests/RequestsListPage')).RequestsListPage,
}));
const NotificationDetailPage = lazy(async () => ({
  default: (await import('./pages/user/notifications/NotificationDetailPage'))
    .NotificationDetailPage,
}));
const NotificationsListPage = lazy(async () => ({
  default: (await import('./pages/user/notifications/NotificationsListPage'))
    .NotificationsListPage,
}));
const MembershipCardPage = lazy(async () => ({
  default: (await import('./pages/user/membership/MembershipCardPage')).MembershipCardPage,
}));
const MembershipDetailPage = lazy(async () => ({
  default: (await import('./pages/user/membership/MembershipDetailPage')).MembershipDetailPage,
}));
const MembershipOffersPage = lazy(async () => ({
  default: (await import('./pages/user/membership/MembershipOffersPage')).MembershipOffersPage,
}));
const DocumentsPage = lazy(async () => ({
  default: (await import('./pages/user/DocumentsPage')).DocumentsPage,
}));
const ExperiencesPage = lazy(async () => ({
  default: (await import('./pages/user/ExperiencesPage')).ExperiencesPage,
}));
const MembershipPage = lazy(async () => ({
  default: (await import('./pages/user/MembershipPage')).MembershipPage,
}));
const ProfilePage = lazy(async () => ({
  default: (await import('./pages/user/ProfilePage')).ProfilePage,
}));
const SettingsPage = lazy(async () => ({
  default: (await import('./pages/user/SettingsPage')).SettingsPage,
}));

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageLoader label="Loading" />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />

            <Route element={<RedirectIfAuthed />}>
              <Route path="/acknowledgement" element={<AcknowledgementPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
            </Route>

            {/* New-account application: acknowledgement first, then the wizard. */}
            <Route element={<ApplicationGate />}>
              <Route path="/create-account" element={<ApplicationProvider />}>
                <Route index element={<Navigate to="/create-account/personal" replace />} />
                <Route path="personal" element={<PersonalStep />} />
                <Route path="about" element={<AboutStep />} />
                <Route path="contact" element={<ContactStep />} />
                <Route path="interests" element={<InterestsStep />} />
                <Route path="review" element={<ReviewStep />} />
                <Route path="account" element={<CredentialsStep />} />
              </Route>
            </Route>

            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<HomeLayout />}>
              <Route path="/home" element={<HomePage />} />
            </Route>

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHomePage />} />
              <Route path="/dashboard/messages" element={<MessagesListPage />} />
              <Route path="/dashboard/messages/:conversationId" element={<ConversationPage />} />
              <Route path="/dashboard/requests" element={<RequestsListPage />} />
              <Route path="/dashboard/requests/new" element={<NewRequestPage />} />
              <Route path="/dashboard/requests/:id" element={<RequestDetailPage />} />
              <Route path="/dashboard/notifications" element={<NotificationsListPage />} />
              <Route path="/dashboard/notifications/:id" element={<NotificationDetailPage />} />
              <Route path="/dashboard/experiences" element={<ExperiencesPage />} />
              <Route path="/dashboard/experiences/:id" element={<RequestDetailPage />} />
              <Route path="/dashboard/membership" element={<MembershipPage />} />
              <Route path="/dashboard/membership/offers" element={<MembershipOffersPage />} />
              <Route path="/dashboard/membership/card" element={<MembershipCardPage />} />
              <Route path="/dashboard/membership/:id" element={<MembershipDetailPage />} />
              <Route path="/dashboard/documents" element={<DocumentsPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<RequireManagement />}>
            <Route element={<ManagementLayout />}>
              <Route path="/management" element={<ManagementDashboardPage />} />

              <Route path="/management/fans" element={<ManagementFansPage />} />
              <Route path="/management/fans/:id" element={<ManagementFanDetailPage />} />
              <Route path="/management/applicants" element={<ManagementApplicantsPage />} />
              <Route path="/management/applicants/:id" element={<ManagementApplicantDetailPage />} />
              <Route path="/management/messages" element={<ManagementMessagesPage />} />
              <Route
                path="/management/messages/:conversationId"
                element={<ManagementMessagesPage />}
              />
              <Route path="/management/requests" element={<ManagementRequestsPage />} />
              <Route path="/management/requests/:id" element={<ManagementRequestDetailPage />} />
              <Route path="/management/memberships" element={<ManagementMembershipsPage />} />
              <Route
                path="/management/memberships/:id"
                element={<ManagementMembershipDetailPage />}
              />
              <Route path="/management/experiences" element={<ManagementExperiencesPage />} />
              <Route
                path="/management/experiences/:id"
                element={<ManagementExperienceDetailPage />}
              />
              <Route path="/management/bookings" element={<ManagementBookingsPage />} />
              <Route path="/management/calendar" element={<ManagementCalendarPage />} />
              <Route path="/management/proposals" element={<ManagementProposalsPage />} />
              <Route path="/management/payments" element={<ManagementPaymentsPage />} />
              <Route
                path="/management/agreements"
                element={<ManagementDocumentsPage presetCategory="agreement" />}
              />
              <Route path="/management/documents" element={<ManagementDocumentsPage />} />
              <Route path="/management/cms" element={<ManagementCmsPage />} />
              <Route path="/management/media" element={<ManagementMediaPage />} />
              <Route path="/management/tasks" element={<ManagementTasksPage />} />
              <Route path="/management/staff" element={<ManagementStaffPage />} />
              <Route path="/management/notifications" element={<ManagementNotificationsPage />} />
              <Route path="/management/settings" element={<ManagementSettingsPage />} />
              <Route path="/management/security" element={<ManagementSecurityPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/management/audit" element={<ManagementAuditPage />} />
              </Route>

              {/* legacy console links */}
              <Route path="/management/inbox" element={<Navigate to="/management" replace />} />
              <Route path="/management/notes" element={<Navigate to="/management" replace />} />
              <Route
                path="/management/conversations"
                element={<Navigate to="/management/messages" replace />}
              />
            </Route>
          </Route>

          {/* legacy redirects */}
          <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
          <Route path="/fan" element={<Navigate to="/dashboard" replace />} />
          <Route path="/fan/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/messages" element={<Navigate to="/dashboard/messages" replace />} />
          <Route path="/requests" element={<Navigate to="/dashboard/requests" replace />} />
          <Route path="/membership" element={<Navigate to="/dashboard/membership" replace />} />
          <Route
            path="/notifications"
            element={<Navigate to="/dashboard/notifications" replace />}
          />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
