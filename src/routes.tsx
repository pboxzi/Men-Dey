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
import {ManagementApplicantDetailPage} from './pages/management/ManagementApplicantDetailPage';
import {ManagementApplicantsPage} from './pages/management/ManagementApplicantsPage';
import {ManagementAuditPage} from './pages/management/ManagementAuditPage';
import {ManagementBookingsPage} from './pages/management/ManagementBookingsPage';
import {ManagementCalendarPage} from './pages/management/ManagementCalendarPage';
import {ManagementCmsPage} from './pages/management/ManagementCmsPage';
import {ManagementDashboardPage} from './pages/management/ManagementDashboardPage';
import {ManagementDocumentsPage} from './pages/management/ManagementDocumentsPage';
import {ManagementExperienceDetailPage} from './pages/management/ManagementExperienceDetailPage';
import {ManagementExperiencesPage} from './pages/management/ManagementExperiencesPage';
import {ManagementFanDetailPage} from './pages/management/ManagementFanDetailPage';
import {ManagementFansPage} from './pages/management/ManagementFansPage';
import {ManagementMembershipDetailPage} from './pages/management/ManagementMembershipDetailPage';
import {ManagementMembershipsPage} from './pages/management/ManagementMembershipsPage';
import {ManagementMediaPage} from './pages/management/ManagementMediaPage';
import {ManagementMessagesPage} from './pages/management/ManagementMessagesPage';
import {ManagementNotificationsPage} from './pages/management/ManagementNotificationsPage';
import {ManagementPaymentsPage} from './pages/management/ManagementPaymentsPage';
import {ManagementProposalsPage} from './pages/management/ManagementProposalsPage';
import {ManagementRequestDetailPage} from './pages/management/ManagementRequestDetailPage';
import {ManagementRequestsPage} from './pages/management/ManagementRequestsPage';
import {ManagementSecurityPage} from './pages/management/ManagementSecurityPage';
import {ManagementSettingsPage} from './pages/management/ManagementSettingsPage';
import {ManagementStaffPage} from './pages/management/ManagementStaffPage';
import {ManagementTasksPage} from './pages/management/ManagementTasksPage';
import {LandingPage} from './pages/public/LandingPage';
import {DashboardHomePage} from './pages/user/DashboardHomePage';
import {DocumentsPage} from './pages/user/DocumentsPage';
import {ExperiencesPage} from './pages/user/ExperiencesPage';
import {HomePage} from './pages/user/HomePage';
import {MembershipPage} from './pages/user/MembershipPage';
import {ProfilePage} from './pages/user/ProfilePage';
import {SettingsPage} from './pages/user/SettingsPage';
import {MembershipCardPage} from './pages/user/membership/MembershipCardPage';
import {MembershipDetailPage} from './pages/user/membership/MembershipDetailPage';
import {MembershipOffersPage} from './pages/user/membership/MembershipOffersPage';
import {NotificationDetailPage} from './pages/user/notifications/NotificationDetailPage';
import {NotificationsListPage} from './pages/user/notifications/NotificationsListPage';
import {ConversationPage} from './pages/user/messages/ConversationPage';
import {MessagesListPage} from './pages/user/messages/MessagesListPage';
import {NewRequestPage} from './pages/user/requests/NewRequestPage';
import {RequestDetailPage} from './pages/user/requests/RequestDetailPage';
import {RequestsListPage} from './pages/user/requests/RequestsListPage';

export function AppRoutes() {
  return (
    <ErrorBoundary>
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
            <Route path="/management/memberships/:id" element={<ManagementMembershipDetailPage />} />
            <Route path="/management/experiences" element={<ManagementExperiencesPage />} />
            <Route path="/management/experiences/:id" element={<ManagementExperienceDetailPage />} />
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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
