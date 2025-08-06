import { useState, useEffect } from "react";
import { supabase } from "../../../app/supabaseClient";
import Button from "../../../components/Buttons/Button";
import Spinner from "../../../components/Buttons/Spinner";
import { trackActivity } from "../../../utils/activityTracker";
import styles from "./CompanyTab.module.css";

export default function CompanyTab() {
  const [companyProfile, setCompanyProfile] = useState({
    company_name: "",
    company_type: "",
    industry_vertical: ""
  });

  const [originalCompanyProfile, setOriginalCompanyProfile] = useState({
    company_name: "",
    company_type: "",
    industry_vertical: ""
  });

  const [targetAudience, setTargetAudience] = useState({
    organization_types: [],
    practitioner_specialties: []
  });

  const [originalTargetAudience, setOriginalTargetAudience] = useState({
    organization_types: [],
    practitioner_specialties: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [footerVisible, setFooterVisible] = useState(false);

  // Predefined options for dropdowns
  const companyTypes = [
    { value: "Provider", label: "Provider", shortLabel: "Provider", helpText: "Healthcare organizations that deliver patient care and clinical services" },
    { value: "Supplier", label: "Supplier", shortLabel: "Supplier", helpText: "Companies that provide products, services, or solutions to healthcare organizations" }
  ];

  const providerVerticals = [
    "Acute Care / Hospital",
    "Post-Acute Care (SNF, LTCH, IRF)",
    "Assisted Living / Senior Care",
    "Home Health and Hospice",
    "Outpatient Clinics",
    "Physician Practice"
  ];

  const supplierVerticals = [
    "Technology (EMR, Analytics, Telehealth)",
    "Staffing / Management Services",
    "Consulting / Advisory",
    "Rehabilitation Therapy",
    "DME / Medical Equipment",
    "Pharmaceuticals / Lab",
    "Financial Services"
  ];

  const organizationTypes = [
    "Hospitals",
    "Health Systems",
    "Medical Groups",
    "Specialty Clinics",
    "Rehabilitation Centers",
    "Senior Care Facilities",
    "Home Health Agencies",
    "Hospice Organizations",
    "Diagnostic Centers",
    "Urgent Care Centers"
  ];

  const practitionerSpecialties = [
    "Primary Care",
    "Cardiology",
    "Orthopedics",
    "Neurology",
    "Oncology",
    "Pediatrics",
    "Obstetrics/Gynecology",
    "Dermatology",
    "Psychiatry",
    "Physical Therapy",
    "Occupational Therapy",
    "Speech Therapy",
    "Radiology",
    "Laboratory Services",
    "Emergency Medicine",
    "Surgery",
    "Anesthesiology",
    "Rehabilitation Medicine",
    "Palliative Care",
    "Geriatrics"
  ];

  useEffect(() => {
    fetchCompanyData();
  }, []);

  // Check if any changes have been made
  const hasChanges = 
    companyProfile.company_name !== originalCompanyProfile.company_name ||
    companyProfile.company_type !== originalCompanyProfile.company_type ||
    companyProfile.industry_vertical !== originalCompanyProfile.industry_vertical ||
    JSON.stringify(targetAudience.organization_types) !== JSON.stringify(originalTargetAudience.organization_types) ||
    JSON.stringify(targetAudience.practitioner_specialties) !== JSON.stringify(originalTargetAudience.practitioner_specialties);

  // Handle footer visibility with animation
  useEffect(() => {
    const hasMessage = message.length > 0;
    
    if (hasChanges || hasMessage) {
      setFooterVisible(true);
    } else {
      // Delay hiding to allow for slide-down animation
      const timer = setTimeout(() => {
        setFooterVisible(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [hasChanges, message]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Authentication failed.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Get user's team_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profile?.team_id) {
        // Fetch team's company data
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('name, company_type, industry_vertical, target_organization_types, target_practitioner_specialties')
          .eq('id', profile.team_id)
          .single();

        if (!teamError && teamData) {
          const profileData = {
            company_name: teamData.name || "",
            company_type: teamData.company_type || "",
            industry_vertical: teamData.industry_vertical || ""
          };
          setCompanyProfile(profileData);
          setOriginalCompanyProfile(profileData);

          // Set target audience data
          const targetData = {
            organization_types: teamData.target_organization_types || [],
            practitioner_specialties: teamData.target_practitioner_specialties || []
          };
          setTargetAudience(targetData);
          setOriginalTargetAudience(targetData);
        }
      }
    } catch (err) {
      console.error("Error fetching company data:", err);
      setMessage("Failed to load company data.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (field, value) => {
    setCompanyProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTargetChange = (field, value) => {
    setTargetAudience(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value, isCompany = true) => {
    const currentArray = isCompany ? companyProfile[field] : targetAudience[field];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    if (isCompany) {
      handleCompanyChange(field, newArray);
    } else {
      handleTargetChange(field, newArray);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Authentication failed.");
        setMessageType("error");
        return;
      }

      // Get user's team_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setMessage("You must be part of a team to save company data.");
        setMessageType("error");
        return;
      }

      // Save company data to teams table
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          company_type: companyProfile.company_type || null,
          industry_vertical: companyProfile.industry_vertical || null,
          target_organization_types: targetAudience.organization_types || [],
          target_practitioner_specialties: targetAudience.practitioner_specialties || []
        })
        .eq('id', profile.team_id);

      if (teamError) {
        throw new Error("Failed to save company data to team");
      }

      setMessage("Company profile saved successfully!");
      setMessageType("success");
      setOriginalCompanyProfile(companyProfile);
      setOriginalTargetAudience(targetAudience);
      
      // Keep the footer visible for a moment to show success message
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);
      
      // Track activity
      trackActivity("company_profile_updated", {
        company_type: companyProfile.company_type,
        has_target_audience: Object.keys(targetAudience).length > 0
      });

    } catch (err) {
      console.error("Error saving company data:", err);
      setMessage("Failed to save company data. Please try again.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setCompanyProfile(originalCompanyProfile);
    setTargetAudience(originalTargetAudience);
    setMessage("");
    setMessageType("");
  };

  if (loading) {
    return <Spinner message="Loading company profile..." />;
  }

  return (
    <div className={`${styles.container} ${hasChanges ? styles.hasStickyFooter : ''}`}>
      <div className={styles.sections}>
        {/* Company Attributes Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Company Profile</h2>
          <p className={styles.sectionDescription}>
            Define your company's attributes to help potential partners understand your business.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Company Name</label>
              <input
                type="text"
                value={companyProfile.company_name}
                onChange={(e) => handleCompanyChange("company_name", e.target.value)}
                placeholder="Enter your company name"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Company Type</label>
              <div className={styles.buttonGroupContainer}>
                <div className="button-group-outline" style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {companyTypes.map(type => {
                    const isActive = companyProfile.company_type === type.value;
                    const className = [
                      'button',
                      'button-outline',
                      'blue',
                      isActive ? 'active' : ''
                    ].join(' ').trim();

                    return (
                      <button
                        key={type.value}
                        onClick={() => handleCompanyChange("company_type", type.value)}
                        className={className}
                      >
                        <div className={styles.buttonContent}>
                          <div className={styles.buttonLabel}>{type.shortLabel}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {companyProfile.company_type && (
                  <div className={styles.helpTextRight}>
                    {companyTypes.find(t => t.value === companyProfile.company_type)?.helpText}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Industry Vertical</label>
              <select
                value={companyProfile.industry_vertical}
                onChange={(e) => handleCompanyChange("industry_vertical", e.target.value)}
                disabled={!companyProfile.company_type}
              >
                <option value="">
                  {companyProfile.company_type 
                    ? `Select ${companyProfile.company_type.toLowerCase()} vertical` 
                    : "Select company type first"}
                </option>
                {companyProfile.company_type === "Provider" && 
                  providerVerticals.map(vertical => (
                    <option key={vertical} value={vertical}>{vertical}</option>
                  ))
                }
                {companyProfile.company_type === "Supplier" && 
                  supplierVerticals.map(vertical => (
                    <option key={vertical} value={vertical}>{vertical}</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* Target Audience Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Target Partners</h2>
          <p className={styles.sectionDescription}>
            Define your ideal partnership criteria to find the right matches.
          </p>

          <div className={styles.targetSection}>
            <div className={styles.targetGroup}>
              <h3 className={styles.targetTitle}>Organization Types</h3>
              <div className={styles.targetGrid}>
                {organizationTypes.map(type => (
                  <label key={type} className={styles.targetCheckbox}>
                    <input
                      type="checkbox"
                      checked={targetAudience.organization_types.includes(type)}
                      onChange={() => handleArrayChange("organization_types", type, false)}
                    />
                    <span className={styles.targetLabel}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.targetGroup}>
              <h3 className={styles.targetTitle}>Practitioner Specialties</h3>
              <div className={styles.targetGrid}>
                {practitionerSpecialties.map(specialty => (
                  <label key={specialty} className={styles.targetCheckbox}>
                    <input
                      type="checkbox"
                      checked={targetAudience.practitioner_specialties.includes(specialty)}
                      onChange={() => handleArrayChange("practitioner_specialties", specialty, false)}
                    />
                    <span className={styles.targetLabel}>{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      {footerVisible && (
        <div className={`${styles.stickyFooter} ${(hasChanges || message) ? styles.footerVisible : styles.footerHiding}`}>
          <div className={styles.stickyFooterContent}>
            {message && (
              <div className={`${styles.footerMessage} ${styles[messageType]}`}>
                {messageType === "success" && "✅"}
                {messageType === "error" && "❌"}
                {message}
              </div>
            )}
            {hasChanges && (
              <>
                <Button variant="gray" onClick={handleCancelChanges}>
                  Cancel
                </Button>
                <Button variant="blue" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 