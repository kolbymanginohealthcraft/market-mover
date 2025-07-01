import { useSearchParams } from "react-router-dom";

export default function Success() {
  const [params] = useSearchParams();
  const code = params.get("code");

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎉 Team Created!</h2>
      <p>Share this access code with your colleagues:</p>
      <pre style={{ fontSize: "1.5rem", background: "#f1f1f1", padding: "1rem", borderRadius: "8px" }}>
        {code}
      </pre>
    </div>
  );
}
