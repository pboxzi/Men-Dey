import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("confirmation_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired confirmation link" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Check expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This confirmation link has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Confirm the user in Supabase Auth
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    )

    if (confirmError) {
      console.error("Confirm user error:", JSON.stringify(confirmError))
      return new Response(
        JSON.stringify({ error: "Failed to confirm account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Fetch user metadata to get name for profile creation
    const { data: userData } = await supabase.auth.admin.getUserById(tokenData.user_id)
    const userName = tokenData.user_name || userData?.user?.user_metadata?.name || tokenData.email.split("@")[0]

    // Create or update profile now that email is confirmed
    // Uses upsert because: old users may already have a profile from the trigger (before removal)
    // new users won't have one yet — upsert handles both cases
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: tokenData.user_id,
      name: userName,
      email: tokenData.email,
      country: tokenData.country || 'Global',
      city: tokenData.city || '',
      how_heard_about: tokenData.how_heard_about || '',
      favorite_thing: tokenData.favorite_thing || '',
      role: "user",
    }, { onConflict: 'id' })
    if (profileError) {
      console.error("Profile creation error:", JSON.stringify(profileError))
      return new Response(
        JSON.stringify({ error: "Failed to create profile", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Mark token as used
    await supabase
      .from("confirmation_tokens")
      .update({ used: true })
      .eq("id", tokenData.id)

    // Send welcome message 30 seconds after confirmation (fire-and-forget)
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.cmagency.me"
    const displayName = userName || tokenData.email.split("@")[0]

    setTimeout(async () => {
      try {
        const freshSupabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Create in-app notification
        await freshSupabase.from("notifications").insert({
          user_id: tokenData.user_id,
          type: "system",
          title: "Welcome to the Community",
          message: `Welcome ${displayName}! Your account is confirmed. Explore your portal, join the community, and start your journey.`,
          data: {},
          email_sent: false,
        })

        // 2. Send welcome email via Resend
        if (resendApiKey) {
          const senderEmail = "admin@cmagency.me"
          const welcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#050505;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td align="center" style="padding-bottom:40px;">
        <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);display:inline-block;line-height:60px;text-align:center;font-size:24px;color:#050505;font-weight:bold;">GA</div>
      </td></tr>

      <!-- Main card -->
      <tr><td style="background-color:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;padding:48px 40px;">

        <!-- Title -->
        <tr><td align="center" style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
            Welcome, <span style="color:#d4af37;">${displayName}</span>
          </h1>
        </td></tr>

        <!-- Subtitle -->
        <tr><td align="center" style="padding-bottom:32px;">
          <p style="margin:0;font-size:13px;color:#888;font-style:italic;letter-spacing:0.5px;">
            "A sanctuary for the curious soul"
          </p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding-bottom:32px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>
        </td></tr>

        <!-- Opening -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c0c0c0;">
            You're in. Your account is confirmed and you now have full access to the Gillian Anderson Community — a curated space built for those who appreciate artistry, advocacy, and authentic connection.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#c0c0c0;">
            Here's what's waiting for you inside:
          </p>
        </td></tr>

        <!-- Benefits — Experiences -->
        <tr><td style="padding-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 6px;font-size:11px;color:#d4af37;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Exclusive Experiences</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a0a0a0;">
                Book private sessions, one-on-one meetings, and special encounters with Gillian. These are limited, personal, and unlike anything available elsewhere. Spots fill fast.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Benefits — Events -->
        <tr><td style="padding-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 6px;font-size:11px;color:#d4af37;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Members-Only Events</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a0a0a0;">
                Join live Q&A sessions, intimate watch parties, and exclusive celebrations. Connect with Gillian and fellow fans in real time — these events are never recorded.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Benefits — Community -->
        <tr><td style="padding-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 6px;font-size:11px;color:#d4af37;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Community Hub</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a0a0a0;">
                Share stories, post photos, and connect with passionate fans from around the world. Your voice matters here — this is your space to belong.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Benefits — Membership -->
        <tr><td style="padding-bottom:32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 6px;font-size:11px;color:#d4af37;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Membership Tiers</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#a0a0a0;">
                Upgrade to unlock priority booking, early event access, a custom membership card, and direct communication channels. Choose the tier that fits you — each one comes with exclusive perks.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding-bottom:32px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#333,transparent);"></div>
        </td></tr>

        <!-- Quick start -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0 0 12px;font-size:11px;color:#d4af37;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Your First Steps</p>
          <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.6;">
            <span style="color:#fff;font-weight:600;">1.</span>&nbsp; Explore available Experiences and request one that speaks to you
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.6;">
            <span style="color:#fff;font-weight:600;">2.</span>&nbsp; Check upcoming Events and secure your spot before they fill
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.6;">
            <span style="color:#fff;font-weight:600;">3.</span>&nbsp; Upgrade your membership to unlock the full experience
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${siteUrl}/portal" style="display:inline-block;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);color:#050505;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:16px 48px;border-radius:8px;">
            Enter Your Portal
          </a>
        </td></tr>

        <!-- Scarcity note -->
        <tr><td align="center">
          <p style="margin:0;font-size:11px;color:#666;line-height:1.5;">
            Experiences have limited availability. Events fill quickly. The sooner you explore, the more options you'll have.
          </p>
        </td></tr>

      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding-top:40px;">
        <p style="margin:0 0 8px;font-size:11px;color:#555555;letter-spacing:1px;text-transform:uppercase;">
          The Gillian Anderson Community
        </p>
        <p style="margin:0;font-size:11px;color:#444444;">
          A sanctuary for the curious soul
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `Gillian Anderson Community <${senderEmail}>`,
              to: [tokenData.email],
              subject: "Welcome to the Community — You Are In",
              html: welcomeHtml,
            }),
          })

          const resendData = await resendResponse.json()

          // Log email
          if (resendResponse.ok) {
            await freshSupabase.from("email_logs").insert({
              recipient_email: tokenData.email,
              subject: "Welcome to the Community — You Are In",
              body_preview: `Welcome ${displayName}. Your account is confirmed.`,
              status: "sent",
              resend_id: resendData.id,
            })
          }
        }

        console.log(`Welcome message sent to ${tokenData.email}`)
      } catch (welcomeErr) {
        console.error("Welcome message error (non-critical):", welcomeErr)
      }
    }, 30_000)

    return new Response(
      JSON.stringify({ success: true, email: tokenData.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Confirm email error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
