import type {AckRecord} from '../types';

const ACK_KEY = 'gam-acknowledgement';

export function getStoredAck(): AckRecord | null {
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AckRecord>;
    if (typeof parsed.version !== 'number' || typeof parsed.at !== 'string') return null;
    return {version: parsed.version, at: parsed.at};
  } catch {
    return null;
  }
}

export function storeAck(record: AckRecord): void {
  window.localStorage.setItem(ACK_KEY, JSON.stringify(record));
}

export function clearStoredAck(): void {
  window.localStorage.removeItem(ACK_KEY);
}
