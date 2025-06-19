import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-invite-secret",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const secret = req.headers.get("x-invite-secret");
  const expected = Deno.env.get("EDGE_INVITE_SECRET");

  if (secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const { email, team_id, team_name } = await req.json();

  if (!email || !team_id || !team_name) {
    return new Response(JSON.stringify({ error: "Missing email, team_id, or team_name" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Step 1: Create user
  const { data: userResult, error: userError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (userError || !userResult?.user?.id) {
    console.error("❌ Error creating user:", userError);
    return new Response(JSON.stringify({ error: "Failed to create user" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const user_id = userResult.user.id;
  console.log("✅ User created:", user_id);

  // Step 2: Check if profile exists
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user_id)
    .maybeSingle();

  if (profileCheckError) {
    console.error("❌ Error checking profile:", profileCheckError);
    return new Response(JSON.stringify({ error: "Failed to check profile" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await supabase.from("profiles").insert({
      id: user_id,
      email,
      team_code: team_name,
    });

    if (profileInsertError) {
      console.error("❌ Error inserting profile:", profileInsertError);
      return new Response(JSON.stringify({ error: "Failed to insert profile", details: profileInsertError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("✅ Profile inserted");
  } else {
    console.log("ℹ️ Profile already exists for user:", user_id);
  }

  // Step 3: Check if team_members already exists
  const { data: existingMember, error: memberCheckError } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team_id)
    .eq("user_id", user_id)
    .maybeSingle();

  if (memberCheckError) {
    console.error("❌ Error checking team_members:", memberCheckError);
    return new Response(JSON.stringify({ error: "Failed to check team_members" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!existingMember) {
    const { error: teamInsertError } = await supabase.from("team_members").insert({
      user_id,
      team_id,
      role: "member",
    });

    if (teamInsertError) {
      console.error("❌ Error inserting team member:", teamInsertError);
      return new Response(JSON.stringify({ error: "Failed to insert team member", details: teamInsertError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("✅ Team member inserted");
  } else {
    console.log("ℹ️ Team member already exists for user:", user_id);
  }

  return new Response(JSON.stringify({ success: true, user_id }), {
    status: 200,
    headers: corsHeaders,
  });
});
