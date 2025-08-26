import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info, x-invite-secret, x-admin-secret",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const debugLog: any = {
    env: {
      EDGE_ADMIN_SECRET: Deno.env.get("EDGE_ADMIN_SECRET"),
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "set" : "missing",
    },
    steps: [],
  };

  try {
    const secret = req.headers.get("x-admin-secret");
    const expected = Deno.env.get("EDGE_ADMIN_SECRET");
    debugLog.steps.push({ step: "received_secret", value: secret });

    if (secret !== expected) {
      debugLog.steps.push({ step: "unauthorized", reason: "Secret mismatch" });
      return new Response(JSON.stringify({ error: "Unauthorized", debug: debugLog }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const { user_id } = body;
    debugLog.steps.push({ step: "parsed_body", value: body });

    if (!user_id) {
      debugLog.steps.push({ step: "missing_user_id" });
      return new Response(JSON.stringify({ error: "Missing user_id", debug: debugLog }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    debugLog.steps.push({ step: "supabase_client_initialized" });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        team_id: null, 
        role: null
      })
      .eq("id", user_id);

    if (updateError) {
      debugLog.steps.push({ step: "update_failed", error: updateError });
      return new Response(
        JSON.stringify({ error: "Failed to remove user", debug: debugLog }),
        { status: 500, headers: corsHeaders }
      );
    }

    debugLog.steps.push({ step: "user_removed_successfully", user_id });
    return new Response(
      JSON.stringify({ message: "User removed from team", debug: debugLog }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    debugLog.steps.push({ step: "exception", message: err.message });
    return new Response(
      JSON.stringify({ error: "Unexpected error", debug: debugLog }),
      { status: 500, headers: corsHeaders }
    );
  }
});
