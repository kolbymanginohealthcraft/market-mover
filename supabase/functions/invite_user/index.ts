import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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
    // Rate limiting by IP
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP, 10, 60000)) { // 10 requests per minute per IP
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    const secret = req.headers.get("x-invite-secret");
    const envSecret = Deno.env.get("EDGE_INVITE_SECRET");
    
    // Security: Don't log secrets in production
    if (Deno.env.get("ENVIRONMENT") !== "production") {
      console.log("Received secret:", secret);
      console.log("Environment secret:", envSecret);
      console.log("Secrets match:", secret === envSecret);
    }
    
    if (secret !== envSecret) {
      // Log security event
      console.error("Security: Invalid invite secret from IP:", clientIP);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const { email, team_id, team_name, inviter_id } = body;

    // Input validation
    if (!email || !team_id || !team_name || !inviter_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, team_id, team_name, or inviter_id" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate UUIDs
    if (!validateUUID(team_id) || !validateUUID(inviter_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid team_id or inviter_id format" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedTeamName = team_name.trim().substring(0, 100); // Limit length

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Verify the inviter has permission to invite users
    const { data: inviterProfile, error: inviterError } = await supabase
      .from("profiles")
      .select("role, team_id")
      .eq("id", inviter_id)
      .single();

    if (inviterError || !inviterProfile) {
      console.error("Security: Invalid inviter attempt:", { inviter_id, clientIP });
      return new Response(
        JSON.stringify({ error: "Invalid inviter" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if inviter is part of the team and has admin privileges
    if (inviterProfile.team_id !== team_id || 
        !["Team Admin", "Platform Admin", "Platform Support"].includes(inviterProfile.role)) {
      console.error("Security: Unauthorized invite attempt:", { 
        inviter_id, 
        team_id, 
        role: inviterProfile.role, 
        clientIP 
      });
      return new Response(
        JSON.stringify({ error: "You don't have permission to invite users to this team" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. First verify the team exists
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("name")
      .eq("id", team_id)
      .single();

    if (teamError || !team) {
      console.error("Team lookup failed:", { team_id, teamError, team });
      return new Response(
        JSON.stringify({ error: "Team not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 3. Check team license availability from current active subscription
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("license_quantity")
      .eq("team_id", team_id)
      .eq("status", "active")
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("started_at", { ascending: false });

    if (subError) {
      console.error("Subscription query error:", { team_id, subError });
      return new Response(
        JSON.stringify({ error: "Failed to check subscription status" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.error("No active subscription found:", { team_id, subscriptions });
      return new Response(
        JSON.stringify({ error: "No active subscription found for this team" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Use the most recent active subscription
    const subscription = subscriptions[0];

    // Count current team members
    const { count: currentMembers, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team_id);

    if (countError) {
      return new Response(
        JSON.stringify({ error: "Failed to check team membership" }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (currentMembers >= subscription.license_quantity) {
      return new Response(
        JSON.stringify({ error: "No available licenses on this team" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Check if user already exists and is already in the team
    const { data: existingUser, error: userCheckError } = await supabase
      .from("profiles")
      .select("id, team_id")
      .eq("email", sanitizedEmail)
      .single();

    if (existingUser && existingUser.team_id === team_id) {
      return new Response(
        JSON.stringify({ error: "User is already a member of this team" }),
        { status: 409, headers: corsHeaders }
      );
    }

    let isNewUser = !existingUser;

    // 4. Send invitation email using Supabase's built-in invitation system
    const { data: inviterData, error: inviterDataError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", inviter_id)
      .single();

    const inviterName = inviterDataError ? "Team Admin" : 
      `${inviterData.first_name || ""} ${inviterData.last_name || ""}`.trim() || "Team Admin";

    // Send invitation email with redirect URL to ensure email is sent
    console.log("Attempting to invite user:", sanitizedEmail);
    
    // Use localhost for development, production URL for production
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.healthcraftmarketmover.com";
    const redirectUrl = sanitizedEmail.includes('test') || sanitizedEmail.includes('localhost') ? 
      "http://localhost:5173/set-password" : 
      `${siteUrl}/set-password`;
    
    // Send invitation email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(sanitizedEmail, {
      redirectTo: redirectUrl,
      data: { team_name: team_name }
    });
    
    if (inviteError) {
      console.error("Invitation error:", inviteError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email", details: inviteError }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Invitation sent successfully - manually update profile
    console.log("Invitation sent successfully, updating profile...");
    
    // Wait a moment for the profile to be created by the trigger, then update it
    console.log("Waiting for profile creation, then updating with team info...");
    
    // Try multiple times to update the profile (in case it takes time to be created)
    let profileUpdated = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Wait a bit between attempts
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`Attempt ${attempt} to update profile...`);
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            team_id: team_id,
            role: "Team Member",
            access_type: "join"
          })
          .eq("email", sanitizedEmail);
          
        if (profileError) {
          console.log(`Profile update attempt ${attempt} failed:`, profileError);
        } else {
          console.log(`Profile updated successfully on attempt ${attempt}`);
          profileUpdated = true;
          break;
        }
      } catch (err) {
        console.log(`Profile update attempt ${attempt} failed with error:`, err);
      }
    }
    
    if (!profileUpdated) {
      console.log("Profile update failed after all attempts - will be handled during password setup");
    }

    // Log successful invitation
    console.log("Security: Successful user invitation:", {
      inviter_id,
      invited_email: sanitizedEmail,
      team_id,
      clientIP
    });

    return new Response(
      JSON.stringify({ 
        message: "User invited successfully",
        isNewUser,
        teamName: team.name,
        availableLicenses: subscription.license_quantity - (currentMembers + 1)
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("💥 Unexpected error in invite_user:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
