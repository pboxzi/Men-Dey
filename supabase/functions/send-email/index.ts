// send-email · the single privileged email pipeline (Resend)
//
// Modes:
//   auth     — verification / welcome / password_reset, sent straight after
//              signup or from the forgot-password page. Rate limited server-side.
//   process  — delivers one queued row from public.email_logs. Called by the
//              database (pg_net) and by pg_cron retries; claims the row with an
//              optimistic status guard so a message can never send twice.
//
// RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY live only in function secrets.
// Every attempt (recipient, template, subject, provider ID, status, sent_at,
// error) is written to public.email_logs.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
const FROM = "Gillian Anderson Community <admin@cmagency.me>";

type TemplateKey =
  | "verification"
  | "welcome"
  | "password_reset"
  | "new_management_message"
  | "request_update"
  | "membership_offer"
  | "payment_request"
  | "payment_confirmation"
  | "membership_activation"
  | "experience_proposal"
  | "experience_confirmation"
  | "appointment_reminder";

const TEMPLATE_KEYS: TemplateKey[] = [
  "verification",
  "welcome",
  "password_reset",
  "new_management_message",
  "request_update",
  "membership_offer",
  "payment_request",
  "payment_confirmation",
  "membership_activation",
  "experience_proposal",
  "experience_confirmation",
  "appointment_reminder",
];

const AUTH_TEMPLATES: TemplateKey[] = ["verification", "welcome", "password_reset"];

type Params = Record<string, unknown>;

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function p(params: Params, key: string): string {
  const value = params[key];
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return new Date(value as string).toISOString().includes("T")
        ? new Date(value as string).toISOString().replace("T", " ").slice(0, 16) + " UTC"
        : JSON.stringify(value);
    } catch {
      return JSON.stringify(value);
    }
  }
  return String(value);
}

function layout(heading: string, paragraphs: string[], cta?: { href: string; label: string }): string {
  const body = paragraphs
    .filter((text) => text.trim().length > 0)
    .map((text) => `<p style="font-size:15px;line-height:1.75;color:#454139;margin:0 0 14px">${text}</p>`)
    .join("");
  const button = cta && cta.href
    ? `<p style="margin:22px 0 6px"><a href="${esc(cta.href)}" style="display:inline-block;background:#2b2b2b;color:#f7f4ef;padding:13px 26px;text-decoration:none;border-radius:3px;font-size:12px;letter-spacing:.14em;text-transform:uppercase">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f6f4f1;font-family:Georgia,'Times New Roman',serif;color:#2b2b2b">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px 40px">
    <div style="text-align:center;padding:18px 0 22px">
      <div style="font-size:13px;letter-spacing:.4em;text-transform:uppercase;color:#8a7a5c">Gillian Anderson</div>
      <div style="font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#a3a09a;margin-top:5px">Community · Management</div>
    </div>
    <div style="background:#ffffff;border:1px solid #e9e4dc;border-radius:6px;padding:30px 26px">
      <h1 style="font-size:21px;font-weight:normal;margin:0 0 18px;color:#2b2b2b">${esc(heading)}</h1>
      ${body}
      ${button}
    </div>
    <p style="font-size:11px;line-height:1.7;color:#a3a09a;text-align:center;margin-top:26px">
      You are receiving this because you have an account on the Gillian Anderson community platform.<br>
      This mailbox is not monitored — reply to management from your dashboard.
    </p>
  </div>
</body>
</html>`;
}

function buildEmail(template: TemplateKey, params: Params): { subject: string; html: string } {
  const name = p(params, "name") || "there";
  const link = p(params, "link");
  const title = p(params, "title");
  const body = p(params, "body");
  const amount = p(params, "amount");
  const currency = p(params, "currency");
  const price = amount ? `${amount} ${currency || ""}`.trim() : "";
  const customSubject = p(params, "email_subject");
  const snippet = body.length > 400 ? `${body.slice(0, 397)}…` : body;

  switch (template) {
    case "verification":
      return {
        subject: "Confirm your email address",
        html: layout("Confirm your email address", [
          `Hi ${name},`,
          "Please confirm your email address to finish setting up your account. This link can only be used once and expires after a short time.",
        ], { href: link || `${SITE_URL}/verify-email`, label: "Confirm email" }),
      };
    case "welcome":
      return {
        subject: "Welcome to the community",
        html: layout("Welcome, we are glad you are here", [
          `Hi ${name},`,
          "Your account is ready. Your requests, membership and experiences all live in your dashboard — and management is always one message away.",
          "Everything moves through management: offers, approvals, payments and scheduling. Nothing happens behind the scenes.",
        ], { href: link || `${SITE_URL}/dashboard`, label: "Open your dashboard" }),
      };
    case "password_reset":
      return {
        subject: "Reset your password",
        html: layout("Reset your password", [
          `Hi ${name},`,
          "We received a request to reset your password. Choose a new one below. If you did not request this, simply ignore this message — your password will not change.",
        ], { href: link, label: "Choose a new password" }),
      };
    case "new_management_message":
      return {
        subject: customSubject || "Management sent you a message",
        html: layout(customSubject || "Management sent you a message", [
          `Hi ${name},`,
          title ? `<strong>${esc(title)}</strong>` : "",
          snippet ? esc(snippet) : "",
          "Open the conversation to read the full message and reply.",
        ], { href: link, label: "Read the message" }),
      };
    case "request_update":
      return {
        subject: customSubject || "Update on your request",
        html: layout(customSubject || "Update on your request", [
          `Hi ${name},`,
          title ? `<strong>${esc(title)}</strong>` : "",
          body ? esc(body) : "",
        ], { href: link, label: "Open your request" }),
      };
    case "membership_offer":
      return {
        subject: customSubject || "A membership offer is waiting for you",
        html: layout(customSubject || "A membership offer is waiting for you", [
          `Hi ${name},`,
          "Management has prepared a membership offer for you — review the benefits and terms, then accept or decline from your dashboard.",
        ], { href: link, label: "Review the offer" }),
      };
    case "payment_request":
      return {
        subject: customSubject || "A payment is requested",
        html: layout(customSubject || "A payment is requested", [
          `Hi ${name},`,
          title ? `<strong>${esc(title)}</strong>` : "",
          price ? `Amount: <strong>${esc(price)}</strong>.` : "",
          "Management will confirm the accepted payment method with you. Never send card numbers through this platform.",
        ], { href: link, label: "Open the payment" }),
      };
    case "payment_confirmation":
      return {
        subject: customSubject || "We received your payment",
        html: layout("We received your payment", [
          `Hi ${name},`,
          price ? `We have received your payment of <strong>${esc(price)}</strong>.` : "We have received your payment.",
          "Management will verify it and update your account. You will see the change in your dashboard as soon as it is confirmed.",
        ], { href: link, label: "View your account" }),
      };
    case "membership_activation":
      return {
        subject: customSubject || "Your membership is active",
        html: layout("Your membership is active", [
          `Hi ${name},`,
          "Your membership has been activated and your membership card has been issued. It is ready to view in your dashboard.",
        ], { href: link, label: "View your card" }),
      };
    case "experience_proposal":
      return {
        subject: customSubject || "A proposal is waiting for you",
        html: layout("A proposal is waiting for you", [
          `Hi ${name},`,
          "Management has sent you a proposal with the dates, requirements and price. You can accept or decline it directly from your dashboard.",
        ], { href: link, label: "Review the proposal" }),
      };
    case "experience_confirmation":
      return {
        subject: customSubject || "Your experience is confirmed",
        html: layout("Your experience is confirmed", [
          `Hi ${name},`,
          "Management has confirmed your experience. Scheduling details will follow shortly and will appear in your dashboard.",
        ], { href: link, label: "Open your experience" }),
      };
    case "appointment_reminder": {
      const when = p(params, "starts_at");
      const tz = p(params, "timezone") || "UTC";
      const appt = p(params, "appointment_title") || title;
      return {
        subject: customSubject || "Your appointment is coming up",
        html: layout("Your appointment is coming up", [
          `Hi ${name},`,
          appt ? `<strong>${esc(appt)}</strong>` : "",
          when ? `Starts: ${esc(when)} (${esc(tz)}).` : "",
          "The meeting details are in your dashboard. If anything has changed, message management from there.",
        ], { href: link, label: "Open your dashboard" }),
      };
    }
    default:
      throw new Error("unknown template");
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(status: number, code: string, message: string): Response {
  return json(status, { error: { code, message } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "method_not_allowed", "Use POST.");

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return fail(400, "invalid_request", "The request body must be JSON.");
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("send-email: RESEND_API_KEY is not configured");
    return fail(500, "email_not_configured", "Email is not configured. Please try again later.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function sendResend(to: string, subject: string, html: string): Promise<{ id?: string; error?: string }> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("send-email: resend error", response.status, JSON.stringify(data));
      return { error: (data as { message?: string }).message ?? `resend ${response.status}` };
    }
    return { id: (data as { id?: string }).id };
  }

  async function withinLimit(bucket: string, key: string, max: number, windowSeconds: number): Promise<boolean> {
    const { data, error } = await db.rpc("rate_limit", {
      p_bucket: bucket,
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("send-email: rate_limit rpc failed", error.message);
      return true; // do not block legitimate mail when the limiter is unavailable
    }
    return data === true;
  }

  // ------------------------------------------------------------ auth mode
  if (payload.mode === "auth") {
    const template = String(payload.template ?? "") as TemplateKey;
    const email = String(payload.email ?? "").trim().toLowerCase();

    if (!AUTH_TEMPLATES.includes(template)) {
      return fail(400, "invalid_template", "That email template cannot be requested directly.");
    }
    if (!EMAIL_RE.test(email)) {
      return fail(400, "invalid_request", "Enter a valid email address.");
    }

    const perEmail = await withinLimit("email_auth", `${template}:${email}`, 3, 900);
    const overall = await withinLimit("email_auth_global", "all", 60, 3600);
    if (!perEmail || !overall) {
      return fail(429, "rate_limited", "Too many emails requested. Please wait a few minutes and try again.");
    }

    let actionLink = `${SITE_URL}/dashboard`;
    if (template === "password_reset" || template === "verification") {
      try {
        const kind = template === "password_reset" ? "recovery" : "signup";
        const { data, error } = await db.auth.admin.generateLink({
          type: kind,
          email,
          options: {
            emailRedirectTo: template === "password_reset"
              ? `${SITE_URL}/reset-password`
              : `${SITE_URL}/verify-email`,
          },
        });
        if (error) throw new Error(error.message);
        const hashed = data?.properties?.hashed_token;
        if (!hashed) throw new Error("no token in link response");
        actionLink = template === "password_reset"
          ? `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(hashed)}&type=recovery`
          : `${SITE_URL}/verify-email?token_hash=${encodeURIComponent(hashed)}&type=signup`;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (template === "password_reset") {
          // unknown address: answer identically to avoid account enumeration
          console.error("send-email: generateLink failed", message);
          return json(200, { ok: true });
        }
        if (/already/i.test(message)) {
          // already confirmed: the welcome path still works
          actionLink = `${SITE_URL}/verify-email`;
        } else {
          console.error("send-email: generateLink failed", message);
          return fail(500, "send_failed", "We could not create your link right now. Please try again.");
        }
      }
    }

    const { subject, html } = buildEmail(template, {
      name: String(payload.name ?? ""),
      link: actionLink,
    });

    const { data: logRow, error: insertError } = await db
      .from("email_logs")
      .insert({
        user_id: typeof payload.user_id === "string" && UUID_RE.test(payload.user_id)
          ? payload.user_id
          : null,
        recipient: email,
        template,
        subject,
        params: { link: actionLink, source: "auth" },
        status: "queued",
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (insertError) {
      console.error("send-email: log insert failed", insertError.message);
      return fail(500, "send_failed", "We could not send that email right now. Please try again.");
    }

    const result = await sendResend(email, subject, html);
    if (result.error) {
      await db
        .from("email_logs")
        .update({ status: "failed", error: result.error.slice(0, 500) })
        .eq("id", logRow.id);
      return fail(502, "send_failed", "We could not send that email right now. Please try again later.");
    }

    await db
      .from("email_logs")
      .update({
        status: "sent",
        provider_id: result.id ?? null,
        error: null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", logRow.id);

    return json(200, { ok: true, id: logRow.id, provider_id: result.id ?? null });
  }

  // ---------------------------------------------------------- process mode
  if (payload.mode === "process") {
    const logId = String(payload.log_id ?? "");
    if (!UUID_RE.test(logId)) {
      return fail(400, "invalid_request", "log_id must be a UUID.");
    }

    // optimistic claim: only one caller can move queued → sending
    const { data: claimed, error: claimError } = await db
      .from("email_logs")
      .update({ status: "sending" })
      .eq("id", logId)
      .in("status", ["queued", "failed"])
      .lt("attempts", 5)
      .select("*")
      .maybeSingle();

    if (claimError) {
      console.error("send-email: claim failed", claimError.message);
      return fail(500, "send_failed", "Delivery could not be claimed.");
    }
    if (!claimed) {
      return json(200, { ok: true, skipped: true });
    }

    // attempts increment happens on claim (single UPDATE, no race window)
    await db.from("email_logs").update({ attempts: (claimed.attempts ?? 0) + 1 }).eq("id", logId);

    const template = claimed.template as TemplateKey;
    if (!TEMPLATE_KEYS.includes(template)) {
      await db
        .from("email_logs")
        .update({ status: "failed", error: `unknown template: ${String(claimed.template).slice(0, 80)}` })
        .eq("id", logId);
      return fail(400, "invalid_template", "Queued email references an unknown template.");
    }

    let subject: string;
    let html: string;
    try {
      const built = buildEmail(template, (claimed.params ?? {}) as Params);
      subject = built.subject;
      html = built.html;
    } catch {
      await db
        .from("email_logs")
        .update({ status: "failed", error: "template render failed" })
        .eq("id", logId);
      return fail(400, "invalid_template", "That email template could not be rendered.");
    }

    const result = await sendResend(claimed.recipient, subject, html);
    if (result.error) {
      await db
        .from("email_logs")
        .update({ status: "failed", error: result.error.slice(0, 500) })
        .eq("id", logId);
      return fail(502, "send_failed", "The email provider rejected this message.");
    }

    await db
      .from("email_logs")
      .update({
        status: "sent",
        provider_id: result.id ?? null,
        subject,
        error: null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", logId);

    return json(200, { ok: true, id: logId, provider_id: result.id ?? null });
  }

  return fail(400, "invalid_request", "mode must be 'auth' or 'process'.");
});
