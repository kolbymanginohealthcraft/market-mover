import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Trash2, Bookmark } from 'lucide-react';
import styles from './Procedures.module.css';

export default function ProceduresTagsView() {
  const [procedureTags, setProcedureTags] = useState([]);
  const [enrichedTags, setEnrichedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    fetchProcedureTags();
  }, []);

  async function fetchProcedureTags() {
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
        setProcedureTags([]);
        setEnrichedTags([]);
        setLoading(false);
        return;
      }

      // Fetch procedure tags for the team
      const { data, error } = await supabase
        .from('team_procedure_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcedureTags(data || []);

      // Fetch details from BigQuery if we have tags
      if (data && data.length > 0) {
        await fetchProcedureDetails(data);
      } else {
        setEnrichedTags([]);
      }
    } catch (err) {
      console.error('Error fetching procedure tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProcedureDetails(tags) {
    try {
      const codes = tags.map(tag => tag.procedure_code);
      
      // Fetch both details and volume in parallel
      const [detailsResponse, volumeResponse] = await Promise.all([
        fetch('/api/procedures-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes })
        }),
        fetch('/api/procedures-volume-by-code', {
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
        throw new Error(detailsResult.message || 'Failed to fetch procedure details');
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
            total_volume: vol.total_volume,
            avg_charge: vol.avg_charge
          };
        });
      }

      // Merge tags with details and volume
      const enriched = tags.map(tag => ({
        ...tag,
        details: detailsMap[tag.procedure_code] || null,
        annual_volume: volumeMap[tag.procedure_code]?.total_volume || 0,
        avg_charge: volumeMap[tag.procedure_code]?.avg_charge || 0
      }));

      setEnrichedTags(enriched);
      
      // Log all available columns from first result
      if (detailsResult.data.length > 0) {
        console.log('Available columns:', Object.keys(detailsResult.data[0]));
        console.log('Sample data:', detailsResult.data[0]);
      }
    } catch (err) {
      console.error('Error fetching procedure details:', err);
      // If BigQuery fetch fails, just use the tags without details
      setEnrichedTags(tags.map(tag => ({ ...tag, details: null, annual_volume: 0, avg_charge: 0 })));
    }
  }

  function handleMouseEnter(e, rowId) {
    setHoveredRow(rowId);
    const rect = e.currentTarget.getBoundingClientRect();
    
    setTooltipPosition({
      x: rect.left + (rect.width / 2),
      y: rect.top - 10
    });
  }

  function handleMouseLeave() {
    setHoveredRow(null);
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this procedure tag?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('team_procedure_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProcedureTags();
    } catch (err) {
      console.error('Error deleting procedure tag:', err);
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading procedure tags...</p>
      </div>
    );
  }

  return (
    <div className={styles.viewContainer}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {enrichedTags.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <Bookmark size={48} />
          <h3>No Tagged Procedures Yet</h3>
          <p>Use the "Browse All" tab to search and tag procedure codes for your team.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.procedureTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Code System</th>
                <th>Summary</th>
                <th>Service Category</th>
                <th>Service Line</th>
                <th>Subservice Line</th>
                <th>Annual Volume</th>
                <th>Avg Charge</th>
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
                      <code>{tag.procedure_code}</code>
                    </td>
                    <td>{details?.code_system || '...'}</td>
                    <td 
                      className={styles.summaryCell}
                      onMouseEnter={(e) => handleMouseEnter(e, tag.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {details ? (
                        <span className={styles.summaryText}>
                          {details.code_summary || 'N/A'}
                        </span>
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
                    <td className={styles.chargeCell}>
                      ${Number(tag.avg_charge || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        title="Remove procedure"
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

      {/* Tooltip for full description */}
      {hoveredRow && (
        <div 
          ref={tooltipRef}
          className={styles.descriptionTooltip}
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {enrichedTags.find(tag => tag.id === hoveredRow)?.details?.code_description || 'No description available'}
        </div>
      )}
    </div>
  );
}

