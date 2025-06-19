// supabase/functions/invite_user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, x-invite-secret",
  "Content-Type": "application/json",
};

serve(async (req) => {
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
    const { email, team_id } = await req.json();
    if (!email || !team_id) {
      return new Response(JSON.stringify({ error: "Missing email or team_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ✅ Invite the user (sends an email with a signup link)
    const { data: user, error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error("❌ Invite error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // ✅ Optionally: insert into team_members (user.id might be null if they haven't signed up yet)
    if (user?.user?.id) {
      await supabase.from("team_members").insert({
        user_id: user.user.id,
        team_id,
      });
    }

    return new Response(JSON.stringify({ message: "Invite sent" }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("💥 Unexpected error:", err.message);
    return new Response(
      JSON.stringify({ error: "Unexpected error: " + err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
