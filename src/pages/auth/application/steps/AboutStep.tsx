import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {Field} from '../../../../components/ui/Field';
import {useApplication} from '../ApplicationProvider';
import {WizardShell, fieldError} from '../WizardShell';
import {validateStep} from '../validation';

export function AboutStep() {
  const {draft, update} = useApplication();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    const found = validateStep('about', draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    navigate('/create-account/contact');
  };

  return (
    <WizardShell
      step="about"
      description="Help management understand who you are and what you are looking for."
      errors={errors}
      onBack={() => navigate('/create-account/personal')}
      onContinue={handleContinue}
    >
      <Field label="Occupation" error={fieldError(errors, 'occupation')}>
        {(props) => (
          <input
            {...props}
            className="field-input"
            autoComplete="organization-title"
            required
            maxLength={200}
            value={draft.occupation}
            onChange={(event) => update({occupation: event.target.value})}
          />
        )}
      </Field>

      <Field label="Company or business" hint="Where applicable — optional.">
        {(props) => (
          <input
            {...props}
            className="field-input"
            autoComplete="organization"
            maxLength={200}
            value={draft.company}
            onChange={(event) => update({company: event.target.value})}
          />
        )}
      </Field>

      <Field label="Reason for joining" error={fieldError(errors, 'reasonForJoining')}>
        {(props) => (
          <textarea
            {...props}
            className="field-input min-h-28"
            required
            maxLength={2000}
            value={draft.reasonForJoining}
            onChange={(event) => update({reasonForJoining: event.target.value})}
          />
        )}
      </Field>

      <Field label="What brings you to the platform?" error={fieldError(errors, 'platformMotivation')}>
        {(props) => (
          <textarea
            {...props}
            className="field-input min-h-28"
            required
            maxLength={2000}
            value={draft.platformMotivation}
            onChange={(event) => update({platformMotivation: event.target.value})}
          />
        )}
      </Field>

      <Field
        label="What type of experience or connection are you interested in?"
        error={fieldError(errors, 'connectionInterest')}
      >
        {(props) => (
          <textarea
            {...props}
            className="field-input min-h-24"
            required
            maxLength={2000}
            value={draft.connectionInterest}
            onChange={(event) => update({connectionInterest: event.target.value})}
          />
        )}
      </Field>
    </WizardShell>
  );
}
