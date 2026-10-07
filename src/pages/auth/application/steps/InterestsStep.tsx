import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {Alert} from '../../../../components/ui/Alert';
import {useApplication} from '../ApplicationProvider';
import {INTEREST_CATEGORIES} from '../interests';
import {WizardShell} from '../WizardShell';
import {validateStep} from '../validation';

export function InterestsStep() {
  const {draft, update} = useApplication();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (key: (typeof INTEREST_CATEGORIES)[number]['key']) => {
    const next = draft.experienceInterests.includes(key)
      ? draft.experienceInterests.filter((value) => value !== key)
      : [...draft.experienceInterests, key];
    update({experienceInterests: next});
  };

  const handleContinue = () => {
    const found = validateStep('interests', draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    navigate('/create-account/review');
  };

  return (
    <WizardShell
      step="interests"
      description="Select the broad areas you are interested in. This expresses interest only."
      errors={errors}
      onBack={() => navigate('/create-account/contact')}
      onContinue={handleContinue}
    >
      <Alert tone="info">
        Selecting an interest does not imply availability, booking or entitlement. Anything
        offered is reviewed, proposed and confirmed individually by management.
      </Alert>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="sr-only">Experience interests</legend>
        {INTEREST_CATEGORIES.map((category) => (
          <label
            key={category.key}
            className="flex cursor-pointer items-center gap-3 rounded-sm border border-stone px-4 py-3 transition-colors hover:border-stone-deep"
          >
            <input
              type="checkbox"
              className="size-4 accent-[#C89B3C]"
              checked={draft.experienceInterests.includes(category.key)}
              onChange={() => toggle(category.key)}
            />
            <span className="text-sm text-ink">{category.label}</span>
          </label>
        ))}
      </fieldset>

      {errors.experienceInterests ? (
        <Alert tone="error">{errors.experienceInterests}</Alert>
      ) : null}
    </WizardShell>
  );
}
