import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import styles from './PaymentTest.module.css';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function PaymentTest() {
  const [number, setNumber] = useState("4111111111111111");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("2026");
  const [cvv, setCvv] = useState("123");
  const [amount, setAmount] = useState("25.00");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const teamName = searchParams.get("teamName");
  const tier = searchParams.get("tier") || "starter";
  const seats = parseInt(searchParams.get("seats"), 10) || 5;

  useEffect(() => {
    if (!teamName) {
      setError("Missing team details. Please return to onboarding.");
    }
  }, [teamName]);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = { number, expMonth, expYear, cvv, amount };
      console.log("📤 Calling Edge Function with payload:", payload);

      // Call the payment processing Edge Function
      const { data: paymentResult, error: funcError } = await supabase.functions.invoke(
        "process-payment",
        { body: payload }
      );

      if (funcError || !paymentResult) {
        console.error("❌ Payment error:", funcError);
        throw new Error(funcError?.message || "Payment failed");
      }

      console.log("✅ Payment successful:", paymentResult);

      // Get current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) throw new Error("User authentication failed");

      // Generate access code
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Insert team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            name: teamName,
            tier,
            access_code: accessCode,
            max_users: seats,
            current_users: 1,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (teamError) throw new Error("Could not create team");

      // Add admin to team_members
      const { error: memberError } = await supabase.from("team_members").insert([
        {
          team_id: team.id,
          user_id: user.id,
          role: "admin",
        },
      ]);

      if (memberError) throw new Error("Could not assign admin to team");

      // Redirect to success page with access code
      navigate(`/success?code=${accessCode}`);
    } catch (err) {
      console.error("❌ Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Team Payment</h2>

      <div className={styles.formGroup}>
        <label>Card Number</label>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Exp Month</label>
          <input
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Exp Year</label>
          <input
            value={expYear}
            onChange={(e) => setExpYear(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label>CVV</label>
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Amount (USD)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.amountInput}
        />
      </div>

      <button className={styles.submitButton} onClick={handlePay} disabled={loading}>
        {loading ? "Processing…" : "Submit Payment"}
      </button>

      {error && (
        <div className={styles.errorMessage}>
          Error: {error}
        </div>
      )}

      {result && !error && (
        <div className={styles.resultContainer}>
          <p>
            <strong>Authorized!</strong>
          </p>
          <p>Transaction ID: {result.id}</p>
          <p>
            Amount: ${result.orderInformation.amountDetails.authorizedAmount}{" "}
            {result.orderInformation.amountDetails.currency}
          </p>
          <p>Approval Code: {result.processorInformation.approvalCode}</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  );
}
