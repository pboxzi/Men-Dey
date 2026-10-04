import {Navigate, Route, Routes} from 'react-router-dom';

import {
  RedirectIfAuthed,
  RequireAdmin,
  RequireAuth,
  RequireManagement,
} from './auth/guards';
import {ErrorBoundary} from './components/ErrorBoundary';
import {ManagementLayout} from './components/layout/ManagementLayout';
import {PublicLayout} from './components/layout/PublicLayout';
import {UserLayout} from './components/layout/UserLayout';
import {FullPageLoader} from './components/ui/FullPageLoader';
import {useAuth} from './auth/AuthContext';
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
import {LandingPage} from './pages/public/LandingPage';
import {HomePage} from './pages/user/HomePage';

const USER_SECTIONS = [
  {path: 'messages', eyebrow: 'Account', title: 'Messages', description: 'Your conversation with the management office.'},
  {path: 'requests', eyebrow: 'Account', title: 'Requests', description: 'Requests you have submitted to management.'},
  {path: 'membership', eyebrow: 'Account', title: 'Membership', description: 'Your membership status and applications.'},
  {path: 'experiences', eyebrow: 'Account', title: 'Experiences', description: 'Experiences approved and proposed for you.'},
  {path: 'notifications', eyebrow: 'Account', title: 'Notifications', description: 'Updates about your requests and account.'},
  {path: 'documents', eyebrow: 'Account', title: 'Documents', description: 'Documents shared with you by management.'},
  {path: 'profile', eyebrow: 'Account', title: 'Profile', description: 'Your personal details and preferences.'},
  {path: 'settings', eyebrow: 'Account', title: 'Settings', description: 'Security and notification settings.'},
];

const MANAGEMENT_SECTIONS = [
  {path: 'inbox', title: 'Inbox', description: 'Everything that needs a management response.'},
  {path: 'applicants', title: 'Applicants', description: 'Applicant profiles awaiting review.'},
  {path: 'requests', title: 'Requests', description: 'User requests routed through management.'},
  {path: 'messages', title: 'Messages', description: 'Conversations with users.'},
  {path: 'notes', title: 'Notes', description: 'Internal notes on users and conversations.'},
  {path: 'conversations', title: 'Conversations', description: 'All management conversation threads.'},
  {path: 'membership', title: 'Membership overview', description: 'Membership health at a glance.'},
  {path: 'membership/tiers', title: 'Membership tiers', description: 'Tier definitions, pricing and benefits.'},
  {path: 'membership/applications', title: 'Membership applications', description: 'Applications awaiting review.'},
  {path: 'membership/members', title: 'Members', description: 'Active and historical members.'},
  {path: 'membership/payments', title: 'Membership payments', description: 'Payment records and statuses.'},
  {path: 'experiences', title: 'Experiences', description: 'Experiences under management.'},
  {path: 'experiences/requests', title: 'Experience requests', description: 'Requests to take part in experiences.'},
  {path: 'experiences/calendar', title: 'Experience calendar', description: 'Schedules and appointments.'},
  {path: 'experiences/payments', title: 'Experience payments', description: 'Payments for approved experiences.'},
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
          <Route element={<UserLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route
              path="/dashboard"
              element={
                <SectionPage
                  eyebrow="Account"
                  title="Dashboard"
                  description="An overview of your account with management."
                />
              }
            />
            {USER_SECTIONS.map((section) => (
              <Route
                key={section.path}
                path={`/dashboard/${section.path}`}
                element={
                  <SectionPage
                    eyebrow={section.eyebrow}
                    title={section.title}
                    description={section.description}
                  />
                }
              />
            ))}
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
