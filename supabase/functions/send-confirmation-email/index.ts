import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// HTML escape utility — prevents XSS in user-supplied text
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email, userId, userName, country, city, howHeardAbout, favoriteThing } = await req.json()

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Clean up any existing tokens for this user
    const { error: deleteError } = await supabase.from("confirmation_tokens").delete().eq("user_id", userId)
    if (deleteError) {
      console.error("Token delete error:", JSON.stringify(deleteError))
      return new Response(
        JSON.stringify({ error: "Failed to clean up tokens", details: deleteError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Generate confirmation token
    const token = crypto.randomUUID().replace(/-/g, "")
    const { error: tokenError } = await supabase.from("confirmation_tokens").insert({
      user_id: userId,
      email,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user_name: userName || '',
      country: country || 'Global',
      city: city || '',
      how_heard_about: howHeardAbout || '',
      favorite_thing: favoriteThing || '',
    })

    if (tokenError) {
      console.error("Token insert error:", JSON.stringify(tokenError))
      return new Response(
        JSON.stringify({ error: "Failed to create confirmation token", details: tokenError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build confirmation URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.cmagency.me"
    const confirmUrl = `${siteUrl}/confirm-email?token=${token}`

    const displayName = esc(userName || email.split("@")[0])

    // Email template — dark luxury theme, consistent with notification emails
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Gillian Anderson Community</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header with brand -->
          <tr>
            <td style="padding:0 0 1px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:16px 16px 0 0;">
                <tr>
                  <td style="padding:28px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="width:40px;height:40px;border-radius:10px;background:#d4af37;background:linear-gradient(135deg,#d4af37,#b8860b);text-align:center;line-height:40px;font-size:16px;font-weight:800;color:#050505;">GA</div>
                        </td>
                        <td style="padding-left:14px;">
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;letter-spacing:0.5px;">Gillian Anderson</p>
                          <p style="margin:2px 0 0;font-size:10px;color:#666;letter-spacing:1.5px;text-transform:uppercase;">Fan Community</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent divider -->
          <tr>
            <td style="height:2px;background:#d4af37;background:linear-gradient(90deg,#d4af37,transparent);"></td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#0a0a0a;padding:44px 40px;">

              <!-- Title -->
              <h1 style="margin:0 0 24px;font-size:28px;font-weight:700;color:#fff;line-height:1.3;text-align:center;">
                Welcome, <span style="color:#d4af37;">${displayName}</span>
              </h1>

              <!-- Message -->
              <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#a0a0a0;">
                You've taken the first step into something extraordinary. The Gillian Anderson Community is a sanctuary for those who appreciate artistry, advocacy, and authentic connection.
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.8;color:#a0a0a0;">
                Confirm your email to unlock your portal and begin your journey.
              </p>

              <!-- CTA Button — solid fallback for Outlook -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background:#d4af37;background:linear-gradient(135deg,#d4af37,#b8860b);border-radius:8px;">
                    <a href="${confirmUrl}" style="display:inline-block;padding:16px 48px;font-size:14px;font-weight:700;color:#050505;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">
                      Confirm My Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="margin:32px 0 0;font-size:12px;color:#666;text-align:center;">
                This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#080808;padding:28px 40px;border-radius:0 0 16px 16px;border-top:1px solid #1a1a1a;">
              <p style="margin:0 0 8px;font-size:10px;color:#444;letter-spacing:1px;text-transform:uppercase;">The Gillian Anderson Community</p>
              <p style="margin:0;font-size:11px;color:#333;">
                <a href="${siteUrl}" style="color:#d4a853;text-decoration:none;">Visit Portal</a> &nbsp;&bull;&nbsp;
                <a href="${siteUrl}/portal?mode=login" style="color:#666;text-decoration:none;">Sign In</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // Send via Resend
    const senderEmail = "admin@cmagency.me"
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Gillian Anderson Community <${senderEmail}>`,
        to: [email],
        subject: "Confirm Your Email — Welcome to the Community",
        html,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error("Resend API error:", JSON.stringify(resendData))
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Log email
    try {
      await supabase.from("email_logs").insert({
        recipient_email: email,
        subject: "Confirm Your Email — Welcome to the Community",
        body_preview: `Welcome ${displayName}. Confirm your email to unlock your portal.`,
        status: "sent",
        resend_id: resendData.id,
      })
    } catch (logErr) {
      console.error("Email log failed (non-critical):", logErr)
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Send confirmation email error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
