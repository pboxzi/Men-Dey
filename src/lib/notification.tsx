import type {LucideIcon} from 'lucide-react';
import {
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CreditCard,
  FileDown,
  FileText,
  HelpCircle,
  Inbox,
  Info,
  Megaphone,
  MessageSquare,
  Receipt,
  Sparkles,
  Ticket,
  UserCheck,
} from 'lucide-react';

import type {Notification} from '../types';

const ICONS: Record<Notification['type'], LucideIcon> = {
  new_message: MessageSquare,
  request_update: Inbox,
  information_required: HelpCircle,
  membership_offer: Ticket,
  membership_accepted: UserCheck,
  payment_requested: CreditCard,
  payment_received: Receipt,
  membership_activated: BadgeCheck,
  experience_proposal: FileText,
  experience_confirmed: CalendarCheck,
  experience_scheduled: CalendarClock,
  experience_cancelled: CalendarX,
  document_uploaded: FileDown,
  management_announcement: Megaphone,
  system: Sparkles,
  info: Info,
  request: Inbox,
  membership: Ticket,
  experience: CalendarCheck,
  account: FileText,
};

export function notificationIcon(type: Notification['type']) {
  const Icon = ICONS[type] ?? Info;
  return <Icon className="size-4 shrink-0" aria-hidden />;
}

const LABELS: Record<Notification['type'], string> = {
  new_message: 'New message',
  request_update: 'Request update',
  information_required: 'Information needed',
  membership_offer: 'Membership offer',
  membership_accepted: 'Offer accepted',
  payment_requested: 'Payment requested',
  payment_received: 'Payment received',
  membership_activated: 'Membership active',
  experience_proposal: 'Proposal',
  experience_confirmed: 'Experience confirmed',
  experience_scheduled: 'Scheduled',
  experience_cancelled: 'Cancelled',
  document_uploaded: 'Document uploaded',
  management_announcement: 'Announcement',
  system: 'Platform',
  info: 'Information',
  request: 'Request',
  membership: 'Membership',
  experience: 'Experience',
  account: 'Account',
};

export function notificationTypeLabel(type: Notification['type']): string {
  return LABELS[type] ?? 'Notification';
}
