import type {LucideIcon} from 'lucide-react';
import {CalendarCheck, FileText, Inbox, Info, Sparkles, Ticket} from 'lucide-react';

import type {Notification} from '../types';

const ICONS: Record<Notification['type'], LucideIcon> = {
  info: Info,
  request: Inbox,
  membership: Ticket,
  experience: CalendarCheck,
  account: FileText,
  system: Sparkles,
};

export function notificationIcon(type: Notification['type']) {
  const Icon = ICONS[type] ?? Info;
  return <Icon className="size-4 shrink-0" aria-hidden />;
}
