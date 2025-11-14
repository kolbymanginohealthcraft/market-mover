import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

// Load environment variables FIRST before importing any modules that use them
dotenv.config();

import qualityMeasures from "./server/routes/qualityMeasures.js";
import searchProviders from "./server/routes/searchProviders.js";
import getCcns from "./server/routes/getCcns.js";
import getNpis from "./server/routes/getNpis.js";
import getNearbyProviders from "./server/routes/getNearbyProviders.js";
import testVendorConnection from "./server/routes/testVendorConnection.js";
import diagnoses from "./server/routes/diagnoses.js";
import procedures from "./server/routes/procedures.js";
import taxonomies from "./server/routes/taxonomies.js";
import claims from "./server/routes/claims.js";
import censusData from "./server/routes/censusData.js";
import providerDensity from "./server/routes/providerDensity.js";
import getProvidersByDhc from "./server/routes/getProvidersByDhc.js";
import getProvidersByDhcVendor from "./server/routes/getProvidersByDhcVendor.js";
import getNearbyProvidersVendor from "./server/routes/getNearbyProvidersVendor.js";
import searchProvidersVendor from "./server/routes/searchProvidersVendor.js";
import maEnrollment from "./server/routes/maEnrollment.js";
import cmsEnrollment from "./server/routes/cmsEnrollment.js";
import providerOfServices from "./server/routes/providerOfServices.js";
import hospitalEnrollments from "./server/routes/hospitalEnrollments.js";
import catchment from "./server/routes/catchment.js";
import batchData from "./server/routes/batchData.js";
import zipCodes from "./server/routes/zipCodes.js";
import investigation from "./server/routes/investigation.js";
import hcoData from "./server/routes/hcoData.js";
import hcpData from "./server/routes/hcpData.js";
import hcoDirectory from "./server/routes/hcoDirectory.js";
import marketGeography from "./server/routes/marketGeography.js";
import geographicBoundaries from "./server/routes/geographicBoundaries.js";
import patientJourney from "./server/routes/patientJourney.js";
import referralPathways from "./server/routes/referralPathways.js";
import kpis from "./server/routes/kpis.js";
import planetFeatures from "./server/routes/planetFeatures.js";
import networkSiblings from "./server/routes/networkSiblings.js";
import affiliationsProvider from "./server/routes/affiliationsProvider.js";

// import admin from "./server/routes/admin.js";
// import policyManagement from "./server/routes/policyManagement.js";

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://market-mover-rust.vercel.app',
    'https://market-mover.vercel.app',
    'https://www.healthcraftmarketmover.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`, {
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
  next();
});

app.use("/api", qualityMeasures);
app.use("/api", searchProviders);
app.use("/api", getCcns);
app.use("/api", getNpis);
app.use("/api", getNearbyProviders);
app.use("/api", testVendorConnection);
app.use("/api", diagnoses);
app.use("/api", procedures);
app.use("/api", taxonomies);
app.use("/api", claims);
app.use("/api", censusData);
app.use("/api", providerDensity);
app.use("/api", getProvidersByDhc);
app.use("/api", getProvidersByDhcVendor);
app.use("/api", getNearbyProvidersVendor);
app.use("/api", searchProvidersVendor);
app.use("/api", maEnrollment);
app.use("/api", cmsEnrollment);
app.use("/api", providerOfServices);
app.use("/api", hospitalEnrollments);
app.use("/api", catchment);
app.use("/api", batchData);
app.use("/api", zipCodes);
app.use("/api", investigation);
app.use("/api/hco-data", hcoData);
app.use("/api/hcp-data", hcpData);
app.use("/api/hco-directory", hcoDirectory);
app.use("/api/market-geography", marketGeography);
app.use("/api", geographicBoundaries);
app.use("/api/patient-journey", patientJourney);
app.use("/api/referral-pathways", referralPathways);
app.use("/api", kpis);
app.use("/api", planetFeatures);
app.use("/api", networkSiblings);
app.use("/api/provider-affiliations", affiliationsProvider);

// app.use("/api/admin", admin);
// app.use("/api/policies", policyManagement);


// ✅ Invite User Route
app.post("/api/inviteUser", async (req, res) => {
  const { email, team_id } = req.body;

  if (!email || !team_id) {
    return res.status(400).json({ message: "Missing email or team_id" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Create user in Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: false,
    });

    if (error || !data?.user?.id) {
      console.error("❌ Auth error:", error?.message);
      return res.status(500).json({ message: error?.message || "User creation failed" });
    }

    const userId = data.user.id;

    // Insert into profiles
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      team_id,
    });

    if (profileError) {
      console.error("❌ profiles insert error:", profileError.message);
      return res.status(500).json({ message: "Failed to insert into profiles" });
    }

    // Insert into team_members
    const { error: teamError } = await supabase.from("team_members").insert({
      user_id: userId,
      team_id,
    });

    if (teamError) {
      console.error("❌ team_members insert error:", teamError.message);
      return res.status(500).json({ message: "Failed to insert into team_members" });
    }

    res.status(200).json({ message: "✅ User invited", userId });
  } catch (err) {
    console.error("💥 Server error:", err);
    res.status(500).json({ message: "Unexpected server error" });
  }
});

// Helper function to verify admin access
const verifyAdminAccess = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return { error: 'Invalid token', user: null };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { error: 'User profile not found', user: null };
    }

    const role = profile.role;
    if (role !== 'Platform Admin' && role !== 'Platform Support') {
      return { error: 'Insufficient permissions', user: null };
    }

    return { error: null, user };
  } catch (err) {
    console.error('Error verifying admin access:', err);
    return { error: 'Verification failed', user: null };
  }
};

// ✅ Impersonate User Route
app.post("/api/impersonate", async (req, res) => {
  const { target_user_id } = req.body;

  if (!target_user_id) {
    return res.status(400).json({ message: "Missing target_user_id" });
  }

  // Verify requester is Platform Admin or Platform Support
  const { error: verifyError, user: requester } = await verifyAdminAccess(req);
  if (verifyError || !requester) {
    return res.status(403).json({ message: verifyError || "Unauthorized" });
  }

  // Prevent self-impersonation
  if (requester.id === target_user_id) {
    return res.status(400).json({ message: "Cannot impersonate yourself" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Verify target user exists and preserve original last_sign_in_at
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(target_user_id);
    if (userError || !targetUser) {
      console.error("❌ User lookup error:", userError);
      return res.status(404).json({ message: "Target user not found", error: userError?.message });
    }

    // Preserve original last_sign_in_at before impersonation
    const originalLastSignIn = targetUser.user.last_sign_in_at;

    // Use Supabase admin API to generate a magic link and extract session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email,
    });

    if (linkError) {
      console.error("❌ Link generation error:", linkError);
      return res.status(500).json({ 
        message: "Failed to generate magic link", 
        error: linkError.message
      });
    }

    // Extract the action link
    const actionLink = linkData.properties?.action_link || linkData.action_link;
    if (!actionLink) {
      return res.status(500).json({ 
        message: "No action link in response",
        error: "Link generation succeeded but no link returned"
      });
    }

    // Parse token from the magic link URL
    let token = null;
    try {
      const linkUrl = new URL(actionLink);
      // Try different ways to extract the token
      token = linkUrl.searchParams.get('token') || 
              linkUrl.searchParams.get('access_token') ||
              (linkUrl.hash.includes('token=') ? linkUrl.hash.split('token=')[1]?.split('&')[0] : null);
    } catch (urlError) {
      console.error("❌ URL parsing error:", urlError);
    }

    if (!token) {
      // If token extraction fails, try using the hash_token from the response
      token = linkData.properties?.hashed_token || linkData.hashed_token;
      
      if (!token) {
        return res.status(500).json({ 
          message: "Could not extract token from magic link",
          error: "Token extraction failed",
          link: actionLink,
          linkData: JSON.stringify(linkData)
        });
      }
    }

    // Create a session by verifying the token
    // Use the anon client to verify and get session
    const anonSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.SERVICE_ROLE_KEY
    );

    // Verify the token and get session
    const { data: verifyData, error: verifyError } = await anonSupabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink'
    });

    if (verifyError || !verifyData?.session) {
      // If OTP verification fails, try using the token directly in a sign-in
      // Some Supabase versions return the token differently
      console.error("❌ Token verification error:", verifyError);
      
      // Try alternative: use the token as a recovery token
      const { data: recoveryData, error: recoveryError } = await anonSupabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (recoveryError || !recoveryData?.session) {
        return res.status(500).json({ 
          message: "Failed to verify token and create session", 
          error: verifyError?.message || recoveryError?.message,
          details: "Both magiclink and recovery verification failed"
        });
      }

      const sessionData = recoveryData.session;
      
      // Restore original last_sign_in_at (verifyOtp updates it, but we don't want impersonation to count as a login)
      // Use database function to update auth.users directly
      if (originalLastSignIn !== null) {
        try {
          const { error: rpcError } = await supabase.rpc('restore_user_last_sign_in', {
            target_user_id: target_user_id,
            original_timestamp: originalLastSignIn
          });
          
          if (rpcError) {
            console.error("⚠️ Could not restore last_sign_in_at:", rpcError);
          }
        } catch (err) {
          console.error("⚠️ Error restoring last_sign_in_at:", err);
        }
      }

      
      res.status(200).json({ 
        message: "✅ Impersonation session created",
        session: {
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at,
          expires_in: sessionData.expires_in,
          token_type: sessionData.token_type || 'bearer',
          user: sessionData.user
        },
        original_user_id: requester.id
      });
      return;
    }

    const sessionData = verifyData.session;
    
    // Restore original last_sign_in_at (verifyOtp updates it, but we don't want impersonation to count as a login)
    // Use database function to update auth.users directly
    if (originalLastSignIn !== null) {
      try {
        const { error: rpcError } = await supabase.rpc('restore_user_last_sign_in', {
          target_user_id: target_user_id,
          original_timestamp: originalLastSignIn
        });
        
        if (rpcError) {
          console.error("⚠️ Could not restore last_sign_in_at:", rpcError);
        }
      } catch (err) {
        console.error("⚠️ Error restoring last_sign_in_at:", err);
      }
    }

    
    res.status(200).json({ 
      message: "✅ Impersonation session created",
      session: {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        expires_in: sessionData.expires_in,
        token_type: sessionData.token_type || 'bearer',
        user: sessionData.user
      },
      original_user_id: requester.id
    });
  } catch (err) {
    console.error("💥 Impersonation error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// ✅ Get User Login History Route
app.get("/api/users/:userId/login-history", async (req, res) => {
  const { userId } = req.params;

  // Verify requester is Platform Admin or Platform Support
  const { error: verifyError, user: requester } = await verifyAdminAccess(req);
  if (verifyError || !requester) {
    return res.status(403).json({ message: verifyError || "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Get last sign-in from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get login activities from user_activities table
    const { data: loginActivities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('created_at, activity_type')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .order('created_at', { ascending: false })
      .limit(50);

    // If activities table doesn't exist or has no login records, that's okay
    const activities = activitiesError ? [] : (loginActivities || []);

    res.status(200).json({
      lastSignIn: authUser.user.last_sign_in_at,
      createdAt: authUser.user.created_at,
      updatedAt: authUser.user.updated_at,
      confirmedAt: authUser.user.confirmed_at,
      loginCount: activities.length,
      recentLogins: activities.map(a => ({
        timestamp: a.created_at,
        activityType: a.activity_type
      }))
    });
  } catch (err) {
    console.error("💥 Login history error:", err);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// ✅ Get All Users Activity Counts Route (for bulk display)
app.get("/api/users/activity-counts", async (req, res) => {
  // Verify requester is Platform Admin or Platform Support
  const { error: verifyError, user: requester } = await verifyAdminAccess(req);
  if (verifyError || !requester) {
    return res.status(403).json({ message: verifyError || "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Get all user IDs from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      return res.status(500).json({ message: "Error fetching profiles", error: profilesError.message });
    }

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({});
    }

    const userIds = profiles.map(p => p.id);

    // Fetch all activities for these users (using service role to bypass RLS)
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('user_id')
      .in('user_id', userIds);

    if (activitiesError) {
      // If table doesn't exist, return empty counts
      if (activitiesError.code === '42P01') {
        return res.status(200).json({});
      }
      return res.status(500).json({ message: "Error fetching activities", error: activitiesError.message });
    }

    // Count activities per user
    const counts = {};
    activities?.forEach(activity => {
      counts[activity.user_id] = (counts[activity.user_id] || 0) + 1;
    });

    res.status(200).json(counts);
  } catch (err) {
    console.error("💥 Activity counts error:", err);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// ✅ Get User Authentication Events Route
app.get("/api/users/:userId/auth-events", async (req, res) => {
  const { userId } = req.params;

  // Verify requester is Platform Admin or Platform Support
  const { error: verifyError, user: requester } = await verifyAdminAccess(req);
  if (verifyError || !requester) {
    return res.status(403).json({ message: verifyError || "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Use database function to get authentication events
    // This function can access auth schema tables directly
    const { data: events, error: rpcError } = await supabase.rpc('get_user_auth_events', {
      target_user_id: userId
    });

    if (rpcError) {
      console.error("Auth events RPC error:", rpcError);
      
      // Fallback: Try to get sessions directly if function doesn't exist
      try {
        // Query sessions using a direct SQL approach via a simpler function
        const { data: sessions, error: sessionsError } = await supabase
          .from('auth.sessions')
          .select('id, created_at, ip, user_agent, refreshed_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!sessionsError && sessions) {
          const fallbackEvents = sessions.map(session => ({
            id: session.id,
            timestamp: session.created_at,
            eventType: 'session_created',
            ipAddress: session.ip || '',
            userAgent: session.user_agent || '',
            details: {
              refreshed_at: session.refreshed_at
            }
          }));

          return res.status(200).json({ events: fallbackEvents });
        }
      } catch (fallbackErr) {
        console.error("Fallback sessions query error:", fallbackErr);
      }

      // If all else fails, return empty array
      return res.status(200).json({ events: [] });
    }

    // Format events from the database function
    const formattedEvents = (events || []).map(event => ({
      id: event.id,
      timestamp: event.event_timestamp,
      eventType: event.event_type || 'unknown',
      ipAddress: event.ip_address || '',
      userAgent: event.user_agent || '',
      details: event.details || {}
    }));

    // Sort by timestamp (most recent first)
    formattedEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({ events: formattedEvents });
  } catch (err) {
    console.error("💥 Auth events error:", err);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// ✅ Get User Activities Route (for custom activities like searches/views)
app.get("/api/users/:userId/activities", async (req, res) => {
  const { userId } = req.params;

  // Verify requester is Platform Admin or Platform Support
  const { error: verifyError, user: requester } = await verifyAdminAccess(req);
  if (verifyError || !requester) {
    return res.status(403).json({ message: verifyError || "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Fetch recent activities for the user (using service role to bypass RLS)
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activitiesError) {
      // If table doesn't exist, return empty array
      if (activitiesError.code === '42P01') {
        return res.status(200).json({ activities: [] });
      }
      return res.status(500).json({ message: "Error fetching activities", error: activitiesError.message });
    }

    res.status(200).json({ activities: activities || [] });
  } catch (err) {
    console.error("💥 User activities error:", err);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// ✅ Get All Users Login History Route (for bulk display)
app.get("/api/users/login-history", async (req, res) => {
  // Verify requester is Platform Admin or Platform Support
  const { error: verifyError, user: requester } = await verifyAdminAccess(req);
  if (verifyError || !requester) {
    return res.status(403).json({ message: verifyError || "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      return res.status(500).json({ message: "Failed to fetch profiles", error: profilesError.message });
    }

    // Get last sign-in for each user from auth.users
    const loginHistory = {};
    for (const profile of profiles || []) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        if (authUser?.user) {
          loginHistory[profile.id] = {
            lastSignIn: authUser.user.last_sign_in_at,
            createdAt: authUser.user.created_at
          };
        }
      } catch (err) {
        // Skip users that can't be found in auth
        console.error(`Error fetching auth data for user ${profile.id}:`, err);
      }
    }

    res.status(200).json(loginHistory);
  } catch (err) {
    console.error("💥 Bulk login history error:", err);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// ✅ Stop Impersonation Route
app.post("/api/stop-impersonate", async (req, res) => {
  const { original_user_id } = req.body;

  if (!original_user_id) {
    return res.status(400).json({ message: "Missing original_user_id" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  try {
    // Get current session to identify the target user (who is being impersonated)
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const targetUserId = currentSession?.user?.id;

    // Get the original user and preserve original last_sign_in_at
    const { data: originalUser, error: userError } = await supabase.auth.admin.getUserById(original_user_id);
    if (userError || !originalUser) {
      console.error("❌ User lookup error:", userError);
      return res.status(404).json({ message: "Original user not found", error: userError?.message });
    }

    // Preserve original last_sign_in_at before restoring session
    const originalLastSignIn = originalUser.user.last_sign_in_at;

    // Use the same approach as impersonate - generate magic link and verify
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: originalUser.user.email,
    });

    if (linkError) {
      console.error("❌ Link generation error:", linkError);
      return res.status(500).json({ 
        message: "Failed to generate magic link", 
        error: linkError.message
      });
    }

    const actionLink = linkData.properties?.action_link || linkData.action_link;
    if (!actionLink) {
      return res.status(500).json({ 
        message: "No action link in response",
        error: "Link generation succeeded but no link returned"
      });
    }

    let token = null;
    try {
      const linkUrl = new URL(actionLink);
      token = linkUrl.searchParams.get('token') || 
              linkUrl.searchParams.get('access_token') ||
              (linkUrl.hash.includes('token=') ? linkUrl.hash.split('token=')[1]?.split('&')[0] : null);
    } catch (urlError) {
      console.error("❌ URL parsing error:", urlError);
    }

    if (!token) {
      token = linkData.properties?.hashed_token || linkData.hashed_token;
      if (!token) {
        return res.status(500).json({ 
          message: "Could not extract token from magic link",
          error: "Token extraction failed"
        });
      }
    }

    const anonSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.SERVICE_ROLE_KEY
    );

    const { data: verifyData, error: verifyError } = await anonSupabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink'
    });

    if (verifyError || !verifyData?.session) {
      return res.status(500).json({ 
        message: "Failed to verify token and create session", 
        error: verifyError?.message
      });
    }

    const sessionData = verifyData.session;

    // Restore original last_sign_in_at (verifyOtp updates it, but we don't want session restoration to count as a login)
    // Use database function to update auth.users directly
    if (originalLastSignIn !== null) {
      try {
        const { error: rpcError } = await supabase.rpc('restore_user_last_sign_in', {
          target_user_id: original_user_id,
          original_timestamp: originalLastSignIn
        });
        
        if (rpcError) {
          console.error("⚠️ Could not restore last_sign_in_at:", rpcError);
        }
      } catch (err) {
        console.error("⚠️ Error restoring last_sign_in_at:", err);
      }
    }


    res.status(200).json({ 
      message: "✅ Returned to original user",
      session: {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        expires_in: sessionData.expires_in,
        token_type: sessionData.token_type || 'bearer',
        user: sessionData.user
      }
    });
  } catch (err) {
    console.error("💥 Stop impersonation error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ message: "Unexpected server error", error: err.message });
  }
});

// Catch-all fallback
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    console.error(`❌ API route not found: ${req.method} ${req.path}`, {
      url: req.url,
      originalUrl: req.originalUrl
    });
    res.status(404).json({ error: "Not found", path: req.path, method: req.method });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Only start the server if not in Vercel's serverless environment
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Express API server running at http://0.0.0.0:${PORT}`);
  }).on('error', (err) => {
    console.error('❌ Server error:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
  });
}

// Export for Vercel serverless functions
export default app;
