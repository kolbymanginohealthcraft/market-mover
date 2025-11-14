import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Trash2, Bookmark } from 'lucide-react';
import DiagnosisTooltip from '../../../components/UI/DiagnosisTooltip';
import { apiUrl } from '../../../utils/api';
import styles from './Diagnoses.module.css';

export default function DiagnosesTagsView() {
  const [diagnosisTags, setDiagnosisTags] = useState([]);
  const [enrichedTags, setEnrichedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiagnosisTags();
  }, []);

  async function fetchDiagnosisTags() {
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
        setDiagnosisTags([]);
        setEnrichedTags([]);
        setLoading(false);
        return;
      }

      // Fetch diagnosis tags for the team
      const { data, error } = await supabase
        .from('team_diagnosis_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiagnosisTags(data || []);

      // Fetch details from BigQuery if we have tags
      if (data && data.length > 0) {
        await fetchDiagnosisDetails(data);
      } else {
        setEnrichedTags([]);
      }
    } catch (err) {
      console.error('Error fetching diagnosis tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDiagnosisDetails(tags) {
    try {
      const codes = tags.map(tag => tag.diagnosis_code);
      
      // Fetch both details and volume in parallel
      const [detailsResponse, volumeResponse] = await Promise.all([
        fetch(apiUrl('/api/diagnoses-details'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes })
        }),
        fetch(apiUrl('/api/diagnoses-volume-by-code'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes })
        })
      ]);

      const [detailsResult, volumeResult] = await Promise.all([
        detailsResponse.json(),
        volumeResponse.json()
      ]);

      if (!detailsResult.success) {
        throw new Error(detailsResult.message || 'Failed to fetch diagnosis details');
      }

      // Create maps of code -> data
      const detailsMap = {};
      const volumeMap = {};
      
      detailsResult.data.forEach(detail => {
        detailsMap[detail.code] = detail;
      });
      
      if (volumeResult.success) {
        volumeResult.data.forEach(vol => {
          volumeMap[vol.code] = {
            total_volume: vol.total_volume
          };
        });
      }

      // Merge tags with details and volume
      const enriched = tags.map(tag => ({
        ...tag,
        details: detailsMap[tag.diagnosis_code] || null,
        annual_volume: volumeMap[tag.diagnosis_code]?.total_volume || 0
      }));

      setEnrichedTags(enriched);
      
      // Log all available columns from first result
      if (detailsResult.data.length > 0) {
        console.log('Available columns:', Object.keys(detailsResult.data[0]));
        console.log('Sample data:', detailsResult.data[0]);
      }
    } catch (err) {
      console.error('Error fetching diagnosis details:', err);
      // If BigQuery fetch fails, just use the tags without details
      setEnrichedTags(tags.map(tag => ({ ...tag, details: null, annual_volume: 0 })));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this diagnosis tag?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('team_diagnosis_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDiagnosisTags();
    } catch (err) {
      console.error('Error deleting diagnosis tag:', err);
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading diagnosis tags...</p>
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
          <h3>No Tagged Diagnoses Yet</h3>
          <p>Use the "Browse All" tab to search and tag diagnosis codes for your team.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.diagnosisTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Code System</th>
                <th>Summary</th>
                <th>Service Category</th>
                <th>Service Line</th>
                <th>Subservice Line</th>
                <th>Annual Volume</th>
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
                      <code>{tag.diagnosis_code}</code>
                    </td>
                    <td>{details?.code_system || '...'}</td>
                    <td className={styles.summaryCell}>
                      {details ? (
                        <DiagnosisTooltip
                          code={tag.diagnosis_code}
                          summary={details.code_summary}
                          description={details.code_description}
                          category={details.service_category_description}
                          serviceLine={details.service_line_description}
                          subserviceLine={details.subservice_line_description}
                        >
                          {details.code_summary || 'N/A'}
                        </DiagnosisTooltip>
                      ) : (
                        '...'
                      )}
                    </td>
                    <td>{details?.service_category_description || '...'}</td>
                    <td>{details?.service_line_description || '...'}</td>
                    <td>{details?.subservice_line_description || '...'}</td>
                    <td className={styles.volumeCell}>
                      {tag.annual_volume ? tag.annual_volume.toLocaleString() : '0'}
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
                        title="Remove diagnosis"
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

