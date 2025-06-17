// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import nearbyProvidersRoute from "./api/nearby-providers.js";
import providerDetailRoute from "./api/provider-detail.js";
import providerSearchRoute from "./api/provider-search.js";

const app = express();
const PORT = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON requests
app.use(express.json());

// ✅ API routes
app.use("/api/nearby-providers", nearbyProvidersRoute);
app.use("/api/provider-detail", providerDetailRoute);
app.use("/api/provider-search", providerSearchRoute);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Express API server running at http://localhost:${PORT}`);
});
