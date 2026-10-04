import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {storeAck} from '../../auth/ack';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Spinner} from '../../components/ui/Spinner';
import {toFriendlyMessage} from '../../lib/errors';
import {supabase} from '../../lib/supabase';
import type {AcknowledgementVersion} from '../../types';

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
      <div className="mx-auto flex w-full max-w-3xl justify-center px-6 py-24">
        <Spinner label="Loading acknowledgement" />
      </div>
    );
  }

  if (loadError || !version) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24">
        <Alert tone="error">
          {loadError ?? 'No acknowledgement is currently published. Please check back soon.'}
        </Alert>
        <div className="mt-4">
          <Link to="/" className="btn btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="eyebrow mb-3">Before you create an account</p>
      <h1 className="mb-2 text-3xl md:text-4xl">{version.title}</h1>
      <p className="mb-8 text-sm text-muted">
        Version {version.version} · Published{' '}
        {new Date(version.published_at ?? version.created_at).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      <article className="surface max-h-[28rem] overflow-y-auto whitespace-pre-wrap p-6 text-sm leading-relaxed text-ink md:p-8">
        {version.content}
      </article>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[#C89B3C]"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          I have read and understood this acknowledgement, and I accept it voluntarily before
          creating my account.
        </span>
      </label>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => void handleAccept()} disabled={!accepted} loading={submitting}>
          Continue to account creation
        </Button>
        <Link to="/" className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </div>
  );
}
