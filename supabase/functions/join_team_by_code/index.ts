import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ CORS headers
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
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    console.log("📥 Request received");
    console.log("🧪 Access code:", access_code);
    console.log("🔐 Authorization header:", authHeader);
    console.log("🔑 Token parsed:", token);
    console.log("🔒 Using service role key?",
      !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    if (!token) {
      console.log("❌ No token provided");
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    console.log("👤 User from token:", user);
    if (userError || !user) {
      console.log("❌ Unauthorized user:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("access_code", access_code)
      .single();

    console.log("🏢 Team lookup:", team);
    if (teamError || !team) {
      return new Response(JSON.stringify({ error: "Invalid team code" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, license_quantity")
      .eq("team_id", team.id)
      .single();

    const { count: currentMembers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id);

    console.log("📊 Current members:", currentMembers);
    console.log("📦 License limit:", subscription?.license_quantity);

    if (
      subscription?.license_quantity !== null &&
      currentMembers >= subscription.license_quantity
    ) {
      return new Response(
        JSON.stringify({ error: "No available licenses on this team" }),
        { status: 403, headers: corsHeaders }
      );
    }

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
      console.log("❌ Update profile failed:", updateError.message);
      return new Response(JSON.stringify({ error: "Failed to join team" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("✅ User successfully added to team:", team.id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("💥 Unexpected error in join_team_by_code:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
