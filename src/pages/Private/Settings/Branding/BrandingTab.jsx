import { useState } from "react";
import { Palette } from "lucide-react";
import useTeamCustomColors from "../../../../hooks/useTeamCustomColors";
import Button from "../../../../components/Buttons/Button";
import Spinner from "../../../../components/Buttons/Spinner";
import SidePanel from "../../../../components/Overlays/SidePanel";
import SectionHeader from "../../../../components/Layouts/SectionHeader";
import styles from "./BrandingTab.module.css";

export default function BrandingTab() {
  const {
    colors,
    loading,
    error,
    addingColor,
    updatingColor,
    deletingColor,
    addTeamColor,
    updateTeamColor,
    deleteTeamColor
  } = useTeamCustomColors();

  // Color management state
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#3B82F6');
  const [editColorName, setEditColorName] = useState('');
  const [editColorHex, setEditColorHex] = useState('');

  // Logo management state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoLoading, setLogoLoading] = useState(false);

  // Font preferences state
  const [fontPreferences, setFontPreferences] = useState({
    primaryFont: 'Inter',
    secondaryFont: 'Roboto',
    headingFont: 'Inter',
    bodyFont: 'Inter'
  });

  // Footer settings state
  const [footerSettings, setFooterSettings] = useState({
    companyName: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: ''
    }
  });

  // Color management handlers
  const handleAddColor = async (e) => {
    e.preventDefault();
    if (!newColorName.trim() || !newColorHex) return;

    await addTeamColor(newColorName.trim(), newColorHex);
    setNewColorName('');
    setNewColorHex('#3B82F6');
    setShowAddPanel(false);
  };

  const handleEditColor = async (e) => {
    e.preventDefault();
    if (!editingColor || !editColorName.trim() || !editColorHex) return;

    await updateTeamColor(editingColor.id, {
      color_name: editColorName.trim(),
      color_hex: editColorHex
    });
    setEditingColor(null);
    setEditColorName('');
    setEditColorHex('');
    setShowAddPanel(false);
  };

  const handleDeleteColor = async (colorId) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    await deleteTeamColor(colorId);
  };

  const startEditing = (color) => {
    setEditingColor(color);
    setEditColorName(color.color_name);
    setEditColorHex(color.color_hex);
    setShowAddPanel(true);
  };

  const openAddPanel = () => {
    setEditingColor(null);
    setNewColorName('');
    setNewColorHex('#3B82F6');
    setShowAddPanel(true);
  };

  const copyHexToClipboard = async (hexCode) => {
    try {
      await navigator.clipboard.writeText(hexCode);
    } catch (err) {
      console.error('Failed to copy hex code:', err);
    }
  };

  // Logo management handlers
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSubmit = async () => {
    if (!logoFile) return;
    
    setLogoLoading(true);
    // TODO: Implement logo upload to storage
    setTimeout(() => {
      setLogoLoading(false);
      // Reset form
      setLogoFile(null);
      setLogoPreview(null);
    }, 2000);
  };

  // Font preference handlers
  const handleFontChange = (field, value) => {
    setFontPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Footer settings handlers
  const handleFooterChange = (field, value) => {
    setFooterSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFooterSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  if (loading) {
    return <Spinner message="Loading branding settings..." />;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <SectionHeader 
        title="Branding Management" 
        icon={Palette} 
        showEditButton={false}
      />
      
      <div className={styles.content}>
        <div className={styles.twoColumnLayout}>
          {/* Left Column - Color Palette */}
          <div className={styles.leftColumn}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.headerContent}>
                  <h3>Color Palette</h3>
                  <p>Manage your brand colors for charts and visualizations</p>
                </div>
                <Button
                  variant="green"
                  size="sm"
                  onClick={openAddPanel}
                >
                  + Add Color
                </Button>
              </div>
            
            <div className={styles.sectionContent}>

              {colors.length === 0 ? (
                <div className={styles.emptyState}>
                  <h5>No custom colors yet</h5>
                  <p>Add your first color to get started with custom team branding</p>
                </div>
              ) : (
                <div className={styles.colorsGrid}>
                  {colors.map((color) => (
                    <div key={color.id} className={styles.colorCard}>
                      <div className={styles.colorPreview}>
                        <div 
                          className={styles.colorSwatch}
                          style={{ backgroundColor: color.color_hex }}
                        />
                        <div className={styles.colorInfo}>
                          <h6 className={styles.colorName}>{color.color_name}</h6>
                          <p className={styles.colorHex}>{color.color_hex}</p>
                        </div>
                      </div>
                      <div className={styles.colorActions}>
                        <Button
                          variant="gray"
                          size="sm"
                          ghost
                          onClick={() => copyHexToClipboard(color.color_hex)}
                          disabled={updatingColor || deletingColor}
                        >
                          Copy
                        </Button>
                        <Button
                          variant="blue"
                          size="sm"
                          ghost
                          onClick={() => startEditing(color)}
                          disabled={updatingColor || deletingColor}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          ghost
                          onClick={() => handleDeleteColor(color.id)}
                          disabled={updatingColor || deletingColor}
                        >
                          {deletingColor ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Other Branding Elements */}
        <div className={styles.rightColumn}>
          {/* Coming Soon Banner */}
          <div className={styles.comingSoonBanner}>
            <div className={styles.comingSoonContent}>
              <span className={styles.comingSoonIcon}>🚧</span>
              <div>
                <h4>Coming Soon</h4>
                <p>These branding features are being developed. The color palette on the left is fully functional.</p>
              </div>
            </div>
          </div>

          {/* Logo Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>🖼️ Company Logo</h3>
              <p>Upload and manage your company logo</p>
            </div>
            
            <div className={styles.sectionContent}>
              <div className={styles.logoSection}>
                <div className={styles.logoUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    id="logo-upload"
                    className={styles.fileInput}
                    disabled
                  />
                  <label htmlFor="logo-upload" className={`${styles.uploadLabel} ${styles.disabled}`}>
                    <span>📁</span>
                    Choose Logo File
                  </label>
                </div>
                
                {logoPreview && (
                  <div className={styles.logoPreview}>
                    <h5>Preview</h5>
                    <img src={logoPreview} alt="Logo preview" className={styles.previewImage} />
                    <Button 
                      onClick={handleLogoSubmit}
                      disabled={logoLoading}
                      className={styles.uploadButton}
                    >
                      {logoLoading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Font Preferences Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>🔤 Typography</h3>
              <p>Configure font preferences for your brand</p>
            </div>
            
            <div className={styles.sectionContent}>
              <div className={styles.fontGrid}>
                <div className={styles.fontField}>
                  <label>Primary Font</label>
                  <select 
                    value={fontPreferences.primaryFont}
                    onChange={(e) => handleFontChange('primaryFont', e.target.value)}
                    disabled
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                
                <div className={styles.fontField}>
                  <label>Secondary Font</label>
                  <select 
                    value={fontPreferences.secondaryFont}
                    onChange={(e) => handleFontChange('secondaryFont', e.target.value)}
                    disabled
                  >
                    <option value="Roboto">Roboto</option>
                    <option value="Inter">Inter</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                
                <div className={styles.fontField}>
                  <label>Heading Font</label>
                  <select 
                    value={fontPreferences.headingFont}
                    onChange={(e) => handleFontChange('headingFont', e.target.value)}
                    disabled
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                
                <div className={styles.fontField}>
                  <label>Body Font</label>
                  <select 
                    value={fontPreferences.bodyFont}
                    onChange={(e) => handleFontChange('bodyFont', e.target.value)}
                    disabled
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Settings Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>📄 Footer Information</h3>
              <p>Configure footer content and contact information</p>
            </div>
            
            <div className={styles.sectionContent}>
              <div className={styles.footerGrid}>
                <div className={styles.footerField}>
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={footerSettings.companyName}
                    onChange={(e) => handleFooterChange('companyName', e.target.value)}
                    placeholder="Your Company Name"
                    disabled
                  />
                </div>
                
                <div className={styles.footerField}>
                  <label>Website</label>
                  <input
                    type="url"
                    value={footerSettings.website}
                    onChange={(e) => handleFooterChange('website', e.target.value)}
                    placeholder="https://yourcompany.com"
                    disabled
                  />
                </div>
                
                <div className={styles.footerField}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={footerSettings.phone}
                    onChange={(e) => handleFooterChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled
                  />
                </div>
                
                <div className={styles.footerField}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={footerSettings.email}
                    onChange={(e) => handleFooterChange('email', e.target.value)}
                    placeholder="contact@yourcompany.com"
                    disabled
                  />
                </div>
                
                <div className={styles.footerField}>
                  <label>Address</label>
                  <textarea
                    value={footerSettings.address}
                    onChange={(e) => handleFooterChange('address', e.target.value)}
                    placeholder="123 Business St, City, State 12345"
                    rows={3}
                    disabled
                  />
                </div>
              </div>
              
              <div className={styles.socialSection}>
                <h5>Social Media Links</h5>
                <div className={styles.socialGrid}>
                  <div className={styles.socialField}>
                    <label>LinkedIn</label>
                    <input
                      type="url"
                      value={footerSettings.socialLinks.linkedin}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                      disabled
                    />
                  </div>
                  
                  <div className={styles.socialField}>
                    <label>Twitter</label>
                    <input
                      type="url"
                      value={footerSettings.socialLinks.twitter}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/yourcompany"
                      disabled
                    />
                  </div>
                  
                  <div className={styles.socialField}>
                    <label>Facebook</label>
                    <input
                      type="url"
                      value={footerSettings.socialLinks.facebook}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourcompany"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Add/Edit Color Sidebar */}
      <SidePanel 
        isOpen={showAddPanel} 
        onClose={() => setShowAddPanel(false)}
        title={editingColor ? 'Edit Color' : 'Add New Color'}
      >
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Color Name
            </label>
            <input
              type="text"
              value={editingColor ? editColorName : newColorName}
              onChange={(e) => editingColor ? setEditColorName(e.target.value) : setNewColorName(e.target.value)}
              placeholder="e.g., Primary Blue, Accent Red"
              maxLength={50}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={editingColor ? editColorHex : newColorHex}
                onChange={(e) => editingColor ? setEditColorHex(e.target.value) : setNewColorHex(e.target.value)}
                required
                style={{
                  width: '60px',
                  height: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={editingColor ? editColorHex : newColorHex}
                onChange={(e) => editingColor ? setEditColorHex(e.target.value) : setNewColorHex(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
                required
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <Button 
              onClick={editingColor ? handleEditColor : handleAddColor}
              disabled={addingColor || updatingColor || !(editingColor ? editColorName : newColorName).trim()}
            >
              {addingColor || updatingColor ? 'Saving...' : (editingColor ? 'Update Color' : 'Add Color')}
            </Button>
            <Button outline onClick={() => setShowAddPanel(false)}>Cancel</Button>
          </div>
        </div>
      </SidePanel>
    </div>
  );
} 