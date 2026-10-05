import type {
  ExperienceProposalStatus,
  RequestEventType,
  RequestStatus,
  RequestType,
} from '../types';

export const REQUEST_CATEGORIES: ReadonlyArray<{key: RequestType; label: string}> = [
  {key: 'personal_experience', label: 'Personal Experience'},
  {key: 'video_communication', label: 'Video Communication'},
  {key: 'voice_message', label: 'Voice Message'},
  {key: 'text_message', label: 'Text Message'},
  {key: 'virtual_meeting', label: 'Virtual Meeting'},
  {key: 'meet_greet', label: 'Meet & Greet'},
  {key: 'business_professional', label: 'Business / Professional'},
  {key: 'special_occasion', label: 'Special Occasion'},
  {key: 'other', label: 'Other'},
];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'Submitted',
  in_review: 'Under Review',
  information_requested: 'Awaiting Information',
  proposal: 'Proposal Ready',
  payment_required: 'Payment Required',
  confirmed: 'Confirmed',
  approved: 'Approved',
  scheduled: 'Scheduled',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export type ChipTone = 'neutral' | 'info' | 'success' | 'danger' | 'gold';

export const REQUEST_STATUS_TONES: Record<RequestStatus, ChipTone> = {
  submitted: 'info',
  in_review: 'info',
  information_requested: 'gold',
  proposal: 'gold',
  payment_required: 'gold',
  confirmed: 'success',
  approved: 'success',
  scheduled: 'success',
  completed: 'neutral',
  declined: 'danger',
  cancelled: 'neutral',
};

export const REQUEST_EVENT_LABELS: Record<RequestEventType, string> = {
  submitted: 'Request submitted',
  management_received: 'Management received',
  review_started: 'Review started',
  information_requested: 'Information requested',
  proposal_created: 'Proposal created',
  proposal_accepted: 'Proposal accepted',
  confirmed: 'Experience confirmed',
  approved: 'Approved',
  scheduled: 'Scheduled',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const EXPERIENCE_REQUEST_TYPES: ReadonlyArray<RequestType> = [
  'personal_experience',
  'virtual_meeting',
  'meet_greet',
  'business_professional',
  'special_occasion',
];

export const PROPOSAL_STATUS_LABELS: Record<ExperienceProposalStatus, string> = {
  draft: 'Draft',
  sent: 'Awaiting your response',
  viewed: 'Awaiting your response',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const PROPOSAL_STATUS_TONES: Record<ExperienceProposalStatus, ChipTone> = {
  draft: 'neutral',
  sent: 'gold',
  viewed: 'gold',
  accepted: 'success',
  declined: 'danger',
  expired: 'neutral',
  cancelled: 'neutral',
};

export function requestCategoryLabel(type: RequestType): string {
  return REQUEST_CATEGORIES.find((c) => c.key === type)?.label ?? type;
}

export const CONTACT_METHOD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  none: 'No preference',
};
