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

// ─── Create a notification ───
export async function createNotification(opts: CreateNotificationOpts): Promise<void> {
  const { userId, type, title, message, link, data, sendEmail, emailSubject, emailBody } = opts;

  // Insert notification
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

  // Send email if requested
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

  // TODO: batch email via Resend API
}

// ─── Send email via Resend ───
async function sendNotificationEmail(userId: string, subject: string, body: string): Promise<void> {
  try {
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.email) return;

    // Get Resend API key from settings
    const { data: keyData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'resend_api_key')
      .maybeSingle();

    if (!keyData?.value) {
      console.warn('No Resend API key configured');
      return;
    }

    // Get sender email from settings
    const { data: senderData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'resend_sender_email')
      .maybeSingle();

    const senderEmail = senderData?.value || 'notifications@gilliananderson.com';

    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyData.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [profile.email],
        subject,
        html: body,
      }),
    });

    const result = await response.json();

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_to: profile.email,
      subject,
      body,
      status: response.ok ? 'sent' : 'failed',
      resend_id: result.id || null,
      error: response.ok ? null : result.message || 'Unknown error',
    });

    // Mark notification as email_sent
    if (response.ok) {
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('user_id', userId)
        .eq('title', subject)
        .order('created_at', { ascending: false })
        .limit(1);
    }
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
    emailSubject: `New message from ${senderName}`,
    emailBody: `<p>You have a new message from <strong>${senderName}</strong>:</p><p>${preview}</p><p><a href="${window.location.origin}">View in portal</a></p>`,
  });
}

export async function notifyMembershipStatus(userId: string, status: string, tierName: string) {
  const isApproved = status === 'active';
  return createNotification({
    userId,
    type: 'membership',
    title: isApproved ? 'Membership Approved' : 'Membership Update',
    message: isApproved
      ? `Your ${tierName} membership has been approved! Welcome to the sanctuary.`
      : `Your membership application status has been updated to: ${status}.`,
    sendEmail: true,
    emailSubject: isApproved ? `Welcome to ${tierName}!` : 'Membership Status Update',
    emailBody: `<p>Your <strong>${tierName}</strong> membership has been <strong>${status}</strong>.</p><p><a href="${window.location.origin}">View your membership</a></p>`,
  });
}

export async function notifyExperienceStatus(userId: string, status: string, experienceTitle: string) {
  return createNotification({
    userId,
    type: 'experience',
    title: `Experience ${status}`,
    message: `Your request for "${experienceTitle}" has been ${status}.`,
    sendEmail: true,
    emailSubject: `Experience Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    emailBody: `<p>Your experience request for <strong>${experienceTitle}</strong> has been <strong>${status}</strong>.</p><p><a href="${window.location.origin}">View details</a></p>`,
  });
}

export async function notifyEventRegistration(userId: string, eventTitle: string, ref: string) {
  return createNotification({
    userId,
    type: 'event',
    title: 'Event Registration Confirmed',
    message: `You're registered for "${eventTitle}". Reference: ${ref}`,
    sendEmail: true,
    emailSubject: `Registration Confirmed: ${eventTitle}`,
    emailBody: `<p>You're registered for <strong>${eventTitle}</strong>.</p><p>Reference: <code>${ref}</code></p><p><a href="${window.location.origin}">View event details</a></p>`,
  });
}

export async function notifyRewardRedeemed(userId: string, rewardTitle: string, cost: number) {
  return createNotification({
    userId,
    type: 'reward',
    title: 'Reward Redeemed',
    message: `You've redeemed "${rewardTitle}" for ${cost} points. Check your badges!`,
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
    emailSubject: `${adminName} replied to your message`,
    emailBody: `<p><strong>${adminName}</strong> has responded to your message:</p><blockquote>${preview}</blockquote><p><a href="${window.location.origin}">View conversation</a></p>`,
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
