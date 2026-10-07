import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {Alert} from '../../../../components/ui/Alert';
import {Field} from '../../../../components/ui/Field';
import {useApplication} from '../ApplicationProvider';
import {WizardShell, fieldError} from '../WizardShell';
import {validateStep} from '../validation';

function ChannelToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-stone px-4 py-3 transition-colors hover:border-stone-deep">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-[#C89B3C]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function ContactStep() {
  const {draft, update} = useApplication();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = () => {
    const found = validateStep('contact', draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    navigate('/create-account/interests');
  };

  return (
    <WizardShell
      step="contact"
      description="Choose how management may reach you. You can change these later."
      errors={errors}
      onBack={() => navigate('/create-account/about')}
      onContinue={handleContinue}
    >
      <div className="flex flex-col gap-3">
        <ChannelToggle
          label="Email"
          checked={draft.contactEmailOk}
          onChange={(contactEmailOk) => update({contactEmailOk})}
        />
        <ChannelToggle
          label="Phone"
          hint="Calls or SMS to the number provided."
          checked={draft.contactPhoneOk}
          onChange={(contactPhoneOk) => update({contactPhoneOk})}
        />
        <ChannelToggle
          label="WhatsApp"
          hint="Where legitimately supported for your region."
          checked={draft.contactWhatsappOk}
          onChange={(contactWhatsappOk) => update({contactWhatsappOk})}
        />
      </div>

      {errors.channels ? <Alert tone="error">{errors.channels}</Alert> : null}

      {draft.contactWhatsappOk ? (
        <Field label="WhatsApp number" error={fieldError(errors, 'whatsappNumber')}>
          {(props) => (
            <input
              {...props}
              className="field-input"
              type="tel"
              placeholder="+44 20 0000 0000"
              value={draft.whatsappNumber}
              onChange={(event) => update({whatsappNumber: event.target.value})}
            />
          )}
        </Field>
      ) : null}

      <Field label="Preferred communication method" hint="Used when more than one channel applies.">
        {(props) => (
          <select
            {...props}
            className="field-input"
            value={draft.preferredContactMethod}
            onChange={(event) =>
              update({preferredContactMethod: event.target.value as typeof draft.preferredContactMethod})
            }
          >
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
