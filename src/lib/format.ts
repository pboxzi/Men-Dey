export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = formatDate(iso);
  const time = formatTime(iso);
  return date && time ? `${date} · ${time}` : date || time;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const table: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
  ];
  const fmt = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});
  if (abs < 60) return 'just now';
  let unit: Intl.RelativeTimeFormatUnit = 'year';
  let divisor = 31557600;
  let prev = 1;
  for (const [limit, u] of table) {
    if (abs < limit) {
      unit = u;
      divisor = prev;
      break;
    }
    prev = limit;
  }
  return fmt.format(Math.round(seconds / divisor), unit);
}

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
