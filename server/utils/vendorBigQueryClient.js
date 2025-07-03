// server/utils/vendorBigQueryClient.js
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let bigquery;
if (process.env.VENDOR_GOOGLE_CLOUD_CREDENTIALS) {
  try {
    bigquery = new BigQuery({
      projectId: process.env.VENDOR_GOOGLE_CLOUD_PROJECT_ID,
      credentials: JSON.parse(process.env.VENDOR_GOOGLE_CLOUD_CREDENTIALS),
    });
    console.log("[Vendor BigQuery] Using credentials from environment variable.");
  } catch (e) {
    console.error("[Vendor BigQuery] Failed to parse VENDOR_GOOGLE_CLOUD_CREDENTIALS:", e.message);
    throw e;
  }
} else {
  bigquery = new BigQuery({
    keyFilename: path.join(__dirname, "../credentials/vendor-access.json"),
    projectId: "populi-clients",
  });
  console.log("[Vendor BigQuery] Using credentials from file.");
}

export default bigquery;
