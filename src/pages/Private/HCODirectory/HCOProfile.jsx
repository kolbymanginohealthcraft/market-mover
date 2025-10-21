import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './HCOProfile.module.css';
import Spinner from '../../../components/Buttons/Spinner';
import SimpleLocationMap from '../../../components/Maps/SimpleLocationMap';
import { 
  Building2,
  MapPin,
  ArrowLeft,
  Building,
  Network,
  FileText,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
  GitBranch
} from 'lucide-react';

/**
 * HCO Profile - Detailed Organization View
 * 
 * Features:
 * - Complete organization information
 * - Map view of location
 * - Procedure volume metrics
 * - Top procedures performed
 * - All database fields displayed
 */

export default function HCOProfile() {
  const { npi } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [volumeMetrics, setVolumeMetrics] = useState(null);
  const [topProcedures, setTopProcedures] = useState([]);
  const [diagnosisMetrics, setDiagnosisMetrics] = useState(null);
  const [topDiagnoses, setTopDiagnoses] = useState([]);
  const [pathways, setPathways] = useState({ upstream: [], downstream: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Provider perspectives
  const [perspective, setPerspective] = useState('billing');
  const [upstreamPerspective, setUpstreamPerspective] = useState('billing');
  const [downstreamPerspective, setDownstreamPerspective] = useState('billing');
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, pathways
  
  // Toggle sections
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    taxonomies: true,
    affiliations: true,
    procedures: true,
    diagnoses: true,
    upstream: true,
    downstream: true,
    allFields: false
  });
  
  useEffect(() => {
    if (npi) {
      fetchProfile();
    }
  }, [npi, perspective, upstreamPerspective, downstreamPerspective]);
  
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        perspective,
        upstreamPerspective,
        downstreamPerspective
      });
      const response = await fetch(`/api/hco-directory/profile/${npi}?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load profile');
      }
      
      setProfile(result.data.profile);
      setVolumeMetrics(result.data.volumeMetrics);
      setTopProcedures(result.data.topProcedures);
      setDiagnosisMetrics(result.data.diagnosisMetrics);
      setTopDiagnoses(result.data.topDiagnoses);
      setPathways(result.data.pathways || { upstream: [], downstream: [] });
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseInt(num).toLocaleString();
  };
  
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Spinner />
          <p>Loading organization profile...</p>
        </div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Error Loading Profile</h2>
          <p>{error || 'Organization not found'}</p>
          <button 
            onClick={() => navigate('/app/hco-directory')}
            className="sectionHeaderButton"
          >
            <ArrowLeft size={14} />
            Back to Directory
          </button>
        </div>
      </div>
    );
  }
  
  const organizationName = profile.healthcare_organization_name || profile.name;
  const hasLocation = profile.primary_address_lat && profile.primary_address_long;
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          onClick={() => navigate('/app/hco-directory')}
          className="sectionHeaderButton primary"
        >
          <ArrowLeft size={16} />
          Back to Directory
        </button>
        <div className={styles.headerTitle}>
          <Building2 size={24} />
          <div>
            <h1>{organizationName}</h1>
            <p>NPI: {profile.npi}</p>
          </div>
        </div>
        <div className={styles.perspectiveSelector}>
          <label>Main Perspective:</label>
          <select value={perspective} onChange={(e) => setPerspective(e.target.value)}>
            <option value="billing">Billing Provider</option>
            <option value="facility">Facility Provider</option>
            <option value="service_location">Service Location</option>
            <option value="performing">Performing Provider</option>
          </select>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Info size={16} />
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'pathways' ? styles.active : ''}`}
          onClick={() => setActiveTab('pathways')}
        >
          <GitBranch size={16} />
          Referral Pathways
        </button>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Column - Info Sections */}
        <div className={styles.leftColumn}>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
          
          {/* Basic Information */}
          <div className={styles.section}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('basicInfo')}
            >
              <div className={styles.sectionTitle}>
                <Info size={16} />
                <h3>Basic Information</h3>
              </div>
              {expandedSections.basicInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.basicInfo && (
              <div className={styles.sectionContent}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Organization Name</label>
                    <div>{organizationName}</div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <label>NPI</label>
                    <div>{profile.npi}</div>
                  </div>
                  
                  {profile.definitive_id && (
                    <div className={styles.infoItem}>
                      <label>Definitive ID</label>
                      <div>{profile.definitive_id}</div>
                    </div>
                  )}
                  
                  {profile.definitive_name && (
                    <div className={styles.infoItem}>
                      <label>Definitive Name</label>
                      <div>{profile.definitive_name}</div>
                    </div>
                  )}
                  
                  {profile.definitive_firm_type && (
                    <div className={styles.infoItem}>
                      <label>Firm Type</label>
                      <div>{profile.definitive_firm_type}</div>
                    </div>
                  )}
                  
                  {profile.definitive_firm_type_full && (
                    <div className={styles.infoItem}>
                      <label>Firm Type (Full)</label>
                      <div>{profile.definitive_firm_type_full}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Address & Location */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} style={{ cursor: 'default' }}>
              <div className={styles.sectionTitle}>
                <MapPin size={16} />
                <h3>Address & Location</h3>
              </div>
            </div>
            
            <div className={styles.sectionContent}>
              <div className={styles.addressBlock}>
                {profile.primary_address_line_1 && (
                  <div>{profile.primary_address_line_1}</div>
                )}
                {profile.primary_address_line_2 && (
                  <div>{profile.primary_address_line_2}</div>
                )}
                <div>
                  {profile.primary_address_city && `${profile.primary_address_city}, `}
                  {profile.primary_address_state_or_province} {profile.primary_address_zip5}
                  {profile.primary_address_zip_plus_4 && `-${profile.primary_address_zip_plus_4}`}
                </div>
                {profile.primary_address_county && (
                  <div className={styles.county}>{profile.primary_address_county} County</div>
                )}
                {hasLocation && (
                  <div className={styles.coordinates}>
                    Coordinates: {parseFloat(profile.primary_address_lat).toFixed(6)}, {parseFloat(profile.primary_address_long).toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Taxonomies */}
          <div className={styles.section}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('taxonomies')}
            >
              <div className={styles.sectionTitle}>
                <FileText size={16} />
                <h3>Taxonomies</h3>
              </div>
              {expandedSections.taxonomies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.taxonomies && (
              <div className={styles.sectionContent}>
                <div className={styles.infoGrid}>
                  {profile.primary_taxonomy_code && (
                    <div className={styles.infoItem}>
                      <label>Primary Taxonomy Code</label>
                      <div>{profile.primary_taxonomy_code}</div>
                    </div>
                  )}
                  
                  {profile.primary_taxonomy_classification && (
                    <div className={styles.infoItem}>
                      <label>Classification</label>
                      <div>{profile.primary_taxonomy_classification}</div>
                    </div>
                  )}
                  
                  {profile.primary_taxonomy_consolidated_specialty && (
                    <div className={styles.infoItem}>
                      <label>Consolidated Specialty</label>
                      <div>{profile.primary_taxonomy_consolidated_specialty}</div>
                    </div>
                  )}
                  
                  {profile.primary_taxonomy_grouping && (
                    <div className={styles.infoItem}>
                      <label>Grouping</label>
                      <div>{profile.primary_taxonomy_grouping}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Affiliations */}
          <div className={styles.section}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('affiliations')}
            >
              <div className={styles.sectionTitle}>
                <Network size={16} />
                <h3>Affiliations</h3>
              </div>
              {expandedSections.affiliations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.affiliations && (
              <div className={styles.sectionContent}>
                <div className={styles.infoGrid}>
                  {profile.hospital_parent_id ? (
                    <>
                      <div className={styles.infoItem}>
                        <label>Hospital Parent ID</label>
                        <div>{profile.hospital_parent_id}</div>
                      </div>
                      {profile.hospital_parent_name && (
                        <div className={styles.infoItem}>
                          <label>Hospital Parent Name</label>
                          <div>{profile.hospital_parent_name}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.infoItem}>
                      <label>Hospital Parent</label>
                      <div className={styles.notAvailable}>None</div>
                    </div>
                  )}
                  
                  {profile.physician_group_parent_id ? (
                    <>
                      <div className={styles.infoItem}>
                        <label>Physician Group Parent ID</label>
                        <div>{profile.physician_group_parent_id}</div>
                      </div>
                      {profile.physician_group_parent_name && (
                        <div className={styles.infoItem}>
                          <label>Physician Group Parent Name</label>
                          <div>{profile.physician_group_parent_name}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.infoItem}>
                      <label>Physician Group Parent</label>
                      <div className={styles.notAvailable}>None</div>
                    </div>
                  )}
                  
                  {profile.network_id ? (
                    <>
                      <div className={styles.infoItem}>
                        <label>Network ID</label>
                        <div>{profile.network_id}</div>
                      </div>
                      {profile.network_name && (
                        <div className={styles.infoItem}>
                          <label>Network Name</label>
                          <div>{profile.network_name}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.infoItem}>
                      <label>Network</label>
                      <div className={styles.notAvailable}>None</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Procedure Volume */}
          {volumeMetrics && (
            <div className={styles.section}>
              <button 
                className={styles.sectionHeader}
                onClick={() => toggleSection('procedures')}
              >
                <div className={styles.sectionTitle}>
                  <BarChart3 size={16} />
                  <h3>Procedure Volume (Last 12 Months)</h3>
                </div>
                {expandedSections.procedures ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {expandedSections.procedures && (
                <div className={styles.sectionContent}>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                      <label>Total Procedures</label>
                      <div className={styles.metricValue}>
                        {formatNumber(volumeMetrics.totalProcedures)}
                      </div>
                    </div>
                    
                    <div className={styles.metricCard}>
                      <label>Total Charges</label>
                      <div className={styles.metricValue}>
                        {formatCurrency(volumeMetrics.totalCharges)}
                      </div>
                    </div>
                    
                    <div className={styles.metricCard}>
                      <label>Unique Procedures</label>
                      <div className={styles.metricValue}>
                        {formatNumber(volumeMetrics.uniqueProcedures)}
                      </div>
                    </div>
                    
                    <div className={styles.metricCard}>
                      <label>Months with Data</label>
                      <div className={styles.metricValue}>
                        {volumeMetrics.monthsWithData}
                      </div>
                    </div>
                  </div>
                  
                  {topProcedures && topProcedures.length > 0 && (
                    <div className={styles.proceduresTable}>
                      <h4>Top Procedures</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Service Line</th>
                            <th>Count</th>
                            <th>Charges</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProcedures.map((proc, idx) => (
                            <tr key={idx}>
                              <td className={styles.code}>{proc.code}</td>
                              <td>{proc.code_description || '-'}</td>
                              <td>{proc.service_line_description || '-'}</td>
                              <td>{formatNumber(proc.procedure_count)}</td>
                              <td>{formatCurrency(proc.total_charges)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Diagnosis Volume */}
          {diagnosisMetrics && (
            <div className={styles.section}>
              <button 
                className={styles.sectionHeader}
                onClick={() => toggleSection('diagnoses')}
              >
                <div className={styles.sectionTitle}>
                  <FileText size={16} />
                  <h3>Diagnosis Volume (Last 12 Months)</h3>
                </div>
                {expandedSections.diagnoses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {expandedSections.diagnoses && (
                <div className={styles.sectionContent}>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                      <label>Total Diagnoses</label>
                      <div className={styles.metricValue}>
                        {formatNumber(diagnosisMetrics.totalDiagnoses)}
                      </div>
                    </div>
                    
                    <div className={styles.metricCard}>
                      <label>Unique Diagnoses</label>
                      <div className={styles.metricValue}>
                        {formatNumber(diagnosisMetrics.uniqueDiagnoses)}
                      </div>
                    </div>
                    
                    <div className={styles.metricCard}>
                      <label>Months with Data</label>
                      <div className={styles.metricValue}>
                        {diagnosisMetrics.monthsWithData}
                      </div>
                    </div>
                  </div>
                  
                  {topDiagnoses && topDiagnoses.length > 0 && (
                    <div className={styles.proceduresTable}>
                      <h4>Top Diagnoses</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topDiagnoses.map((diag, idx) => (
                            <tr key={idx}>
                              <td className={styles.code}>{diag.code}</td>
                              <td>{diag.code_description || '-'}</td>
                              <td>{formatNumber(diag.diagnosis_count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* All Fields - Overview Tab Only */}
          <div className={styles.section}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('allFields')}
            >
              <div className={styles.sectionTitle}>
                <Building size={16} />
                <h3>All Database Fields</h3>
              </div>
              {expandedSections.allFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {expandedSections.allFields && (
              <div className={styles.sectionContent}>
                <div className={styles.allFieldsGrid}>
                  {Object.entries(profile).map(([key, value]) => (
                    <div key={key} className={styles.fieldItem}>
                      <label>{key}</label>
                      <div>{value !== null && value !== undefined ? String(value) : <span className={styles.notAvailable}>N/A</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

            </>
          )}
          
          {/* Pathways Tab */}
          {activeTab === 'pathways' && (
            <>
              {/* Upstream Pathways */}
              <div className={styles.section}>
                <button 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('upstream')}
                >
                  <div className={styles.sectionTitle}>
                    <ArrowUpCircle size={16} />
                    <h3>Upstream Pathways (Where Patients Came From)</h3>
                  </div>
                  {expandedSections.upstream ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {expandedSections.upstream && (
                  <div className={styles.sectionContent}>
                    <div className={styles.pathwayControls}>
                      <p className={styles.pathwayDescription}>
                        Top 50 providers that sent patients to this organization (last 12 months, within 14 days)
                      </p>
                      <div className={styles.pathwayPerspective}>
                        <label>Show as:</label>
                        <select value={upstreamPerspective} onChange={(e) => setUpstreamPerspective(e.target.value)}>
                          <option value="billing">Billing</option>
                          <option value="facility">Facility</option>
                          <option value="service_location">Service Location</option>
                          <option value="performing">Performing</option>
                        </select>
                      </div>
                    </div>
                    {pathways && pathways.upstream && pathways.upstream.length > 0 ? (
                      <div className={styles.proceduresTable}>
                        <table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Provider</th>
                              <th>Taxonomy</th>
                              <th>Location</th>
                              <th>Patient Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pathways.upstream.map((provider, idx) => (
                              <tr key={idx}>
                                <td className={styles.rank}>{idx + 1}</td>
                                <td>
                                  <div className={styles.providerCell}>
                                    <div className={styles.providerName}>{provider.provider_name}</div>
                                    <div className={styles.providerNpi}>NPI: {provider.npi}</div>
                                  </div>
                                </td>
                                <td>{provider.taxonomy || '-'}</td>
                                <td>{provider.city}, {provider.state}</td>
                                <td className={styles.patientCount}>{formatNumber(provider.patient_count)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.noData}>No upstream pathway data available</div>
                    )}
                  </div>
                )}
              </div>

              {/* Downstream Pathways */}
              <div className={styles.section}>
                <button 
                  className={styles.sectionHeader}
                  onClick={() => toggleSection('downstream')}
                >
                  <div className={styles.sectionTitle}>
                    <ArrowDownCircle size={16} />
                    <h3>Downstream Pathways (Where Patients Went To)</h3>
                  </div>
                  {expandedSections.downstream ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {expandedSections.downstream && (
                  <div className={styles.sectionContent}>
                    <div className={styles.pathwayControls}>
                      <p className={styles.pathwayDescription}>
                        Top 50 providers that received patients from this organization (last 12 months, within 14 days)
                      </p>
                      <div className={styles.pathwayPerspective}>
                        <label>Show as:</label>
                        <select value={downstreamPerspective} onChange={(e) => setDownstreamPerspective(e.target.value)}>
                          <option value="billing">Billing</option>
                          <option value="facility">Facility</option>
                          <option value="service_location">Service Location</option>
                          <option value="performing">Performing</option>
                        </select>
                      </div>
                    </div>
                    {pathways && pathways.downstream && pathways.downstream.length > 0 ? (
                      <div className={styles.proceduresTable}>
                        <table>
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Provider</th>
                              <th>Taxonomy</th>
                              <th>Location</th>
                              <th>Patient Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pathways.downstream.map((provider, idx) => (
                              <tr key={idx}>
                                <td className={styles.rank}>{idx + 1}</td>
                                <td>
                                  <div className={styles.providerCell}>
                                    <div className={styles.providerName}>{provider.provider_name}</div>
                                    <div className={styles.providerNpi}>NPI: {provider.npi}</div>
                                  </div>
                                </td>
                                <td>{provider.taxonomy || '-'}</td>
                                <td>{provider.city}, {provider.state}</td>
                                <td className={styles.patientCount}>{formatNumber(provider.patient_count)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.noData}>No downstream pathway data available</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Right Column - Map */}
        <div className={styles.rightColumn}>
          {hasLocation && (
            <div className={styles.mapSection}>
              <h3>
                <MapPin size={16} />
                Location Map
              </h3>
              <div className={styles.mapContainer}>
                <SimpleLocationMap
                  center={{
                    lat: parseFloat(profile.primary_address_lat),
                    lng: parseFloat(profile.primary_address_long)
                  }}
                  zoom={15}
                  markerLabel={organizationName}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

