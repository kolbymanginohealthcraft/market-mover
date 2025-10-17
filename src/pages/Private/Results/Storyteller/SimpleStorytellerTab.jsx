import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3 } from "lucide-react";
import styles from "./Storyteller.module.css";

export default function SimpleStorytellerTab({ provider }) {
  const navigate = useNavigate();

  const handleSeeMarketAnalysis = () => {
    navigate(`/app/${provider.dhc}/market/storyteller`);
  };

  return (
    <div className={styles.container}>
      {/* Market Analysis CTA */}
      <div className={styles.marketCta}>
        <div className={styles.marketCtaContent}>
          <div>
            <h3 className={styles.marketCtaTitle}>
              <BarChart3 size={20} />
              Quality Measures & Benchmarking
            </h3>
            <p className={styles.marketCtaDescription}>
              View detailed quality measures and compare this provider's performance against market and national averages
            </p>
          </div>
          <button onClick={handleSeeMarketAnalysis} className={styles.marketCtaButton}>
            <span>View Market Analysis</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.infoCard}>
        <h4>Available in Market Analysis</h4>
        <p>
          The Storyteller feature provides comprehensive quality performance analysis including:
        </p>
        <ul className={styles.featureList}>
          <li>
            <strong>Quality Scorecard</strong> - See all quality measures for this provider with scores and percentiles
          </li>
          <li>
            <strong>Market Benchmarking</strong> - Compare performance against nearby providers
          </li>
          <li>
            <strong>National Benchmarking</strong> - See how the provider ranks nationally
          </li>
          <li>
            <strong>Trend Analysis</strong> - Track performance over time across multiple measures
          </li>
        </ul>
        <p className={styles.noteText}>
          This analysis requires market context to provide meaningful benchmarks and comparisons.
        </p>
      </div>
    </div>
  );
}

