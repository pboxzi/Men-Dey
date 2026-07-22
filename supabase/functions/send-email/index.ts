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
    const { to, subject, html, from } = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get Resend API key from env (Supabase secret)
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured as Supabase secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const senderEmail = from || "notifications@cmagency.me"

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [to],
        subject,
        html,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error("Resend API error:", JSON.stringify(resendData))
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Try to log the email (non-critical)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      await supabase.from("email_logs").insert({
        recipient_email: to,
        subject,
        body_preview: html.replace(/<[^>]*>/g, "").slice(0, 500),
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
    console.error("Email function error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
