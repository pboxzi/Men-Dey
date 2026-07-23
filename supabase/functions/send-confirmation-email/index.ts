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
    const { email, userId, userName } = await req.json()

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
    await supabase.from("confirmation_tokens").delete().eq("user_id", userId)

    // Generate confirmation token
    const token = crypto.randomUUID().replace(/-/g, "")
    const { error: tokenError } = await supabase.from("confirmation_tokens").insert({
      user_id: userId,
      email,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    if (tokenError) {
      console.error("Token insert error:", JSON.stringify(tokenError))
      return new Response(
        JSON.stringify({ error: "Failed to create confirmation token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build confirmation URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://gillian-anderson.com"
    const confirmUrl = `${siteUrl}/confirm-email?token=${token}`

    const displayName = userName || email.split("@")[0]

    // Beautiful email template
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Gillian Anderson Community</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#050505;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
          
          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);display:inline-block;line-height:60px;text-align:center;font-size:24px;color:#050505;font-weight:bold;">GA</div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;padding:48px 40px;">
              
              <!-- Title -->
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                    Welcome, <span style="color:#d4af37;">${displayName}</span>
                  </h1>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding-bottom:32px;">
                  <div style="height:1px;background:linear-gradient(90deg,transparent,#d4af37,transparent);"></div>
                </td>
              </tr>

              <!-- Message -->
              <tr>
                <td style="padding-bottom:40px;">
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#a0a0a0;">
                    You've taken the first step into something extraordinary. The Gillian Anderson Community is a sanctuary for those who appreciate artistry, advocacy, and authentic connection.
                  </p>
                  <p style="margin:0;font-size:15px;line-height:1.7;color:#a0a0a0;">
                    Confirm your email to unlock your portal and begin your journey.
                  </p>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center" style="padding-bottom:40px;">
                  <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);color:#050505;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:16px 48px;border-radius:8px;transition:all 0.3s ease;">
                    Confirm My Email
                  </a>
                </td>
              </tr>

              <!-- Expiry Notice -->
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <p style="margin:0;font-size:12px;color:#666666;">
                    This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
                  </p>
                </td>
              </tr>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:40px;">
              <p style="margin:0 0 8px;font-size:11px;color:#555555;letter-spacing:1px;text-transform:uppercase;">
                The Gillian Anderson Community
              </p>
              <p style="margin:0;font-size:11px;color:#444444;">
                A sanctuary for the curious soul
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
    const senderEmail = "no-reply@gillian-anderson.com"
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
