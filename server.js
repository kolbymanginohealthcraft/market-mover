import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

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
import catchment from "./server/routes/catchment.js";
import batchData from "./server/routes/batchData.js";
import zipCodes from "./server/routes/zipCodes.js";
import investigation from "./server/routes/investigation.js";
import hcoData from "./server/routes/hcoData.js";
import hcpData from "./server/routes/hcpData.js";
import hcoDirectory from "./server/routes/hcoDirectory.js";
import marketGeography from "./server/routes/marketGeography.js";
import patientJourney from "./server/routes/patientJourney.js";
import referralPathways from "./server/routes/referralPathways.js";
import kpis from "./server/routes/kpis.js";

// import admin from "./server/routes/admin.js";
// import policyManagement from "./server/routes/policyManagement.js";


dotenv.config();

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
app.use("/api", catchment);
app.use("/api", batchData);
app.use("/api", zipCodes);
app.use("/api", investigation);
app.use("/api/hco-data", hcoData);
app.use("/api/hcp-data", hcpData);
app.use("/api/hco-directory", hcoDirectory);
app.use("/api/market-geography", marketGeography);
app.use("/api/patient-journey", patientJourney);
app.use("/api/referral-pathways", referralPathways);
app.use("/api", kpis);

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
    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(target_user_id);
    if (userError || !targetUser) {
      console.error("❌ User lookup error:", userError);
      return res.status(404).json({ message: "Target user not found", error: userError?.message });
    }

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
    // Get the original user
    const { data: originalUser, error: userError } = await supabase.auth.admin.getUserById(original_user_id);
    if (userError || !originalUser) {
      console.error("❌ User lookup error:", userError);
      return res.status(404).json({ message: "Original user not found", error: userError?.message });
    }

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
  res.status(404).json({ error: "Not found" });
});

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
