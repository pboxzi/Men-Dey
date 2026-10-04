import type {ApplicationDraft} from './draft';

export const STEP_PATHS = [
  'personal',
  'about',
  'contact',
  'interests',
  'review',
  'account',
] as const;

export type StepPath = (typeof STEP_PATHS)[number];

export const STEP_LABELS: Record<StepPath, string> = {
  personal: 'Personal information',
  about: 'About you',
  contact: 'Contact preferences',
  interests: 'Experience interests',
  review: 'Review',
  account: 'Account creation',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s().-]{6,24}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function validateStep(step: StepPath, draft: ApplicationDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 'personal') {
    if (draft.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
    if (!isValidEmail(draft.email)) errors.email = 'Enter a valid email address.';
    if (!draft.phone.trim()) errors.phone = 'Phone number is required.';
    else if (!isValidPhone(draft.phone)) errors.phone = 'Enter a valid phone number.';
    if (!draft.country.trim()) errors.country = 'Country is required.';
    if (!draft.city.trim()) errors.city = 'City is required.';
    if (!draft.preferredContactMethod) {
      errors.preferredContactMethod = 'Choose a preferred contact method.';
    }
  }

  if (step === 'about') {
    if (!draft.occupation.trim()) errors.occupation = 'Occupation is required.';
    if (draft.reasonForJoining.trim().length < 10) {
      errors.reasonForJoining = 'Please give a little more detail (at least 10 characters).';
    }
    if (draft.platformMotivation.trim().length < 10) {
      errors.platformMotivation = 'Please give a little more detail (at least 10 characters).';
    }
    if (draft.connectionInterest.trim().length < 5) {
      errors.connectionInterest = 'Tell us what kind of connection you are interested in.';
    }
  }

  if (step === 'contact') {
    if (!draft.contactEmailOk && !draft.contactPhoneOk && !draft.contactWhatsappOk) {
      errors.channels = 'Choose at least one way for management to reach you.';
    }
    if (draft.contactWhatsappOk && !isValidPhone(draft.whatsappNumber)) {
      errors.whatsappNumber = 'Enter a valid WhatsApp number, or uncheck WhatsApp.';
    }
  }

  if (step === 'interests') {
    if (draft.experienceInterests.length === 0) {
      errors.experienceInterests = 'Select at least one area of interest.';
    }
  }

  return errors;
}

export function validateCredentials(
  password: string,
  confirm: string,
  termsAccepted: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (password.length < 8) errors.password = 'Password must be at least 8 characters long.';
  if (password !== confirm) errors.confirm = 'Passwords do not match.';
  if (!termsAccepted) errors.terms = 'You must accept the acknowledgement to continue.';
  return errors;
}
