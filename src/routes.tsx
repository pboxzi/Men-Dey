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
import {SectionPage} from './pages/SectionPage';
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
import {ManagementBookingsPage} from './pages/management/ManagementBookingsPage';
import {ManagementCalendarPage} from './pages/management/ManagementCalendarPage';
import {ManagementExperienceDetailPage} from './pages/management/ManagementExperienceDetailPage';
import {ManagementExperiencesPage} from './pages/management/ManagementExperiencesPage';
import {ManagementMembershipDetailPage} from './pages/management/ManagementMembershipDetailPage';
import {ManagementMembershipsPage} from './pages/management/ManagementMembershipsPage';
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

const MANAGEMENT_SECTIONS = [
  {path: 'inbox', title: 'Inbox', description: 'Everything that needs a management response.'},
  {path: 'applicants', title: 'Applicants', description: 'Applicant profiles awaiting review.'},
  {path: 'requests', title: 'Requests', description: 'User requests routed through management.'},
  {path: 'messages', title: 'Messages', description: 'Conversations with users.'},
  {path: 'notes', title: 'Notes', description: 'Internal notes on users and conversations.'},
  {path: 'conversations', title: 'Conversations', description: 'All management conversation threads.'},
  {path: 'tasks', title: 'Tasks', description: 'Internal tasks for the management team.'},
  {path: 'documents', title: 'Documents', description: 'Document library and visibility.'},
  {path: 'media', title: 'Media', description: 'Media assets across all buckets.'},
  {path: 'staff', title: 'Staff', description: 'Management team members and roles.'},
  {path: 'audit', title: 'Audit log', description: 'Recorded privileged actions (administrators only).'},
  {path: 'settings', title: 'Settings', description: 'Platform configuration.'},
  {path: 'cms', title: 'CMS', description: 'Public pages and content sections.'},
];

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
            <Route
              path="/management"
              element={
                <SectionPage
                  eyebrow="Console"
                  title="Management home"
                  description="The bridge between every user and Gillian."
                />
              }
            />
            <Route path="/management/memberships" element={<ManagementMembershipsPage />} />
            <Route path="/management/memberships/:id" element={<ManagementMembershipDetailPage />} />
            <Route path="/management/experiences" element={<ManagementExperiencesPage />} />
            <Route path="/management/experiences/:id" element={<ManagementExperienceDetailPage />} />
            <Route path="/management/bookings" element={<ManagementBookingsPage />} />
            <Route path="/management/calendar" element={<ManagementCalendarPage />} />
            {MANAGEMENT_SECTIONS.map((section) => {
              if (section.path === 'audit') {
                return (
                  <Route key={section.path} element={<RequireAdmin />}>
                    <Route
                      path="/management/audit"
                      element={
                        <SectionPage
                          eyebrow="Console"
                          title={section.title}
                          description={section.description}
                        />
                      }
                    />
                  </Route>
                );
              }
              return (
                <Route
                  key={section.path}
                  path={`/management/${section.path}`}
                  element={
                    <SectionPage
                      eyebrow="Console"
                      title={section.title}
                      description={section.description}
                    />
                  }
                />
              );
            })}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
