import { Link } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import Button from '../../components/ui/Button';

const INCLUDED = [
  'A private conversation thread with the management office',
  'Personal requests with a visible status from receipt to decision',
  'Official notifications and announcements sent to your account',
  'Your own profile and account security settings',
];

const NOT_PROMISED = [
  'Direct personal contact with Gillian',
  'Guaranteed meetings, calls, replies or appearances',
  'Paid tiers, points or rewards that change how requests are treated',
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function FanMembershipPage() {
  const { profile, user } = useAuth();
  const since = formatDate(profile?.created_at);

  return (
    <div className="space-y-8">
      <header>
        <span className="t-meta">Fan Area</span>
        <h1 className="t-h1 mt-3" style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)' }}>
          Your access
        </h1>
        <p className="t-body-sm mt-3" style={{ maxWidth: '36rem' }}>
          Fan Access is a single, free account. There are no tiers to buy and nothing that can be
          purchased changes how the management office treats your message.
        </p>
      </header>

      {/* Account standing */}
      <section className="ed-card p-6" aria-labelledby="account-standing">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="account-standing" className="t-h3">
              Account standing
            </h2>
            <p className="t-body-sm mt-2" style={{ color: 'var(--ed-muted)' }}>
              {profile?.email || user?.email || ''}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ borderColor: '#C6DED1', background: 'var(--ed-success-soft)', color: '#245840' }}
          >
            <Check className="h-3.5 w-3.5" /> Active
          </span>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="t-caption" style={{ color: 'var(--ed-muted)' }}>
              Access type
            </dt>
            <dd className="t-body-sm mt-1" style={{ fontWeight: 600 }}>
              Free fan account
            </dd>
          </div>
          <div>
            <dt className="t-caption" style={{ color: 'var(--ed-muted)' }}>
              Member since
            </dt>
            <dd className="t-body-sm mt-1" style={{ fontWeight: 600 }}>
              {since || '—'}
            </dd>
          </div>
          <div>
            <dt className="t-caption" style={{ color: 'var(--ed-muted)' }}>
              Cost
            </dt>
            <dd className="t-body-sm mt-1" style={{ fontWeight: 600 }}>
              Nothing
            </dd>
          </div>
        </dl>
      </section>

      {/* What's included */}
      <section aria-labelledby="included-heading">
        <h2 id="included-heading" className="t-h2" style={{ fontSize: '1.3rem' }}>
          What your access includes
        </h2>
        <hr className="ed-rule-accent mt-3" />
        <ul className="mt-5 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 t-accent" />
              <span className="t-body-sm">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What's not promised */}
      <section className="ed-card p-6" aria-labelledby="not-promised-heading">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 t-accent" />
          <div>
            <h2 id="not-promised-heading" className="t-h3">
              What is never promised
            </h2>
            <ul className="mt-3 space-y-2">
              {NOT_PROMISED.map((item) => (
                <li key={item} className="t-body-sm" style={{ color: 'var(--ed-muted)' }}>
                  — {item}
                </li>
              ))}
            </ul>
            <p className="t-body-sm mt-4">
              Where something can be arranged, the management office will raise it with you
              directly. Nothing on this site sells preferential treatment.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button to="/fan/requests" variant="primary">
          Submit a Request
        </Button>
        <Button to="/fan/settings" variant="secondary">
          Account Settings
        </Button>
        <Link to="/contact" className="btn btn-ghost btn-md">
          Contact the office
        </Link>
      </div>
    </div>
  );
}
