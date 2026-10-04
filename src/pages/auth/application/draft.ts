import type {ExperienceInterestKey} from '../../../types';

export interface ApplicationDraft {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  preferredContactMethod: 'email' | 'phone' | 'sms' | 'none' | '';

  occupation: string;
  company: string;
  reasonForJoining: string;
  platformMotivation: string;
  connectionInterest: string;

  contactEmailOk: boolean;
  contactPhoneOk: boolean;
  contactWhatsappOk: boolean;
  whatsappNumber: string;

  experienceInterests: ExperienceInterestKey[];
}

export const DRAFT_KEY = 'gam-application-draft';

export const EMPTY_DRAFT: ApplicationDraft = {
  fullName: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  preferredContactMethod: '',

  occupation: '',
  company: '',
  reasonForJoining: '',
  platformMotivation: '',
  connectionInterest: '',

  contactEmailOk: true,
  contactPhoneOk: false,
  contactWhatsappOk: false,
  whatsappNumber: '',

  experienceInterests: [],
};

export function loadDraft(): ApplicationDraft {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return {...EMPTY_DRAFT};
    const parsed = JSON.parse(raw) as Partial<ApplicationDraft>;
    return {
      ...EMPTY_DRAFT,
      ...parsed,
      experienceInterests: Array.isArray(parsed.experienceInterests)
        ? parsed.experienceInterests.filter((value): value is ExperienceInterestKey =>
            typeof value === 'string',
          )
        : [],
    };
  } catch {
    return {...EMPTY_DRAFT};
  }
}

export function saveDraft(draft: ApplicationDraft): void {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  window.localStorage.removeItem(DRAFT_KEY);
}
