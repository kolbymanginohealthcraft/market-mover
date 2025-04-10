// src/pages/PerformanceTab.jsx

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ResponsiveBar } from '@nivo/bar';
import styles from './PerformanceTab.module.css';

export default function PerformanceTab({ provider }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('qm-provider')
        .select('metric_name, score, percentile')
        .eq('ccn', provider.ccn);

      if (error) {
        console.error('Error fetching performance metrics:', error);
        setMetrics([]);
      } else {
        setMetrics(data);
      }

      setLoading(false);
    };

    if (provider?.ccn) fetchMetrics();
  }, [provider]);

  const chartData = metrics.map((m) => ({
    metric: m.metric_name,
    percentile: m.percentile,
    score: m.score,
  }));

  if (loading) {
    return <p style={{ padding: '2rem' }}>Loading performance metrics...</p>;
  }

  if (metrics.length === 0) {
    return <p style={{ padding: '2rem' }}>No performance data available.</p>;
  }

  return (
    <div className={styles.container}>
      <h3>Performance Compared to Market</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveBar
          data={chartData}
          keys={['percentile']}
          indexBy="metric"
          layout="horizontal"
          margin={{ top: 20, right: 80, bottom: 50, left: 200 }}
          padding={0.3}
          colors={['#3FB985']}
          borderRadius={4}
          axisTop={null}
          axisRight={null}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisBottom={{
            tickValues: 5,
            tickSize: 0,
            tickPadding: 8,
            format: (v) => `${v}%`,
          }}
          labelSkipWidth={100}
          labelTextColor="#265947"
          tooltip={({ data }) => (
            <div style={{ background: '#fff', padding: '6px 12px', border: '1px solid #ccc' }}>
              <strong>{data.metric}</strong>
              <br />
              Score: {data.score}
              <br />
              Percentile: {data.percentile}%
            </div>
          )}
        />
      </div>
    </div>
  );
}
