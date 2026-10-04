import {Pencil} from 'lucide-react';
import {useNavigate} from 'react-router-dom';

import {useApplication} from '../ApplicationProvider';
import {INTEREST_LABELS} from '../interests';
import {WizardShell} from '../WizardShell';
import type {StepPath} from '../validation';

const CONTACT_METHOD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone call',
  sms: 'SMS',
  none: 'No preference',
  '': 'Not provided',
};

function ReviewRow({label, value}: {label: string; value: string}) {
  return (
    <div className="grid gap-1 border-b border-stone py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-ink">{value || 'Not provided'}</dd>
    </div>
  );
}

function ReviewSection({
  title,
  editTo,
  children,
}: {
  title: string;
  editTo: StepPath;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <section className="border-b border-stone pb-5 last:border-b-0 last:pb-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg">{title}</h2>
        <button
          type="button"
          className="btn btn-ghost gap-1 text-xs"
          onClick={() => navigate(`/create-account/${editTo}`, {state: {fromReview: true}})}
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

export function ReviewStep() {
  const {draft} = useApplication();
  const navigate = useNavigate();

  const channels = [
    draft.contactEmailOk ? 'Email' : null,
    draft.contactPhoneOk ? 'Phone' : null,
    draft.contactWhatsappOk ? 'WhatsApp' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <WizardShell
      step="review"
      description="Review every answer before creating your account. Nothing is submitted yet."
      onBack={() => navigate('/create-account/interests')}
      onContinue={() => navigate('/create-account/account')}
      continueLabel="Continue"
    >
      <ReviewSection title="Personal information" editTo="personal">
        <ReviewRow label="Full name" value={draft.fullName} />
        <ReviewRow label="Email" value={draft.email} />
        <ReviewRow label="Phone" value={draft.phone} />
        <ReviewRow label="Country" value={draft.country} />
        <ReviewRow label="City" value={draft.city} />
        <ReviewRow
          label="Preferred contact"
          value={CONTACT_METHOD_LABELS[draft.preferredContactMethod] ?? ''}
        />
      </ReviewSection>

      <ReviewSection title="About you" editTo="about">
        <ReviewRow label="Occupation" value={draft.occupation} />
        <ReviewRow label="Company" value={draft.company} />
        <ReviewRow label="Reason for joining" value={draft.reasonForJoining} />
        <ReviewRow label="What brings you here" value={draft.platformMotivation} />
        <ReviewRow label="Connection interest" value={draft.connectionInterest} />
      </ReviewSection>

      <ReviewSection title="Contact preferences" editTo="contact">
        <ReviewRow label="Channels" value={channels} />
        <ReviewRow label="WhatsApp" value={draft.contactWhatsappOk ? draft.whatsappNumber : ''} />
      </ReviewSection>

      <ReviewSection title="Experience interests" editTo="interests">
        <ReviewRow
          label="Selected"
          value={draft.experienceInterests.map((key) => INTEREST_LABELS[key]).join(', ')}
        />
      </ReviewSection>
    </WizardShell>
  );
}
