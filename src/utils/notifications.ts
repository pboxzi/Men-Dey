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
}

// ─── Professional Email Template ───
function emailTemplate(title: string, content: string, ctaText?: string): string {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://men-dey.vercel.app';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="padding:32px 40px;background-color:#111111;border-radius:12px 12px 0 0;">
  <h1 style="margin:0;font-size:20px;font-weight:700;color:#d4a853;letter-spacing:1px;">MEN-DEY</h1>
  <p style="margin:4px 0 0;font-size:12px;color:#666;letter-spacing:0.5px;">GILLIAN ANDERSON FAN COMMUNITY</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;background-color:#111111;">
  <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#ffffff;">${title}</h2>
  <div style="font-size:14px;line-height:1.7;color:#cccccc;">${content}</div>
  ${ctaText ? `
  <table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
  <tr><td style="background-color:#d4a853;border-radius:8px;">
    <a href="${siteUrl}" style="display:inline-block;padding:14px 32px;font-size:13px;font-weight:600;color:#0a0a0a;text-decoration:none;letter-spacing:0.5px;">${ctaText}</a>
  </td></tr>
  </table>` : ''}
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;background-color:#0d0d0d;border-radius:0 0 12px 12px;border-top:1px solid #1a1a1a;">
  <p style="margin:0;font-size:11px;color:#555;line-height:1.6;">
    This is a transactional email regarding your account activity.<br>
    <a href="${siteUrl}" style="color:#d4a853;text-decoration:none;">Visit Men-Dey</a> &nbsp;|&nbsp;
    <a href="${siteUrl}/settings" style="color:#888;text-decoration:none;">Email Preferences</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Create a notification ───
export async function createNotification(opts: CreateNotificationOpts): Promise<void> {
  const { userId, type, title, message, link, data, sendEmail, emailSubject, emailBody } = opts;

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
    data: data || {},
    email_sent: false,
  });

  if (error) {
    console.error('Failed to create notification:', error.message);
    return;
  }

  if (sendEmail && emailSubject && emailBody) {
    await sendNotificationEmail(userId, emailSubject, emailBody);
  }
}

// ─── Batch notify multiple users ───
export async function broadcastNotification(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  sendEmail = false
): Promise<void> {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    type,
    title,
    message,
    data: {},
    email_sent: false,
  }));

  await supabase.from('notifications').insert(notifications);

  if (sendEmail) {
    for (const userId of userIds) {
      await sendNotificationEmail(userId, title, message);
    }
  }
}

// ─── Send email via Supabase Edge Function (Resend API) ───
async function sendNotificationEmail(userId: string, subject: string, body: string): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.email) {
      console.warn('No email found for user:', userId);
      return;
    }

    const { data: enabledSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'email_notifications_enabled')
      .maybeSingle();

    if (enabledSetting?.value === 'false') {
      console.log('Email notifications disabled');
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmhndjdxvxtozeyesvsy.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        to: profile.email,
        subject,
        html: body,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Edge Function email error:', result);
      return;
    }

    await supabase.from('email_logs').insert({
      user_id: userId,
      recipient_email: profile.email,
      subject,
      body_preview: body.replace(/<[^>]*>/g, '').slice(0, 500),
      status: 'sent',
      resend_id: result.id || null,
    });

    await supabase
      .from('notifications')
      .update({ email_sent: true })
      .eq('user_id', userId)
      .eq('title', subject)
      .order('created_at', { ascending: false })
      .limit(1);
  } catch (e) {
    console.error('Email send failed:', e);
  }
}

// ─── Convenience functions for common triggers ───

export async function notifyNewMessage(userId: string, senderName: string, preview: string) {
  return createNotification({
    userId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: preview.slice(0, 200),
    sendEmail: true,
    emailSubject: `New Message from ${senderName}`,
    emailBody: emailTemplate(
      `New Message from ${senderName}`,
      `<p style="margin:0 0 16px;">You have received a new message:</p>
       <div style="padding:16px 20px;background-color:#1a1a1a;border-left:3px solid #d4a853;border-radius:4px;margin:0 0 24px;">
         <p style="margin:0;font-size:14px;color:#cccccc;">${preview}</p>
       </div>
       <p style="margin:0;font-size:13px;color:#888;">Log in to your account to view the full conversation and respond.</p>`,
      'View Message'
    ),
  });
}

export async function notifyMembershipStatus(userId: string, status: string, tierName: string) {
  const isApproved = status === 'active';
  return createNotification({
    userId,
    type: 'membership',
    title: isApproved ? 'Membership Approved' : 'Membership Update',
    message: isApproved
      ? `Your ${tierName} membership has been approved.`
      : `Your membership status has been updated to: ${status}.`,
    sendEmail: true,
    emailSubject: isApproved ? `Welcome to ${tierName} — Membership Approved` : `Membership Status Update`,
    emailBody: emailTemplate(
      isApproved ? 'Membership Approved' : 'Membership Status Update',
      isApproved
        ? `<p style="margin:0 0 16px;">Your <strong style="color:#d4a853;">${tierName}</strong> membership has been approved.</p>
           <p style="margin:0 0 16px;">You now have full access to all ${tierName} tier benefits. Welcome to the community.</p>
           <p style="margin:0;font-size:13px;color:#888;">You can view your membership details and card in your dashboard.</p>`
        : `<p style="margin:0 0 16px;">Your membership status has been updated.</p>
           <p style="margin:0 0 16px;"><strong>Status:</strong> ${status}</p>
           <p style="margin:0;font-size:13px;color:#888;">If you have questions, please contact support.</p>`,
      'View Membership'
    ),
  });
}

export async function notifyExperienceStatus(userId: string, status: string, experienceTitle: string) {
  return createNotification({
    userId,
    type: 'experience',
    title: `Experience ${status}`,
    message: `Your request for "${experienceTitle}" has been ${status}.`,
    sendEmail: true,
    emailSubject: `Experience Request — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    emailBody: emailTemplate(
      `Experience Request — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `<p style="margin:0 0 16px;">Your experience request has been reviewed.</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
         <tr><td style="padding:12px 16px;background-color:#1a1a1a;border-radius:4px;">
           <p style="margin:0;font-size:12px;color:#888;">Experience</p>
           <p style="margin:4px 0 0;font-size:14px;color:#fff;font-weight:600;">${experienceTitle}</p>
         </td></tr>
         <tr><td style="padding:8px 16px;background-color:#1a1a1a;border-radius:4px;margin-top:2px;">
           <p style="margin:0;font-size:12px;color:#888;">Status</p>
           <p style="margin:4px 0 0;font-size:14px;color:#d4a853;font-weight:600;">${status.toUpperCase()}</p>
         </td></tr>
       </table>
       <p style="margin:0;font-size:13px;color:#888;">Log in to view full details and any updates from the team.</p>`,
      'View Experience'
    ),
  });
}

export async function notifyEventRegistration(userId: string, eventTitle: string, ref: string) {
  return createNotification({
    userId,
    type: 'event',
    title: 'Event Registration Confirmed',
    message: `You're registered for "${eventTitle}". Reference: ${ref}`,
    sendEmail: true,
    emailSubject: `Registration Confirmed — ${eventTitle}`,
    emailBody: emailTemplate(
      `Registration Confirmed`,
      `<p style="margin:0 0 16px;">Your registration has been confirmed.</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
         <tr><td style="padding:12px 16px;background-color:#1a1a1a;border-radius:4px;">
           <p style="margin:0;font-size:12px;color:#888;">Event</p>
           <p style="margin:4px 0 0;font-size:14px;color:#fff;font-weight:600;">${eventTitle}</p>
         </td></tr>
         <tr><td style="padding:8px 16px;background-color:#1a1a1a;border-radius:4px;margin-top:2px;">
           <p style="margin:0;font-size:12px;color:#888;">Reference</p>
           <p style="margin:4px 0 0;font-size:14px;color:#d4a853;font-weight:600;font-family:monospace;">${ref}</p>
         </td></tr>
       </table>
       <p style="margin:0;font-size:13px;color:#888;">Please save your reference number. Log in for event details, location, and scheduling information.</p>`,
      'View Event Details'
    ),
  });
}

export async function notifyRewardRedeemed(userId: string, rewardTitle: string, cost: number) {
  return createNotification({
    userId,
    type: 'reward',
    title: 'Reward Redeemed',
    message: `You've redeemed "${rewardTitle}" for ${cost} points.`,
    sendEmail: false,
  });
}

export async function notifyAdminResponse(userId: string, adminName: string, preview: string) {
  return createNotification({
    userId,
    type: 'message',
    title: `${adminName} responded`,
    message: preview.slice(0, 200),
    sendEmail: true,
    emailSubject: `${adminName} Has Responded to Your Message`,
    emailBody: emailTemplate(
      `${adminName} Has Responded`,
      `<p style="margin:0 0 16px;">${adminName} has replied to your message:</p>
       <div style="padding:16px 20px;background-color:#1a1a1a;border-left:3px solid #d4a853;border-radius:4px;margin:0 0 24px;">
         <p style="margin:0;font-size:14px;color:#cccccc;">${preview}</p>
       </div>
       <p style="margin:0;font-size:13px;color:#888;">Log in to continue the conversation.</p>`,
      'View Conversation'
    ),
  });
}

export async function notifyAnnouncement(userIds: string[], title: string, body: string) {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    type: 'announcement' as NotificationType,
    title,
    message: body.slice(0, 500),
    data: {},
    email_sent: false,
  }));

  await supabase.from('notifications').insert(notifications);

  for (const userId of userIds) {
    await sendNotificationEmail(userId, title, emailTemplate(
      title,
      `<div style="padding:16px 20px;background-color:#1a1a1a;border-left:3px solid #d4a853;border-radius:4px;margin:0 0 24px;">
         <p style="margin:0;font-size:14px;color:#cccccc;">${body}</p>
       </div>
       <p style="margin:0;font-size:13px;color:#888;">Log in to view the full announcement and any attachments.</p>`,
      'View Announcement'
    ));
  }
}

// ─── Notify admin of fan action (finds admin users) ───
export async function notifyAdmins(type: NotificationType, title: string, message: string) {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (!admins || admins.length === 0) return;

  const notifications = admins.map((admin: { id: string }) => ({
    user_id: admin.id,
    type,
    title,
    message,
    data: {},
    email_sent: false,
  }));

  await supabase.from('notifications').insert(notifications);
}

// ─── Mark as read ───
export async function markNotificationRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

// ─── Mark all as read for a user ───
export async function markAllNotificationsRead(userId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
}
