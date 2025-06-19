import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-invite-secret",
  "Content-Type": "application/json",
};

serve(
  async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const secret = req.headers.get("x-invite-secret");
    if (secret !== Deno.env.get("EDGE_INVITE_SECRET")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    try {
      const { email, team_name, team_id } = await req.json();
      if (!email || !team_id || !team_name) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const inviteUrl = `https://marketmover.healthcraftcreative.com/signup?team=${team_id}`;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Market Mover <no-reply@marketmover.healthcraftcreative.com>",
          to: [email],
          subject: `You're invited to join ${team_name} on Market Mover`,
          html: `
            <p>You've been invited to join the <strong>${team_name}</strong> team on Market Mover.</p>
            <p>Click the link below to sign up:</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          `,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("❌ Resend error:", data);
        return new Response(JSON.stringify({ error: data.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      console.log("✅ Invitation email sent to:", email);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err) {
      console.log("💥 Unexpected error:", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
  { verifyJwt: false }
);
