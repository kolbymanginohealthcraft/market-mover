// base64 utilities
function base64Encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
function base64Decode(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split("").map(c => c.charCodeAt(0)));
}

export async function createSignature({
  method, resource, date, keyId, merchantId, secretKey, body
}: {
  method: string;
  resource: string;
  date: string;
  keyId: string;
  merchantId: string;
  secretKey: string; // still base64
  body: string;
}) {
  const encoder = new TextEncoder();

  // 1) digest body
  const hash    = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  const digest  = base64Encode(new Uint8Array(hash));

  // 2) build signature string *in exactly this order*
  const sigStr = [
    `host: apitest.cybersource.com`,
    `date: ${date}`,
    `(request-target): ${method.toLowerCase()} ${resource}`,
    `digest: SHA-256=${digest}`,
    `v-c-merchant-id: ${merchantId}`,
  ].join("\n");

  // 3) import and sign
  const rawKey   = base64Decode(secretKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuf   = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(sigStr));
  const signature = base64Encode(new Uint8Array(sigBuf));

  // 4) assemble header
  const header = [
    `keyid="${keyId}"`,
    `algorithm="HmacSHA256"`,
    `headers="host date (request-target) digest v-c-merchant-id"`,
    `signature="${signature}"`,
  ].join(", ");

  return { digest, header };
}
