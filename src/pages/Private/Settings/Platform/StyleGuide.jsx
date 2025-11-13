import React, { useState, useEffect } from 'react';
import { Palette, ChevronDown, Code, Trash2, X, Plus, Edit, ExternalLink, Search, MapPin } from 'lucide-react';

import Dropdown from '../../../../components/Buttons/Dropdown';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './StyleGuide.module.css';

export default function StyleGuide() {
     const [dropdownOpen1, setDropdownOpen1] = useState(false);
   const [dropdownOpen3, setDropdownOpen3] = useState(false);

  // Filter button states
  const [statusFilter, setStatusFilter] = useState('All');

  // Boolean filter states
  const [showArchived, setShowArchived] = useState(false);
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  // Multi-select dropdown state
  const [multiSelectItems, setMultiSelectItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
     const [showSelectedItems, setShowSelectedItems] = useState(false);

  // Available options for the multi-select dropdown
  const availableOptions = [
    'Option 1',
    'Option 2',
    'Option 3',
    'Option 4',
    'Advanced Analytics',
    'Data Export',
    'User Management',
    'System Settings',
    'API Integration',
    'Custom Reports',
    'Audit Logs',
    'Backup & Restore'
  ];

  // Filtered options based on search query
  const filteredOptions = availableOptions.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle multi-select checkbox changes
  const handleMultiSelectChange = (item) => {
    setMultiSelectItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  // Handle escape key to blur inputs
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      e.target.blur();
    }
  };

  // Handle search bar escape key behavior
  const [searchBarValue, setSearchBarValue] = useState('');
  const [searchBarEscapeCount, setSearchBarEscapeCount] = useState(0);

  const handleSearchBarEscape = (e) => {
    if (e.key === 'Escape') {
      if (searchBarValue && searchBarEscapeCount === 0) {
        // First escape: clear the search
        setSearchBarValue('');
        setSearchBarEscapeCount(1);
        // Reset the count after a short delay
        setTimeout(() => setSearchBarEscapeCount(0), 100);
      } else {
        // Second escape (or first if no value): exit focus
        e.target.blur();
        setSearchBarEscapeCount(0);
      }
    }
  };

  // Clear search when dropdown closes
  useEffect(() => {
    if (!dropdownOpen3) {
      setSearchQuery('');
    }
  }, [dropdownOpen3]);


  const colorTokens = [
    { name: 'Primary Teal', variable: '--primary-teal', value: '#00c08b' },
    { name: 'Primary Teal Dark', variable: '--primary-teal-dark', value: '#01514a' },
    { name: 'Secondary Blue', variable: '--secondary-blue', value: '#52bad7' },
    { name: 'Accent Yellow', variable: '--accent-yellow', value: '#d7df23' },
    { name: 'Dark Blue', variable: '--dark-blue', value: '#044563' },
    { name: 'Dark Green', variable: '--dark-green', value: '#084938' },
    { name: 'Success Green', variable: '--success-green', value: '#10b981' },
    { name: 'Error Red', variable: '--error-red', value: '#ef4444' },
    { name: 'Warning Orange', variable: '--warning-orange', value: '#f59e0b' }
  ];

  // Toggle states for testing components
  const [showBottomPopout, setShowBottomPopout] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  // Saved Market Selection states
  const [savedMarkets] = useState([
    { id: 1, name: 'Downtown Chicago', city: 'Chicago', state: 'IL', radius_miles: 25 },
    { id: 2, name: 'Metro Atlanta', city: 'Atlanta', state: 'GA', radius_miles: 30 },
    { id: 3, name: 'Greater Boston Area', city: 'Boston', state: 'MA', radius_miles: 20 },
    { id: 4, name: 'Phoenix Metro', city: 'Phoenix', state: 'AZ', radius_miles: 35 }
  ]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);

  return (
    <>
      <SectionHeader
        title="Style Guide"
        icon={Palette}
        showEditButton={false}
      />
      
      {/* Test Section for Bottom Screen Dropdown Testing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Test Section for Bottom Screen Positioning
        </h2>
        <p className={styles.sectionDescription}>
          This large section creates space to test dropdown behavior when positioned near the bottom of the viewport.
        </p>
        
        <div style={{ height: '800px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Scroll Down to Test Dropdowns</h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              This section is intentionally tall to push the UI Components section<br/>
              toward the bottom of the screen for testing dropdown positioning.
            </p>
          </div>
        </div>
      </section>
      
      <div className={styles.content}>
        {/* UI Components Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Code size={16} />
            UI Components
          </h2>
          <p className={styles.sectionDescription}>
            Standardized UI elements used throughout the platform including buttons, form controls, and dropdowns.
          </p>

          <div className={styles.uiComponentsGrid}>
            {/* Section Header Action Buttons */}
            <div className={styles.subsection}>
              <h3>Action Buttons</h3>
              <div className={styles.buttonExample}>
                <button className="sectionHeaderButton">
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
                <button className="sectionHeaderButton">
                  <Plus size={14} />
                  <span>Add New</span>
                </button>
                <button className="sectionHeaderButton">
                  <Edit size={14} />
                  <span>Edit</span>
                </button>
                <button className="sectionHeaderButton">
                  <ExternalLink size={14} />
                  <span>Open New Window</span>
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className={styles.subsection}>
              <h3>Checkboxes</h3>
              <div className={styles.formControlExample}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span className={styles.checkboxText}>Option 1 which might be very very very long and take up a lot of space</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span className={styles.checkboxText}>Option 2</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span className={styles.checkboxText}>Option 3</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} disabled />
                    <span className={styles.checkboxText}>Option 4 (Disabled)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Radio Buttons */}
            <div className={styles.subsection}>
              <h3>Radio Buttons</h3>
              <div className={styles.formControlExample}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="radio-group" className={styles.radio} />
                    <span className={styles.radioText}>Option 1</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="radio-group" className={styles.radio} />
                    <span className={styles.radioText}>Option 2</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="radio-group" className={styles.radio} />
                    <span className={styles.radioText}>Option 3</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="radio-group" className={styles.radio} disabled />
                    <span className={styles.radioText}>Option 4 (Disabled)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Dropdowns */}
            <div className={styles.subsection}>
              <h3>Dropdowns</h3>
              <div className={styles.dropdownExample}>
                <Dropdown
                  trigger={
                    <button className="sectionHeaderButton">
                      Open Dropdown
                      <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                    </button>
                  }
                  isOpen={dropdownOpen1}
                  onToggle={setDropdownOpen1}
                  className={styles.dropdownMenu}
                >
                  <div className={styles.dropdownItem}>Option 1</div>
                  <div className={styles.dropdownItem}>Option 2</div>
                  <div className={styles.dropdownItem}>Option 3</div>
                  <div className={styles.dropdownItem}>Option 4</div>
                </Dropdown>
              </div>

              

              <div className={styles.dropdownExample}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <Dropdown
                     trigger={
                       <button 
                         className="sectionHeaderButton"
                         style={{ 
                           minWidth: '200px',
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center'
                         }}
                       >
                         <span>
                           {multiSelectItems.length > 0 ? (
                             <span className={styles.multiSelectDisplay} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <span>{multiSelectItems.length} selected</span>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setShowSelectedItems(!showSelectedItems);
                                 }}
                                 title={showSelectedItems ? "Hide selected items" : "Show selected items"}
                                 style={{
                                   background: 'transparent',
                                   border: '1px solid #d1d5db',
                                   cursor: 'pointer',
                                   color: '#6b7280',
                                   fontSize: '10px',
                                   fontWeight: '500',
                                   padding: '2px 6px',
                                   borderRadius: '4px',
                                   transition: 'all 0.15s ease',
                                   height: '20px',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   whiteSpace: 'nowrap'
                                 }}
                                                                   onMouseEnter={(e) => {
                                     e.target.style.background = '#e6f7f9';
                                     e.target.style.borderColor = '#52bad7';
                                     e.target.style.color = '#044563';
                                   }}
                                   onMouseLeave={(e) => {
                                     e.target.style.background = 'transparent';
                                     e.target.style.borderColor = '#d1d5db';
                                     e.target.style.color = '#6b7280';
                                   }}
                               >
                                 {showSelectedItems ? 'Hide' : 'Show'}
                               </button>
                             </span>
                           ) : (
                             'Multi-Select'
                           )}
                         </span>
                         <ChevronDown size={10} />
                       </button>
                     }
                     isOpen={dropdownOpen3}
                     onToggle={setDropdownOpen3}
                     className={`${styles.dropdownMenu} dropdown`}
                     searchQuery={searchQuery}
                     onSearchClear={setSearchQuery}
                   >
                    {/* Search and Clear All at the top */}
                                         <div className={styles.dropdownHeader}>
                                              <div className="searchBarContainer" style={{ width: '100%' }}>
                         <div className="searchIcon">
                           <Search size={16} />
                         </div>
                         <input
                           type="text"
                           placeholder="Search options..."
                           className="searchInput"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           autoFocus={dropdownOpen3}
                         />
                       </div>
                     </div>
                    
                    {/* Scrollable content container */}
                    <div className={styles.dropdownContent}>
                      {/* Filtered options */}
                                             {filteredOptions.map((option) => (
                         <div key={option} className={styles.dropdownItem} style={{ padding: '0 !important', margin: '0 !important' }}>
                           <label className={styles.checkboxLabel} style={{ 
                             margin: '0 !important', 
                             padding: '4px 8px !important', 
                             minHeight: 'auto !important',
                             lineHeight: '1.2 !important',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '8px',
                             width: '100%'
                           }}>
                             <input 
                               type="checkbox" 
                               className={styles.checkbox}
                               checked={multiSelectItems.includes(option)}
                               onChange={() => handleMultiSelectChange(option)}
                               style={{ margin: '0 !important' }}
                             />
                             <span className={styles.checkboxText} style={{ margin: '0 !important', padding: '0 !important' }}>{option}</span>
                           </label>
                         </div>
                       ))}
                      
                      {filteredOptions.length === 0 && (
                        <div className={styles.noResults}>
                          No options match your search
                        </div>
                      )}
                    </div>
                  </Dropdown>
                  {multiSelectItems.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button 
                        className={`${styles.clearButton} ${styles.clearButtonHover}`}
                        onClick={() => setMultiSelectItems([])}
                        title="Clear all selections"
                        style={{
                          background: 'transparent',
                          border: '1px solid transparent',
                          padding: '0',
                          margin: '0',
                          cursor: 'pointer',
                          color: '#ef4444',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Selected items as removable tags */}
                {multiSelectItems.length > 0 && showSelectedItems && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '8px'
                  }}>
                    {multiSelectItems.map(item => (
                      <span key={item} style={{
                        background: '#e6f7f9',
                        color: '#265947',
                        padding: '4px 8px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        border: '1px solid #d1f2f5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {item}
                        <button 
                          onClick={() => handleMultiSelectChange(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#265947',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '0',
                            margin: '0',
                            lineHeight: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#d1f2f5';
                            e.target.style.color = '#044563';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#265947';
                          }}
                          title={`Remove ${item}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className={styles.subsection}>
              <h3>Filter Buttons</h3>
              <div className={styles.formControlExample}>
                <div className={styles.filterButtonGroup}>
                  <button
                    className={`${styles.filterButton} ${statusFilter === 'All' ? styles.filterButtonActive : ''}`}
                    onClick={() => setStatusFilter('All')}
                  >
                    All
                  </button>
                  <button
                    className={`${styles.filterButton} ${statusFilter === 'Active' ? styles.filterButtonActive : ''}`}
                    onClick={() => setStatusFilter('Active')}
                  >
                    Active
                  </button>
                  <button
                    className={`${styles.filterButton} ${statusFilter === 'Inactive' ? styles.filterButtonActive : ''}`}
                    onClick={() => setStatusFilter('Inactive')}
                  >
                    Inactive
                  </button>
                  <button
                    className={`${styles.filterButton} ${statusFilter === 'Archived' ? styles.filterButtonActive : ''}`}
                    onClick={() => setStatusFilter('Archived')}
                  >
                    Archived
                  </button>
                </div>

                <h4>Boolean Filter Buttons</h4>
                <div className={styles.booleanFilterGroup}>
                  <button
                    className={`${styles.booleanFilterButton} ${showArchived ? styles.booleanFilterButtonActive : ''}`}
                    onClick={() => setShowArchived(!showArchived)}
                  >
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={() => setShowArchived(!showArchived)}
                      className={styles.booleanFilterCheckbox}
                    />
                    Show Archived
                  </button>
                  <button
                    className={`${styles.booleanFilterButton} ${includeDrafts ? styles.booleanFilterButtonActive : ''}`}
                    onClick={() => setIncludeDrafts(!includeDrafts)}
                  >
                    <input
                      type="checkbox"
                      checked={includeDrafts}
                      onChange={() => setIncludeDrafts(!includeDrafts)}
                      className={styles.booleanFilterCheckbox}
                    />
                    Include Drafts
                  </button>
                  <button
                    className={`${styles.booleanFilterButton} ${showHidden ? styles.booleanFilterButtonActive : ''}`}
                    onClick={() => setShowHidden(!showHidden)}
                  >
                    <input
                      type="checkbox"
                      checked={showHidden}
                      onChange={() => setShowHidden(!showHidden)}
                      className={styles.booleanFilterCheckbox}
                    />
                    Show Hidden Items
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bars Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Code size={16} />
            Search Bars
          </h2>
          <p className={styles.sectionDescription}>
            Standardized search input components with double-escape behavior (first escape clears, second exits focus), clear button functionality, and consistent styling across the platform.
          </p>

          <div className={styles.uiComponentsGrid}>
            {/* Search Bar with Icon */}
            <div className={styles.subsection}>
              <div className={styles.formControlExample}>
                <div className="searchBarContainer">
                  <div className="searchIcon">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search the industry..."
                    className="searchInput"
                    style={{ width: '300px' }}
                    value={searchBarValue}
                    onChange={(e) => setSearchBarValue(e.target.value)}
                    onKeyDown={handleSearchBarEscape}
                  />
                  {searchBarValue && (
                    <button
                      onClick={() => setSearchBarValue('')}
                      className="clearButton"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Input Fields Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Code size={16} />
            Form Input Fields
          </h2>
          <p className={styles.sectionDescription}>
            Standardized form input components with labels and various input types.
          </p>

          <div className={styles.uiComponentsGrid}>
            {/* Stacked Layout - Label above input */}
            <div className={styles.subsection}>
              <h3>Stacked Layout</h3>
              <div className={styles.formControlExample}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className={styles.formInput}
                    style={{ width: '300px' }}
                    onKeyDown={handleEscapeKey}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={styles.formInput}
                    style={{ width: '300px' }}
                    onKeyDown={handleEscapeKey}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    placeholder="Enter a description..."
                    className={styles.formTextarea}
                    rows={3}
                    style={{ width: '300px' }}
                    onKeyDown={handleEscapeKey}
                  />
                </div>
              </div>
            </div>

            {/* Inline Layout - Label and input on same line */}
            <div className={styles.subsection}>
              <h3>Inline Layout</h3>
              <div className={styles.formControlExample}>
                <div className={styles.inlineForm}>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>Username:</label>
                    <input
                      type="text"
                      placeholder="Enter username"
                      className={styles.inlineFormInput}
                      onKeyDown={handleEscapeKey}
                    />
                  </div>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>Country:</label>
                    <select className={styles.inlineFormSelect} onKeyDown={handleEscapeKey}>
                      <option value="">Select country</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="uk">United Kingdom</option>
                    </select>
                  </div>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>Age:</label>
                    <input
                      type="number"
                      placeholder="Enter age"
                      min="0"
                      max="120"
                      className={styles.inlineFormInput}
                      style={{ width: '100px' }}
                      onKeyDown={handleEscapeKey}
                    />
                  </div>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>Birth Date:</label>
                    <input
                      type="date"
                      className={styles.inlineFormInput}
                      style={{ width: '140px' }}
                      onKeyDown={handleEscapeKey}
                    />
                  </div>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>Opt In:</label>
                    <div className={styles.inlineFormRadioGroup}>
                      <label className={styles.inlineFormRadioLabel}>
                        <input type="radio" name="optin" value="yes" className={styles.inlineFormRadio} />
                        <span>Yes</span>
                      </label>
                      <label className={styles.inlineFormRadioLabel}>
                        <input type="radio" name="optin" value="no" className={styles.inlineFormRadio} />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>
                      Password <span className={styles.required}>*</span>:
                    </label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      className={styles.inlineFormInput}
                      required
                      onKeyDown={handleEscapeKey}
                    />
                  </div>
                  <div className={styles.inlineFormRow}>
                    <label className={styles.inlineFormLabel}>
                      Confirm Password <span className={styles.required}>*</span>:
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      className={styles.inlineFormInput}
                      required
                      onKeyDown={handleEscapeKey}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Overlay Components Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Code size={16} />
            Overlay Components
          </h2>
          <p className={styles.sectionDescription}>
            Standardized overlay components including bottom drawers and right-side panels for user interactions.
          </p>

          {/* Toggle Controls */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                className={styles.toggleButton}
                onClick={() => setShowBottomPopout(!showBottomPopout)}
              >
                {showBottomPopout ? 'Hide' : 'Show'} Bottom Drawer
              </button>
              <button 
                className={styles.toggleButton}
                onClick={() => setShowRightDrawer(!showRightDrawer)}
              >
                {showRightDrawer ? 'Close' : 'Open'} Right Drawer
              </button>
            </div>
          </div>

          {/* Bottom Drawer Overlay */}
          {showBottomPopout && (
            <div className={styles.bottomPopout}>
              <div className={styles.popoutContent}>
                <div className={styles.popoutText}>
                  <h4>Unsaved Changes</h4>
                  <p>You have unsaved changes to your profile information. If you cancel, all changes will be lost.</p>
                </div>
                <div className={styles.popoutActions}>
                  <button className={styles.cancelButton}>
                    Cancel
                  </button>
                  <button className={styles.saveButton}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Drawer Overlay */}
        {showRightDrawer && (
          <>
            <div className={styles.drawerOverlay} onClick={() => setShowRightDrawer(false)} />
            <div 
              className={`${styles.rightDrawer} ${showRightDrawer ? styles.drawerOpen : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowRightDrawer(false);
                }
              }}
            >
              <div className={styles.drawerHeader}>
                <h3>Add Custom Color</h3>
                <button 
                  className={styles.drawerCloseButton}
                  onClick={() => setShowRightDrawer(false)}
                >
                  ×
                </button>
              </div>
              <div 
                className={styles.drawerContent}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowRightDrawer(false);
                  }
                }}
                tabIndex={-1}
              >
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Color Name</label>
                  <input
                    type="text"
                    placeholder="Enter color name"
                    className={styles.formInput}
                    onKeyDown={handleEscapeKey}
                    autoFocus
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Hex Value</label>
                  <input
                    type="text"
                    placeholder="#000000"
                    className={styles.formInput}
                    onKeyDown={handleEscapeKey}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    placeholder="Describe this color's usage..."
                    className={styles.formTextarea}
                    rows={3}
                    onKeyDown={handleEscapeKey}
                  />
                </div>
                <div className={styles.drawerActions}>
                  <button className={styles.cancelButton}>
                    Cancel
                  </button>
                  <button className={styles.saveButton}>
                    Add Color
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Saved Market Selection Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Code size={16} />
            Saved Market Selection
          </h2>
          <p className={styles.sectionDescription}>
            Standardized component for selecting a saved market from the user's saved markets. Used across Search the Industry, Claims Data Explorer, Quality Storyteller, and other pages that require market-based filtering.
          </p>

          <div className={styles.subsection}>
            <div className={styles.formControlExample} style={{ overflow: 'visible', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                {savedMarkets.length > 0 && (
                  <Dropdown
                    trigger={
                      <button className="sectionHeaderButton">
                        <MapPin size={14} />
                        {selectedMarket ? 
                          `${selectedMarket.name}` : 
                          'Saved Market'}
                        <ChevronDown size={14} />
                      </button>
                    }
                    isOpen={marketDropdownOpen}
                    onToggle={setMarketDropdownOpen}
                    className={styles.dropdownMenu}
                  >
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setSelectedMarket(null);
                        setMarketDropdownOpen(false);
                      }}
                    >
                      No Market
                    </button>
                    {savedMarkets.map(market => (
                      <button 
                        key={market.id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setSelectedMarket(market);
                          setMarketDropdownOpen(false);
                        }}
                        style={{
                          fontWeight: selectedMarket?.id === market.id ? '600' : '500',
                          background: selectedMarket?.id === market.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                        }}
                      >
                        <div>{market.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                          {market.city}, {market.state} • {market.radius_miles} mi
                        </div>
                      </button>
                    ))}
                  </Dropdown>
                )}
              </div>
              
              {selectedMarket && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Selected Market:</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{selectedMarket.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {selectedMarket.city}, {selectedMarket.state} • {selectedMarket.radius_miles} mi radius
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.subsection} style={{ marginTop: '32px' }}>
            <h3>Implementation Guidelines</h3>
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Required Elements:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
                <li>MapPin icon (size 14) from lucide-react</li>
                <li>Button text shows market name when selected, "Saved Market" when not</li>
                <li>ChevronDown icon (size 14) to indicate dropdown</li>
                <li>"No Market" option as first item in dropdown to clear selection</li>
                <li>Each market item displays: name (primary), city/state/radius (secondary, smaller text)</li>
                <li>Selected market highlighted with bold font (600) and teal background (rgba(0, 192, 139, 0.1))</li>
              </ul>
              
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginTop: '20px', marginBottom: '12px' }}>State Management:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
                <li>Use <code className={styles.code}>selectedMarket?.id === market.id</code> for comparison (not <code className={styles.code}>selectedMarket === market.id</code>)</li>
                <li>Store full market object in state, not just the ID</li>
                <li>Close dropdown after selection</li>
                <li>Handle null/empty selection to clear market filter</li>
              </ul>

              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginTop: '20px', marginBottom: '12px' }}>Styling:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
                <li>Use <code className={styles.code}>sectionHeaderButton</code> class for the trigger button</li>
                <li>Use <code className={styles.code}>styles.dropdownMenu</code> for the dropdown container</li>
                <li>Use <code className={styles.code}>styles.dropdownItem</code> for each market option</li>
                <li>Secondary text (city, state, radius) uses <code className={styles.code}>fontSize: '11px', color: 'var(--gray-500)'</code></li>
                <li>Selected state uses <code className={styles.code}>fontWeight: '600'</code> and <code className={styles.code}>background: 'rgba(0, 192, 139, 0.1)'</code></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Color Tokens Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Palette size={16} />
            Color Tokens
          </h2>
          <p className={styles.sectionDescription}>
            CSS custom properties and color values used throughout the platform.
          </p>

          <div className={styles.colorGrid}>
            {colorTokens.map(({ name, variable, value }) => (
              <div key={variable} className={styles.colorToken}>
                <div
                  className={styles.colorSwatch}
                  style={{ backgroundColor: value }}
                />
                <div className={styles.colorInfo}>
                  <h4>{name}</h4>
                  <code className={styles.code}>{variable}</code>
                  <code className={styles.code}>{value}</code>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
