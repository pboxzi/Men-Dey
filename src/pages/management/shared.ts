import type {ApplicantStatus, Task} from '../../types';
import type {ChipTone} from '../../lib/requests';

export const APPLICANT_STATUS_LABELS: Record<ApplicantStatus, string> = {
  new: 'New',
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const APPLICANT_STATUS_TONES: Record<ApplicantStatus, ChipTone> = {
  new: 'gold',
  draft: 'neutral',
  submitted: 'info',
  in_review: 'gold',
  approved: 'success',
  rejected: 'danger',
};

export const TASK_STATUS_LABELS: Record<Task['status'], string> = {
  open: 'Todo',
  in_progress: 'In Progress',
  blocked: 'Waiting',
  done: 'Completed',
  cancelled: 'Cancelled',
};

export const TASK_STATUS_TONES: Record<Task['status'], ChipTone> = {
  open: 'info',
  in_progress: 'gold',
  blocked: 'danger',
  done: 'success',
  cancelled: 'neutral',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_TONES: Record<string, ChipTone> = {
  low: 'neutral',
  normal: 'neutral',
  high: 'gold',
  urgent: 'danger',
};

export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  waiting: 'Waiting',
  closed: 'Closed',
};

export const CONVERSATION_STATUS_TONES: Record<string, ChipTone> = {
  open: 'success',
  waiting: 'gold',
  closed: 'neutral',
};

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  contract: 'Contract',
  agreement: 'Agreement',
  financial: 'Financial',
  brief: 'Brief',
  press: 'Press',
  other: 'Other',
};

export const DOCUMENT_VISIBILITY_LABELS: Record<string, string> = {
  private: 'Private',
  shared: 'Shared',
  management: 'Management only',
};

export const PROFILE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
};

export const PROFILE_STATUS_TONES: Record<string, ChipTone> = {
  pending: 'gold',
  active: 'success',
  suspended: 'danger',
};

export const EXPERIENCE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  full: 'Full',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const EXPERIENCE_STATUS_TONES: Record<string, ChipTone> = {
  draft: 'neutral',
  published: 'success',
  full: 'gold',
  cancelled: 'danger',
  completed: 'info',
};

export const STAFF_ROLE_KEYS = [
  'admin',
  'manager',
  'agent',
  'support',
  'finance',
  'content_manager',
] as const;

export const PERMISSION_LABELS: Record<string, string> = {
  '*': 'All permissions',
  'fans.read': 'View fans',
  'requests.manage': 'Manage requests',
  'messages.manage': 'Manage messages',
  'membership.manage': 'Manage memberships',
  'experience.manage': 'Manage experiences',
  'payments.manage': 'Verify payments',
  'content.manage': 'Manage CMS and media',
  'documents.manage': 'Manage documents',
  'tasks.manage': 'Manage tasks',
};

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function metricCountLabel(count: number): string {
  return count.toLocaleString('en-GB');
}
