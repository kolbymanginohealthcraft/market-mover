import React, { useState, useEffect } from 'react';
import { Palette, ChevronDown, Code, Trash2, X, Plus, Edit, ExternalLink } from 'lucide-react';

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
                <button className={styles.sectionHeaderButton}>
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
                <button className={styles.sectionHeaderButton}>
                  <Plus size={14} />
                  <span>Add New</span>
                </button>
                <button className={styles.sectionHeaderButton}>
                  <Edit size={14} />
                  <span>Edit</span>
                </button>
                <button className={styles.sectionHeaderButton}>
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
                    <button className={styles.sectionHeaderButton}>
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
                         className={styles.sectionHeaderButton}
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
                     className={styles.dropdownMenu}
                     searchQuery={searchQuery}
                     onSearchClear={setSearchQuery}
                   >
                    {/* Search and Clear All at the top */}
                                         <div className={styles.dropdownHeader}>
                       <div style={{ position: 'relative', width: '100%' }}>
                         <input
                           type="text"
                           placeholder="Search options..."
                           className={styles.searchInput}
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           autoFocus={dropdownOpen3}
                           style={{ width: '100%' }}
                         />
                                                   {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className={`${styles.clearButton} ${styles.clearButtonHover}`}
                              style={{
                                position: 'absolute',
                                right: '6px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                color: '#ef4444',
                                padding: '0',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1,
                                width: '20px',
                                height: '20px',
                                fontSize: '16px',
                                lineHeight: '1',
                                transition: 'all 0.15s ease'
                              }}
                              title="Clear search"
                            >
                              <span style={{ fontSize: '16px', lineHeight: '1' }}>×</span>
                            </button>
                          )}
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
            Standardized search input components with various states and configurations.
          </p>

          <div className={styles.uiComponentsGrid}>
            {/* Search Bar with Icon */}
            <div className={styles.subsection}>
              <h3>Search Bar with Icon</h3>
              <div className={styles.formControlExample}>
                <div className={styles.searchBarContainer}>
                  <div className={styles.searchIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search with icon..."
                    className={styles.searchInput}
                    style={{ width: '300px', paddingLeft: '40px' }}
                    value={searchBarValue}
                    onChange={(e) => setSearchBarValue(e.target.value)}
                    onKeyDown={handleSearchBarEscape}
                  />
                  {searchBarValue && (
                    <button
                      onClick={() => setSearchBarValue('')}
                      className={`${styles.clearButton} ${styles.clearButtonHover}`}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        fontSize: '16px',
                        lineHeight: '1',
                        transition: 'all 0.15s ease'
                      }}
                      title="Clear search"
                    >
                      <span style={{ fontSize: '16px', lineHeight: '1' }}>×</span>
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
