import { supabase } from './supabase';

// ─── Notification Types ───
export type NotificationType =
  | 'message'
  | 'membership'
  | 'experience'
  | 'event'
  | 'reward'
  | 'announcement'
  | 'system'
  | 'status_change';

interface CreateNotificationOpts {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
  emailOverride?: string;
}

const SITE_URL = 'https://www.cmagency.me';

// ─── Base email shell — dark luxury theme ───
function baseTemplate(accent: string, title: string, body: string, ctaText?: string, ctaUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#050505;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

<tr><td style="padding:0 0 1px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px 16px 0 0;">
  <tr><td style="padding:28px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,${accent},#b8860b);text-align:center;line-height:40px;font-size:16px;font-weight:800;color:#050505;">GA</div></td>
      <td style="padding-left:14px;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#fff;letter-spacing:0.5px;">Gillian Anderson</p>
        <p style="margin:2px 0 0;font-size:10px;color:#666;letter-spacing:1.5px;text-transform:uppercase;">Fan Community</p>
      </td>
    </tr></table>
  </td></tr>
  </table>
</td></tr>

<tr><td style="height:2px;background:linear-gradient(90deg,${accent},transparent);"></td></tr>

<tr><td style="background:#0a0a0a;padding:44px 40px;">
  <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">${title}</h1>
  <div style="font-size:14px;line-height:1.8;color:#a0a0a0;">${body}</div>
  ${ctaText ? `<table cellpadding="0" cellspacing="0" style="margin:36px 0 0;"><tr><td style="background:linear-gradient(135deg,${accent},#b8860b);border-radius:8px;"><a href="${ctaUrl || SITE_URL}" style="display:inline-block;padding:14px 36px;font-size:12px;font-weight:700;color:#050505;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">${ctaText}</a></td></tr></table>` : ''}
</td></tr>

<tr><td style="background:#080808;padding:28px 40px;border-radius:0 0 16px 16px;border-top:1px solid #1a1a1a;">
  <p style="margin:0 0 8px;font-size:10px;color:#444;letter-spacing:1px;text-transform:uppercase;">The Gillian Anderson Community</p>
  <p style="margin:0;font-size:11px;color:#333;"><a href="${SITE_URL}" style="color:#d4a853;text-decoration:none;">Visit Portal</a> &nbsp;&bull;&nbsp; <a href="${SITE_URL}/portal?mode=login" style="color:#666;text-decoration:none;">Sign In</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

// ─── Notification card builder (for inline previews) ───
function infoCard(label: string, value: string, accent = '#d4a853'): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr><td style="padding:14px 20px;background:#111;border-radius:8px;border-left:3px solid ${accent};">
    <p style="margin:0 0 4px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">${label}</p>
    <p style="margin:0;font-size:15px;color:#fff;font-weight:600;">${value}</p>
  </td></tr></table>`;
}

function quoteBlock(text: string): string {
  return `<div style="padding:18px 22px;background:#111;border-left:3px solid #d4a853;border-radius:8px;margin:0 0 24px;">
    <p style="margin:0;font-size:14px;color:#ccc;line-height:1.7;">"${text}"</p>
  </div>`;
}

// ─── Send email via edge function ───
async function sendNotificationEmail(userId: string, subject: string, body: string, emailOverride?: string): Promise<void> {
  try {
    let email = emailOverride;
    if (!email) {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
      email = profile?.email;
    }
    if (!email) return;

    const { data: enabledSetting } = await supabase.from('site_settings').select('value').eq('key', 'email_notifications_enabled').maybeSingle();
    if (enabledSetting?.value === 'false') return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`, 'apikey': supabaseAnonKey },
      body: JSON.stringify({ to: email, subject, html: body }),
    });

    const result = await response.json();
    if (!response.ok) { console.error('Email error:', result); return; }

    await supabase.from('email_logs').insert({ user_id: userId, recipient_email: email, subject, body_preview: body.replace(/<[^>]*>/g, '').slice(0, 500), status: 'sent', resend_id: result.id || null });
    await supabase.from('notifications').update({ email_sent: true }).eq('user_id', userId).eq('title', subject).order('created_at', { ascending: false }).limit(1);
  } catch (e) { console.error('Email send failed:', e); }
}

// ─── Create a notification ───
export async function createNotification(opts: CreateNotificationOpts): Promise<void> {
  const { userId, type, title, message, link, data, sendEmail, emailSubject, emailBody, emailOverride } = opts;
  const { error } = await supabase.from('notifications').insert({ user_id: userId, type, title, message, link: link || null, data: data || {}, email_sent: false });
  if (error) { console.error('Failed to create notification:', error.message); return; }
  if (sendEmail && emailSubject && emailBody) {
    const wrapped = emailBody.includes('<!DOCTYPE') || emailBody.includes('background-color:#0f0f0f')
      ? emailBody
      : baseTemplate('#b8860b', emailSubject, emailBody);
    await sendNotificationEmail(userId, emailSubject, wrapped, emailOverride);
  }
}

// ─── Batch notify ───
export async function broadcastNotification(userIds: string[], type: NotificationType, title: string, message: string, sendEmail = false): Promise<void> {
  await supabase.from('notifications').insert(userIds.map(userId => ({ user_id: userId, type, title, message, data: {}, email_sent: false })));
  if (sendEmail) for (const userId of userIds) await sendNotificationEmail(userId, title, message);
}

// ═══════════════════════════════════════════════════════
//  EMAIL TEMPLATES — each with unique accent & feel
// ═══════════════════════════════════════════════════════

// ── 1. NEW MESSAGE (blue accent) ──
export async function notifyNewMessage(userId: string, senderName: string, preview: string) {
  return createNotification({
    userId, type: 'message',
    title: `New message from ${senderName}`,
    message: preview.slice(0, 200),
    sendEmail: true,
    emailSubject: `${senderName} sent you a message`,
    emailBody: baseTemplate(
      '#3b82f6',
      `${senderName} sent you a message`,
      `<p style="margin:0 0 20px;">You have a new message waiting for you.</p>
       ${quoteBlock(preview)}
       <p style="margin:0;font-size:13px;color:#666;">Log in to read the full message and reply.</p>`,
      'Read Message'
    ),
  });
}

// ── 2. MEMBERSHIP APPROVED (gold accent) ──
export async function notifyMembershipStatus(userId: string, status: string, tierName: string) {
  const isApproved = status === 'active';
  return createNotification({
    userId, type: 'membership',
    title: isApproved ? 'Membership Approved' : 'Membership Update',
    message: isApproved ? `Your ${tierName} membership has been approved.` : `Your membership status: ${status}.`,
    sendEmail: true,
    emailSubject: isApproved ? `Welcome to ${tierName} — You're In` : `Membership Status Update`,
    emailBody: baseTemplate(
      '#d4af37',
      isApproved ? `Welcome to ${tierName}` : 'Membership Update',
      isApproved
        ? `<p style="margin:0 0 20px;">Your <strong style="color:#d4af37;">${tierName}</strong> membership has been approved. You are now a verified member of the community.</p>
           ${infoCard('Tier', tierName)}
           ${infoCard('Status', 'Active', '#22c55e')}
           <p style="margin:20px 0 0;font-size:13px;color:#666;">Access your dashboard to view your membership card, track points, and explore exclusive benefits.</p>`
        : `<p style="margin:0 0 20px;">Your membership status has been updated.</p>
           ${infoCard('Status', status)}
           <p style="margin:20px 0 0;font-size:13px;color:#666;">If you have questions about your membership, reach out to our team.</p>`,
      'View Membership'
    ),
  });
}

// ── 3. EXPERIENCE STATUS (purple accent) ──
export async function notifyExperienceStatus(userId: string, status: string, experienceTitle: string) {
  const statusColor = status === 'confirmed' ? '#22c55e' : status === 'cancelled' ? '#ef4444' : '#d4af37';
  return createNotification({
    userId, type: 'experience',
    title: `Experience ${status}`,
    message: `Your request for "${experienceTitle}" has been ${status}.`,
    sendEmail: true,
    emailSubject: `Experience ${status.charAt(0).toUpperCase() + status.slice(1)} — ${experienceTitle}`,
    emailBody: baseTemplate(
      '#a855f7',
      `Experience ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `<p style="margin:0 0 20px;">Your experience request has been reviewed by our team.</p>
       ${infoCard('Experience', experienceTitle, '#a855f7')}
       ${infoCard('Status', status.toUpperCase(), statusColor)}
       <p style="margin:20px 0 0;font-size:13px;color:#666;">Log in to view full details, confirmed date, and next steps.</p>`,
      'View Experience'
    ),
  });
}

// ── 4. EVENT REGISTRATION (emerald accent) ──
export async function notifyEventRegistration(userId: string, eventTitle: string, ref: string) {
  return createNotification({
    userId, type: 'event',
    title: 'Event Registration Confirmed',
    message: `You're registered for "${eventTitle}". Reference: ${ref}`,
    sendEmail: true,
    emailSubject: `You're Registered — ${eventTitle}`,
    emailBody: baseTemplate(
      '#22c55e',
      `You're registered for ${eventTitle}`,
      `<p style="margin:0 0 20px;">Your spot has been reserved. We look forward to seeing you there.</p>
       ${infoCard('Event', eventTitle, '#22c55e')}
       ${infoCard('Reference', ref, '#22c55e')}
       <p style="margin:20px 0 0;font-size:13px;color:#666;">Save your reference number. Check your dashboard for event details, schedule, and location information.</p>`,
      'View Event Details'
    ),
  });
}

// ── 5. REWARD REDEEMED (amber accent, no email) ──
export async function notifyRewardRedeemed(userId: string, rewardTitle: string, cost: number) {
  return createNotification({
    userId, type: 'reward',
    title: 'Reward Redeemed',
    message: `You've redeemed "${rewardTitle}" for ${cost} points.`,
    sendEmail: false,
  });
}

// ── 6. ADMIN RESPONSE (blue accent) ──
export async function notifyAdminResponse(userId: string, adminName: string, preview: string) {
  return createNotification({
    userId, type: 'message',
    title: `${adminName} responded`,
    message: preview.slice(0, 200),
    sendEmail: true,
    emailSubject: `${adminName} replied to your message`,
    emailBody: baseTemplate(
      '#3b82f6',
      `${adminName} replied`,
      `<p style="margin:0 0 20px;">${adminName} has responded to your message:</p>
       ${quoteBlock(preview)}
       <p style="margin:0;font-size:13px;color:#666;">Continue the conversation in your portal.</p>`,
      'View Conversation'
    ),
  });
}

// ── 7. ANNOUNCEMENT (rose accent) ──
export async function notifyAnnouncement(userIds: string[], title: string, body: string) {
  await supabase.from('notifications').insert(userIds.map(userId => ({ user_id: userId, type: 'announcement' as NotificationType, title, message: body.slice(0, 500), data: {}, email_sent: false })));
  for (const userId of userIds) {
    await sendNotificationEmail(userId, title, baseTemplate(
      '#f43f5e',
      title,
      `${quoteBlock(body)}
       <p style="margin:0;font-size:13px;color:#666;">Log in to view the full announcement.</p>`,
      'View Announcement'
    ));
  }
}

// ── 8. NOTIFY ADMINS (in-app only, no email) ──
export async function notifyAdmins(type: NotificationType, title: string, message: string) {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (!admins || admins.length === 0) return;
  await supabase.from('notifications').insert(admins.map((admin: { id: string }) => ({ user_id: admin.id, type, title, message, data: {}, email_sent: false })));
}

// ─── Mark as read ───
export async function markNotificationRead(notificationId: string) {
  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', userId).eq('is_read', false);
}
