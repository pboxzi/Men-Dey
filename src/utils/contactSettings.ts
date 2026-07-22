import { supabase } from './supabase';

// Cache for contact settings
let cachedSettings: { whatsapp: string; email: string } | null = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getContactSettings(): Promise<{ whatsapp: string; email: string }> {
  const now = Date.now();
  if (cachedSettings && now - lastFetch < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['contact_whatsapp', 'contact_email']);

    if (data) {
      const whatsapp = data.find(s => s.key === 'contact_whatsapp')?.value || '+447700900000';
      const email = data.find(s => s.key === 'contact_email')?.value || 'contact@gilliananderson.com';
      cachedSettings = { whatsapp, email };
      lastFetch = now;
      return cachedSettings;
    }
  } catch (e) {
    console.error('Failed to fetch contact settings:', e);
  }

  return cachedSettings || { whatsapp: '+447700900000', email: 'contact@gilliananderson.com' };
}

export async function getWhatsAppNumber(): Promise<string> {
  const settings = await getContactSettings();
  return settings.whatsapp;
}

export async function getContactEmail(): Promise<string> {
  const settings = await getContactSettings();
  return settings.email;
}

// Helper to clean WhatsApp number for wa.me link
export function cleanWhatsAppNumber(number: string): string {
  return number.replace(/[^0-9]/g, '');
}

// Helper to open WhatsApp with pre-filled message
export async function openWhatsApp(message: string, number?: string): Promise<void> {
  const waNumber = number || await getWhatsAppNumber();
  const clean = cleanWhatsAppNumber(waNumber);
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
}

// Helper to open email with pre-filled subject and body
export async function openEmail(subject: string, body: string, email?: string): Promise<void> {
  const to = email || await getContactEmail();
  window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}
