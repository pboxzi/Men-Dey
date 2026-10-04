import type {ExperienceInterestKey} from '../../../types';

export interface InterestCategory {
  key: ExperienceInterestKey;
  label: string;
  note?: string;
}

// Broad categories the applicant can select. Selecting them expresses
// interest only — they never imply availability, booking or entitlement.
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {key: 'personal_experience', label: 'Personal Experience'},
  {key: 'video_communication', label: 'Video Communication'},
  {key: 'voice_message', label: 'Voice Message'},
  {key: 'text_communication', label: 'Text Communication'},
  {key: 'virtual_meeting', label: 'Virtual Meeting'},
  {key: 'meet_greet', label: 'Meet & Greet'},
  {key: 'business_request', label: 'Business / Professional Request'},
  {key: 'special_occasion', label: 'Special Occasion Request'},
  {key: 'other', label: 'Other'},
];

export const INTEREST_LABELS: Record<ExperienceInterestKey, string> = Object.fromEntries(
  INTEREST_CATEGORIES.map((category) => [category.key, category.label]),
) as Record<ExperienceInterestKey, string>;
