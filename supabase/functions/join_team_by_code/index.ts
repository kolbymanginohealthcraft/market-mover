import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { access_code } = await req.json();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Look up team by access_code
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("access_code", access_code)
      .single();

    if (teamError || !team) {
      return new Response(JSON.stringify({ error: "Invalid team code" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check license availability
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, license_quantity")
      .eq("team_id", team.id)
      .single();

    const { count: currentMembers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id);

    if (currentMembers >= (subscription?.license_quantity ?? 0)) {
      return new Response(
        JSON.stringify({ error: "No available licenses on this team" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Assign user to team
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        team_id: team.id,
        role: "member",
        access_type: "join",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to join team" }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("💥 join_team_by_code error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
