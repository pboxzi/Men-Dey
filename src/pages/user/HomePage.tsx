import {CalendarCheck, MessageSquare, UserRound} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Card} from '../../components/ui/Card';
import {FullPageLoader} from '../../components/ui/FullPageLoader';
import {PageHeader} from '../../components/ui/PageHeader';
import {supabase} from '../../lib/supabase';
import type {ApplicantProfile} from '../../types';

const STATUS_LABELS: Record<string, string> = {
  new: 'Received — awaiting review',
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'Under review',
  approved: 'Approved',
  rejected: 'Not proceeding',
};

function NextStepCard({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link to={to} className="surface block p-5 transition-colors hover:border-gold">
      <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-stone text-gold-deep">
        {icon}
      </span>
      <h3 className="mb-1 text-base">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </Link>
  );
}

export function HomePage() {
  const {loading, profileLoading, role, profile} = useAuth();
  const [applicant, setApplicant] = useState<ApplicantProfile | null>(null);
  const [applicantLoaded, setApplicantLoaded] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      try {
        const {data} = await supabase
          .from('applicant_profiles')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();
        if (active) {
          setApplicant((data as ApplicantProfile | null) ?? null);
        }
      } catch {
        // non-fatal: home still renders without application status
      } finally {
        if (active) setApplicantLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  if (loading || profileLoading) return <FullPageLoader />;
  if (role === 'management' || role === 'admin') return <Navigate to="/management" replace />;

  return (
    <div>
      <PageHeader
        eyebrow="Home"
        title={profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Welcome'}
        description="Your private account with Gillian Anderson Management."
      />

      <Card className="mb-8 border-gold/40">
        <p className="eyebrow mb-2">You are in</p>
        <p className="text-lg leading-relaxed text-charcoal">
          You are connected with management. Your next step is to tell us what you would like
          to explore.
        </p>
        {applicant && applicantLoaded ? (
          <p className="mt-3 text-sm text-muted">
            Application status:{' '}
            <span className="font-medium text-gold-deep">
              {STATUS_LABELS[applicant.status] ?? applicant.status}
            </span>
            {applicant.status === 'new'
              ? ' — management will review your application and be in touch through this platform.'
              : '.'}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <NextStepCard
          to="/dashboard/profile"
          title="Complete your profile"
          description="Add the details management needs to reach you properly."
          icon={<UserRound className="size-4" aria-hidden />}
        />
        <NextStepCard
          to="/dashboard/requests"
          title="Send a request"
          description="Requests are reviewed by management — nothing is promised automatically."
          icon={<MessageSquare className="size-4" aria-hidden />}
        />
        <NextStepCard
          to="/dashboard/membership"
          title="Membership information"
          description="Learn how membership applications are reviewed. Membership is never purchased here."
          icon={<CalendarCheck className="size-4" aria-hidden />}
        />
      </div>
    </div>
  );
}
