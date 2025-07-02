import { useSearchParams } from "react-router-dom";
import styles from "./Success.module.css";

export default function Success() {
  const [params] = useSearchParams();
  const code = params.get("code");

  return (
    <div className={styles.container}>
      <h2>🎉 Team Created!</h2>
      <p>Share this access code with your colleagues:</p>
      <pre className={styles.codeDisplay}>
        {code}
      </pre>
    </div>
  );
}
