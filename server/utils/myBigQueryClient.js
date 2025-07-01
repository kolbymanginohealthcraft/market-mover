// server/utils/myBigQueryClient.js
import { BigQuery } from "@google-cloud/bigquery";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bigquery = new BigQuery({
  keyFilename: path.join(__dirname, "../credentials/my-service-account.json"),
  projectId: "market-mover-464517",
});

export default bigquery;
