import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Trash2, Bookmark } from 'lucide-react';
import styles from './Metrics.module.css';

export default function MetricsTagsView() {
  const [kpiTags, setKpiTags] = useState([]);
  const [enrichedTags, setEnrichedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchKpiTags();
  }, []);

  async function fetchKpiTags() {
    try {
      setLoading(true);
      setError(null);

      // Get current user's team
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setKpiTags([]);
        setEnrichedTags([]);
        setLoading(false);
        return;
      }

      // Fetch KPI tags for the team
      const { data, error } = await supabase
        .from('team_kpi_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKpiTags(data || []);

      // Fetch details from BigQuery if we have tags
      if (data && data.length > 0) {
        await fetchKpiDetails(data);
      } else {
        setEnrichedTags([]);
      }
    } catch (err) {
      console.error('Error fetching metric tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchKpiDetails(tags) {
    try {
      const codes = tags.map(tag => tag.kpi_code);
      
      const response = await fetch('/api/kpis-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch KPI details');
      }

      // Create map of code -> data
      const detailsMap = {};
      result.data.forEach(detail => {
        detailsMap[detail.code] = detail;
      });

      // Merge tags with details
      const enriched = tags.map(tag => ({
        ...tag,
        details: detailsMap[tag.kpi_code] || null
      }));

      setEnrichedTags(enriched);
    } catch (err) {
      console.error('Error fetching metric details:', err);
      // If BigQuery fetch fails, just use the tags without details
      setEnrichedTags(tags.map(tag => ({ ...tag, details: null })));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this metric tag?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('team_kpi_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchKpiTags();
    } catch (err) {
      console.error('Error deleting metric tag:', err);
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading metric tags...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {enrichedTags.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <Bookmark size={48} />
          <h3>No Tagged Metrics Yet</h3>
          <p>Use the "Browse All" tab to search and tag storyteller metrics you want to follow for your team.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.kpiTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Label</th>
                <th>Setting</th>
                <th>Source</th>
                <th>Description</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrichedTags.map(tag => {
                const details = tag.details;
                return (
                  <tr key={tag.id}>
                    <td className={styles.codeCell}>
                      <code>{tag.kpi_code}</code>
                    </td>
                    <td className={styles.nameCell}>
                      {details?.name || '...'}
                    </td>
                    <td>{details?.label || '...'}</td>
                    <td>
                      <span className={styles.settingBadge}>
                        {details?.setting || '...'}
                      </span>
                    </td>
                    <td>{details?.source || '...'}</td>
                    <td className={styles.descriptionCell}>
                      {details?.description || '...'}
                    </td>
                    <td>{new Date(tag.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</td>
                    <td>
                      <button
                        className="sectionHeaderButton"
                        onClick={() => handleDelete(tag.id)}
                        title="Remove metric"
                        style={{ color: '#dc2626' }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

