import {useEffect, useState, type ReactNode} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {storeAck} from '../../auth/ack';
import {GateHeader} from '../../components/auth/GateHeader';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Spinner} from '../../components/ui/Spinner';
import {toFriendlyMessage} from '../../lib/errors';
import {parseDocument} from '../../lib/document';
import {supabase} from '../../lib/supabase';
import type {AcknowledgementVersion} from '../../types';

function GateShell({children}: {children: ReactNode}) {
  return (
    <div className="gate-flow min-h-[100svh] w-full px-6 pb-12 pt-8 sm:px-10 sm:pb-14 sm:pt-10 lg:px-16 lg:pt-14">
      <GateHeader />
      <div className="mx-auto mt-8 w-full max-w-2xl sm:mt-10">{children}</div>
    </div>
  );
}

export function AcknowledgementPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState<AcknowledgementVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    supabase
      .from('acknowledgement_versions')
      .select('*')
      .eq('is_active', true)
      .not('published_at', 'is', null)
      .order('version', {ascending: false})
      .limit(1)
      .maybeSingle()
      .then(({data, error}) => {
        if (!active) return;
        if (error) {
          setLoadError(toFriendlyMessage(error));
        } else {
          setVersion((data as AcknowledgementVersion | null) ?? null);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAccept = async () => {
    if (!version || !accepted) return;
    setSubmitting(true);
    const at = new Date().toISOString();
    storeAck({version: version.version, at});
    navigate('/create-account');
  };

  if (loading) {
    return (
      <GateShell>
        <div className="flex justify-center py-20">
          <Spinner label="Loading acknowledgement" />
        </div>
      </GateShell>
    );
  }

  if (loadError || !version) {
    return (
      <GateShell>
        <p className="eyebrow mb-3">Before you join us</p>
        <h1 className="mb-3 text-3xl">A few things to know first</h1>
        <Alert tone="error">
          {loadError ?? 'No acknowledgement is currently published. Please check back soon.'}
        </Alert>
        <div className="mt-6">
          <Link to="/" className="btn btn-secondary">
            Back to the welcome page
          </Link>
        </div>
      </GateShell>
    );
  }

  const doc = parseDocument(version.content);

  return (
    <GateShell>
      <p className="eyebrow mb-3">Before you join us</p>
      <h1 className="mb-2 text-3xl md:text-4xl">{version.title}</h1>
      <p className="mb-6 text-sm text-muted">
        Version {version.version} · Published{' '}
        {new Date(version.published_at ?? version.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      <article className="gate-doc p-5 text-sm leading-relaxed text-ink sm:p-6">
        {doc.intro ? <p>{doc.intro}</p> : null}
        {doc.sections.map((section) => (
          <section key={section.number}>
            <h2 className="eyebrow mt-5">
              {section.number}. {section.title}
            </h2>
            <p className="mt-2">{section.body}</p>
          </section>
        ))}
      </article>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[#C89B3C]"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>I have read and understand the acknowledgement.</span>
      </label>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => void handleAccept()} disabled={!accepted} loading={submitting}>
          Continue
        </Button>
        <Link to="/" className="btn btn-ghost">
          Not now
        </Link>
      </div>
    </GateShell>
  );
}
