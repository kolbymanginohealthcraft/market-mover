// server/utils/vendorBigQueryClient.js
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bigquery = new BigQuery({
  keyFilename: path.join(__dirname, "../credentials/vendor-access.json"),
  projectId: "populi-clients", // <- Replace with value from vendor JSON
});

export default bigquery;
