import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info, x-invite-secret",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const secret = req.headers.get("x-invite-secret");
    if (secret !== Deno.env.get("EDGE_INVITE_SECRET")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const { email, team_id, team_name } = body;

    if (!email || !team_id || !team_name) {
      return new Response(
        JSON.stringify({ error: "Missing email, team_id, or team_name" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("📥 Creating user for:", email);
    const { data: user, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
      });

    if (userError || !user?.user?.id) {
      console.error("❌ Error creating user:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to create user", details: userError }),
        { status: 500, headers: corsHeaders }
      );
    }

    const userId = user.user.id;

    console.log("🔍 Checking if profile exists...");
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("❌ Error checking profile existence:", profileCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to check profile" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!existingProfile) {
      console.log("📥 Inserting profile...");
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
      });

      if (profileError) {
        console.error("❌ Profile insert failed:", profileError);
        return new Response(
          JSON.stringify({ error: "Failed to insert profile", details: profileError }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      console.log("✅ Profile already exists, skipping insert.");
    }

    console.log("📥 Inserting into team_members...");
    const { error: teamError } = await supabase.from("team_members").insert({
      user_id: userId,
      team_id,
      role: "member",
    });

    if (teamError && teamError.code !== "23505") {
      // 23505 = duplicate key value
      console.error("❌ Team member insert failed:", teamError);
      return new Response(
        JSON.stringify({ error: "Failed to insert team member", details: teamError }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("📥 Incrementing license count...");
    const { error: countError } = await supabase.rpc(
      "increment_team_user_count",
      { team_id_param: team_id }
    );

    if (countError) {
      console.error("❌ Failed to increment current_users:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to increment license count", details: countError }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("✅ User successfully invited.");
    return new Response(JSON.stringify({ message: "User invited!" }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("❌ Catch block error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
