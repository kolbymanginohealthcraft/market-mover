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
import claims from "./server/routes/claims.js";
import censusData from "./server/routes/censusData.js";
import providerDensity from "./server/routes/providerDensity.js";
import getProvidersByDhc from "./server/routes/getProvidersByDhc.js";
import maEnrollment from "./server/routes/maEnrollment.js";
import cmsEnrollment from "./server/routes/cmsEnrollment.js";
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
app.use("/api", claims);
app.use("/api", censusData);
app.use("/api", providerDensity);
app.use("/api", getProvidersByDhc);
app.use("/api", maEnrollment);
app.use("/api", cmsEnrollment);
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
