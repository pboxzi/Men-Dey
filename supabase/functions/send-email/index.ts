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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { to, subject, html, from } = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Fetch Resend API key and sender email from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "resend_api_key")
      .single()

    const { data: senderSettings } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "resend_sender_email")
      .single()

    const { data: enabledSettings } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "email_notifications_enabled")
      .single()

    const resendApiKey = settings?.setting_value
    const senderEmail = senderSettings?.setting_value || "noreply@gillianandersonfan.com"
    const emailEnabled = enabledSettings?.setting_value !== "false"

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!emailEnabled) {
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || senderEmail,
        to: [to],
        subject,
        html,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData)
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Log the email in email_logs table
    await supabase.from("email_logs").insert({
      recipient_email: to,
      subject,
      body_preview: html.replace(/<[^>]*>/g, "").slice(0, 500),
      status: "sent",
      resend_id: resendData.id,
    })

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Email function error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
