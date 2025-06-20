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

    // Strict match user by email
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10,
    });

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Failed to list users", details: listError }),
        { status: 500, headers: corsHeaders }
      );
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch profile", details: profileError }),
          { status: 500, headers: corsHeaders }
        );
      }

      if (profile && profile.team_id) {
        return new Response(
          JSON.stringify({ error: "User is already part of a team" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Safe update
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ team_id })
        .eq("id", userId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update profile", details: updateError }),
          { status: 500, headers: corsHeaders }
        );
      }

    } else {
      // New user — Supabase will auto-create profile via trigger
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
      });

      if (createError || !newUser?.user?.id) {
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError }),
          { status: 500, headers: corsHeaders }
        );
      }

      userId = newUser.user.id;

      // Wait briefly to let Supabase create the profile
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ team_id })
        .eq("id", userId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update profile after user creation", details: updateError }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ message: "User invited or linked successfully." }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
