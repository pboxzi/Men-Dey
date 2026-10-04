import {useState, type FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';

import {getStoredAck} from '../../../../auth/ack';
import {Alert} from '../../../../components/ui/Alert';
import {Button} from '../../../../components/ui/Button';
import {Field} from '../../../../components/ui/Field';
import {toFriendlyMessage} from '../../../../lib/errors';
import {useApplication} from '../ApplicationProvider';
import {WizardShell, fieldError} from '../WizardShell';
import {validateCredentials} from '../validation';

export function CredentialsStep() {
  const {submit} = useApplication();
  const navigate = useNavigate();
  const ack = getStoredAck();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    const found = validateCredentials(password, confirm, termsAccepted);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await submit(password);
    } catch (err) {
      setServerError(toFriendlyMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <WizardShell
      step="account"
      description="Secure your account to finish the application. Your answers are already saved."
      errors={errors}
      onBack={() => navigate('/create-account/review')}
      loading={submitting}
    >
      <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
        {serverError ? <Alert tone="error">{serverError}</Alert> : null}

        <Field label="Password" hint="At least 8 characters." error={fieldError(errors, 'password')}>
          {(props) => (
            <input
              {...props}
              className="field-input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>

        <Field label="Confirm password" error={fieldError(errors, 'confirm')}>
          {(props) => (
            <input
              {...props}
              className="field-input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          )}
        </Field>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[#C89B3C]"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>
            I accept the terms of this private platform and confirm I have read, understood and
            accepted the acknowledgement{ack ? ` (version ${ack.version})` : ''} in full.
          </span>
        </label>
        {errors.terms ? <p className="text-xs text-danger">{errors.terms}</p> : null}

        <Button type="submit" loading={submitting}>
          Create account
        </Button>
      </form>
    </WizardShell>
  );
}
