import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {Field} from '../../../../components/ui/Field';
import {useApplication} from '../ApplicationProvider';
import {WizardShell, fieldError} from '../WizardShell';
import {validateStep} from '../validation';

export function PersonalStep() {
  const {draft, update} = useApplication();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    const found = validateStep('personal', draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Keep contact channels consistent with the preferred method so the
    // applicant never dead-ends on a later step.
    const patch =
      draft.preferredContactMethod === 'email'
        ? {contactEmailOk: true}
        : draft.preferredContactMethod === 'phone' || draft.preferredContactMethod === 'sms'
          ? {contactPhoneOk: true}
          : {};
    update(patch);
    navigate('/create-account/about');
  };

  return (
    <WizardShell
      step="personal"
      description="Tell management who you are. All fields are kept private."
      errors={errors}
      onContinue={handleContinue}
    >
      <Field label="Full name" error={fieldError(errors, 'fullName')}>
        {(props) => (
          <input
            {...props}
            className="field-input"
            autoComplete="name"
            required
            maxLength={200}
            value={draft.fullName}
            onChange={(event) => update({fullName: event.target.value})}
          />
        )}
      </Field>

      <Field label="Email" error={fieldError(errors, 'email')}>
        {(props) => (
          <input
            {...props}
            className="field-input"
            type="email"
            autoComplete="email"
            required
            value={draft.email}
            onChange={(event) => update({email: event.target.value})}
          />
        )}
      </Field>

      <Field label="Phone" error={fieldError(errors, 'phone')} hint="Include country code where possible.">
        {(props) => (
          <input
            {...props}
            className="field-input"
            type="tel"
            autoComplete="tel"
            placeholder="+44 20 0000 0000"
            required
            value={draft.phone}
            onChange={(event) => update({phone: event.target.value})}
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" error={fieldError(errors, 'country')}>
          {(props) => (
            <input
              {...props}
              className="field-input"
              autoComplete="country-name"
              required
              value={draft.country}
              onChange={(event) => update({country: event.target.value})}
            />
          )}
        </Field>

        <Field label="City" error={fieldError(errors, 'city')}>
          {(props) => (
            <input
              {...props}
              className="field-input"
              autoComplete="address-level2"
              required
              value={draft.city}
              onChange={(event) => update({city: event.target.value})}
            />
          )}
        </Field>
      </div>

      <Field
        label="Preferred contact method"
        error={fieldError(errors, 'preferredContactMethod')}
      >
        {(props) => (
          <select
            {...props}
            className="field-input"
            required
            value={draft.preferredContactMethod}
            onChange={(event) =>
              update({preferredContactMethod: event.target.value as typeof draft.preferredContactMethod})
            }
          >
            <option value="" disabled>
              Select a method…
            </option>
            <option value="email">Email</option>
            <option value="phone">Phone call</option>
            <option value="sms">SMS</option>
            <option value="none">No preference</option>
          </select>
        )}
      </Field>
    </WizardShell>
  );
}
