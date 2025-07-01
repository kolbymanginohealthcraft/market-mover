import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSignature } from "./signature.ts";

serve(async (req) => {
  // ─── CORS Preflight ────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    console.log("🔁 CORS preflight, request-headers:", req.headers.get("access-control-request-headers"));
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        // allow supabase-js built-in headers too:
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  console.log("🚀 Payment function start, method:", req.method);

  // ─── Read & Parse Body ─────────────────────────────────────────────
  let bodyText: string;
  try {
    bodyText = await req.text();
    console.log("📥 Raw body text:", bodyText);
  } catch (err) {
    console.error("❌ Failed to read body:", err);
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  let payloadJson: any;
  try {
    payloadJson = JSON.parse(bodyText);
    console.log("✅ Parsed payload:", payloadJson);
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  // ─── Grab Credentials ──────────────────────────────────────────────
  const merchantId = Deno.env.get("CYBS_MERCHANT_ID");
  const keyId      = Deno.env.get("CYBS_KEY_ID");
  const secretKey  = Deno.env.get("CYBS_SHARED_SECRET");
  console.log("🔑 Env vars:", {
    merchantId,
    keyId,
    sharedSecret: secretKey?.slice(0, 6) + "...",
  });

  if (!merchantId || !keyId || !secretKey) {
    console.error("❌ Missing one or more Cybersource credentials");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  // ─── Build Cybersource Request ─────────────────────────────────────
  const { number, expMonth, expYear, cvv, amount } = payloadJson;
  const resource = "/pts/v2/payments";
  const endpoint = "https://apitest.cybersource.com";
  const url      = endpoint + resource;
  const date     = new Date().toUTCString();

  console.log("📅 Date header:", date);

  const csPayload = {
    clientReferenceInformation: { code: "MM-Test-Payment" },
    processingInformation: { commerceIndicator: "internet" },
    paymentInformation: {
      card: {
        number,
        expirationMonth: expMonth,
        expirationYear:  expYear,
        securityCode:    cvv,
      },
    },
    orderInformation: {
      amountDetails: { totalAmount: amount, currency: "USD" },
      billTo: {
        firstName:         "Jane",
        lastName:          "Doe",
        address1:          "1 Market St",
        locality:          "San Francisco",
        administrativeArea:"CA",
        postalCode:        "94105",
        country:           "US",
        email:             "test@example.com",
      },
    },
  };

  const csBody = JSON.stringify(csPayload);
  console.log("📦 Payment payload:", csBody);

  // ─── Create HTTP-Signature ─────────────────────────────────────────
  let digest: string, signatureHeader: string;
  try {
    ({ digest, header: signatureHeader } = await createSignature({
      method:     "POST",
      resource,
      date,
      keyId,
      merchantId,
      secretKey,
      body: csBody,
    }));
    console.log("📬 Digest:", digest);
    console.log("📬 Signature header:", signatureHeader);
  } catch (err) {
    console.error("❌ Signature creation failed:", err);
    return new Response(JSON.stringify({ error: "Signature error" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  // ─── Send to Cybersource ────────────────────────────────────────────
  const headers = new Headers({
    Host:             "apitest.cybersource.com",
    Date:             date,
    "v-c-merchant-id": merchantId,
    Digest:           `SHA-256=${digest}`,
    Signature:        signatureHeader,
    "Content-Type":   "application/json",
  });

  console.log("📤 Sending to Cybersource:", url, "with headers:", Object.fromEntries(headers.entries()));

  let csResp: Response;
  try {
    csResp = await fetch(url, {
      method:  "POST",
      headers,
      body:    csBody,
    });
  } catch (err) {
    console.error("❌ Cybersource fetch error:", err);
    return new Response(JSON.stringify({ error: "Payment request failed" }), {
      status: 502,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":                "application/json",
      },
    });
  }

  console.log(`🔁 Cybersource responded, status: ${csResp.status}`);

  let csData: any;
  try {
    csData = await csResp.json();
    console.log("✅ Cybersource response body:", csData);
  } catch (err) {
    console.error("❌ Response parsing error:", err);
    csData = { error: "Invalid response" };
  }

  // ─── Return to Client ──────────────────────────────────────────────
  return new Response(JSON.stringify(csData), {
    status: csResp.status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type":                "application/json",
    },
  });
});
