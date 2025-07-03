// server/utils/vendorBigQueryClient.js
import { BigQuery } from "@google-cloud/bigquery";

// Use environment variables for credentials in production
const bigquery = new BigQuery({
  projectId: process.env.VENDOR_GOOGLE_CLOUD_PROJECT_ID || "populi-clients",
  credentials: process.env.VENDOR_GOOGLE_CLOUD_CREDENTIALS 
    ? JSON.parse(process.env.VENDOR_GOOGLE_CLOUD_CREDENTIALS)
    : undefined,
});

export default bigquery;
