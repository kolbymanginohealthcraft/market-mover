// server/utils/myBigQueryClient.js
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let bigquery;
if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  try {
    bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
    });
    console.log("[BigQuery] Using credentials from environment variable.");
  } catch (e) {
    console.error("[BigQuery] Failed to parse GOOGLE_CLOUD_CREDENTIALS:", e.message);
    throw e;
  }
} else {
  bigquery = new BigQuery({
    keyFilename: path.join(__dirname, "../credentials/my-service-account.json"),
    projectId: "market-mover-464517",
  });
  console.log("[BigQuery] Using credentials from file.");
}

export default bigquery;
