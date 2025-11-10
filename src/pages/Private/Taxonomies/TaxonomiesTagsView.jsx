import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Trash2, Bookmark, ChevronDown } from 'lucide-react';
import TaxonomyTooltip from '../../../components/UI/TaxonomyTooltip';
import Dropdown from '../../../components/Buttons/Dropdown';
import styles from './Taxonomies.module.css';
import { ensureSingleTeamTaxonomyTag } from '../../../utils/taxonomyTagUtils';

const TAG_TYPES = [
  { value: 'staff', label: 'Staff' },
  { value: 'my_setting', label: 'My Setting' },
  { value: 'upstream', label: 'Upstream' },
  { value: 'downstream', label: 'Downstream' }
];

const TAG_TYPE_MAP = {
  staff: 'Staff',
  my_setting: 'My Setting',
  upstream: 'Upstream',
  downstream: 'Downstream'
};

export default function TaxonomiesTagsView() {
  const [taxonomyTags, setTaxonomyTags] = useState([]);
  const [enrichedTags, setEnrichedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tagTypeDropdownOpen, setTagTypeDropdownOpen] = useState({});

  useEffect(() => {
    fetchTaxonomyTags();
  }, []);

  async function fetchTaxonomyTags() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setTaxonomyTags([]);
        setEnrichedTags([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('team_taxonomy_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const uniqueTags = await ensureSingleTeamTaxonomyTag(
        supabase,
        profile.team_id,
        data || []
      );

      setTaxonomyTags(uniqueTags);

      if (uniqueTags && uniqueTags.length > 0) {
        await fetchTaxonomyDetails(uniqueTags);
      } else {
        setEnrichedTags([]);
      }
    } catch (err) {
      console.error('Error fetching taxonomy tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaxonomyDetails(tags) {
    try {
      const codes = tags.map(tag => tag.taxonomy_code);
      
      const detailsResponse = await fetch('/api/taxonomies-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes })
      });

      const detailsResult = await detailsResponse.json();

      if (!detailsResult.success) {
        throw new Error(detailsResult.message || 'Failed to fetch taxonomy details');
      }

      const detailsMap = {};
      detailsResult.data.forEach(detail => {
        detailsMap[detail.code] = detail;
      });

      const enriched = tags.map(tag => ({
        ...tag,
        details: detailsMap[tag.taxonomy_code] || null
      }));

      setEnrichedTags(enriched);
      
      if (detailsResult.data.length > 0) {
        console.log('Available columns:', Object.keys(detailsResult.data[0]));
        console.log('Sample data:', detailsResult.data[0]);
      }
    } catch (err) {
      console.error('Error fetching taxonomy details:', err);
      setEnrichedTags(tags.map(tag => ({ ...tag, details: null })));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this taxonomy tag?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('team_taxonomy_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTaxonomyTags();
    } catch (err) {
      console.error('Error deleting taxonomy tag:', err);
      setError(err.message);
    }
  }

  async function handleChangeTagType(tagId, currentTag, newTagType) {
    if (currentTag.tag_type === newTagType) {
      setTagTypeDropdownOpen({});
      return;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('team_taxonomy_tags')
        .update({
          tag_type: newTagType,
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId);

      if (updateError) throw updateError;

      setTagTypeDropdownOpen({});
      await fetchTaxonomyTags();
    } catch (err) {
      console.error('Error changing tag type:', err);
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading taxonomy tags...</p>
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
          <h3>No Tagged Taxonomies Yet</h3>
          <p>Use the "Browse All" tab to search and tag taxonomy codes for your team.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.taxonomyTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Tag Type</th>
                <th>Grouping</th>
                <th>Classification</th>
                <th>Specialization</th>
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
                      <code>{tag.taxonomy_code}</code>
                    </td>
                    <td>
                      <Dropdown
                        trigger={
                          <button 
                            className="sectionHeaderButton"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: tag.tag_type === 'staff' ? '#e0f2fe' :
                                               tag.tag_type === 'my_setting' ? '#dcfce7' :
                                               tag.tag_type === 'upstream' ? '#fef3c7' :
                                               '#fce7f3',
                              color: tag.tag_type === 'staff' ? '#0369a1' :
                                     tag.tag_type === 'my_setting' ? '#166534' :
                                     tag.tag_type === 'upstream' ? '#92400e' :
                                     '#9f1239',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {TAG_TYPE_MAP[tag.tag_type] || tag.tag_type}
                            <ChevronDown size={10} style={{ marginLeft: '4px' }} />
                          </button>
                        }
                        isOpen={tagTypeDropdownOpen[tag.id] || false}
                        onToggle={(open) => {
                          setTagTypeDropdownOpen(prev => ({
                            ...prev,
                            [tag.id]: open
                          }));
                        }}
                        className={styles.dropdownMenu}
                      >
                        {TAG_TYPES.map(tagType => {
                          const isCurrent = tag.tag_type === tagType.value;
                          return (
                            <div
                              key={tagType.value}
                              className={styles.dropdownItem}
                              onClick={() => {
                                if (!isCurrent) {
                                  handleChangeTagType(tag.id, tag, tagType.value);
                                }
                              }}
                              style={isCurrent ? { 
                                opacity: 0.5, 
                                cursor: 'default',
                                backgroundColor: 'rgba(0, 192, 139, 0.1)'
                              } : {}}
                            >
                              {tagType.label}
                              {isCurrent && <span style={{ marginLeft: '8px', fontSize: '11px' }}>(current)</span>}
                            </div>
                          );
                        })}
                      </Dropdown>
                    </td>
                    <td>{details?.grouping || '...'}</td>
                    <td className={styles.summaryCell}>
                      {details ? (
                        <TaxonomyTooltip
                          code={tag.taxonomy_code}
                          grouping={details.grouping}
                          classification={details.classification}
                          specialization={details.specialization}
                          definition={details.definition}
                          notes={details.notes}
                        >
                          {details.classification || 'N/A'}
                        </TaxonomyTooltip>
                      ) : (
                        '...'
                      )}
                    </td>
                    <td>{details?.specialization || 'N/A'}</td>
                    <td>{new Date(tag.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</td>
                    <td>
                      <button
                        className="sectionHeaderButton"
                        onClick={() => handleDelete(tag.id)}
                        title="Remove taxonomy"
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

