import React, { useState } from 'react';
import { Palette, Type, ChevronDown, Eye, Code, Trash2, Plus, Edit } from 'lucide-react';

import Dropdown from '../../../../components/Buttons/Dropdown';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './StyleGuide.module.css';

export default function StyleGuide() {
  const [dropdownOpen, setDropdownOpen] = useState(false);



  const typographyExamples = [
    { element: 'h1', label: 'Heading 1', class: 'h1' },
    { element: 'h2', label: 'Heading 2', class: 'h2' },
    { element: 'h3', label: 'Heading 3', class: 'h3' },
    { element: 'h4', label: 'Heading 4', class: 'h4' },
    { element: 'p', label: 'Body Text', class: 'body' },
    { element: 'span', label: 'Small Text', class: 'small' }
  ];

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
      
      <div className={styles.content}>
        {/* Buttons Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Eye size={16} />
            Buttons
          </h2>
          <p className={styles.sectionDescription}>
            The standardized Section Header Action Button style used throughout the platform.
          </p>
          
          {/* Section Header Action Button Style */}
          <div className={styles.subsection}>
            <h3>Section Header Action Buttons</h3>
            <p>Compact buttons used in section headers (like the dashboard clear all button)</p>
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
            </div>
          </div>
          

                 </section>

         {/* Form Controls Section */}
         <section className={styles.section}>
           <h2 className={styles.sectionTitle}>
             <Code size={16} />
             Form Controls
           </h2>
           <p className={styles.sectionDescription}>
             Checkboxes, radio buttons, and other form input elements used throughout the platform.
           </p>
           
                       {/* Checkboxes */}
            <div className={styles.subsection}>
              <h3>Checkboxes</h3>
              <div className={styles.formControlExample}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span className={styles.checkboxText}>Option 1</span>
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
                <code className={styles.code}>Checkbox group with disabled option</code>
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
                <code className={styles.code}>Radio button group with disabled option</code>
              </div>
            </div>
         </section>

         {/* Typography Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Type size={16} />
            Typography
          </h2>
          <p className={styles.sectionDescription}>
            Font families, sizes, and weights used throughout the platform.
          </p>
          
          <div className={styles.typographyGrid}>
            {typographyExamples.map(({ element, label, class: className }) => (
              <div key={className} className={styles.typographyExample}>
                <div className={styles.typographyPreview}>
                  {element === 'h1' && <h1 className={styles[className]}>Heading 1</h1>}
                  {element === 'h2' && <h2 className={styles[className]}>Heading 2</h2>}
                  {element === 'h3' && <h3 className={styles[className]}>Heading 3</h3>}
                  {element === 'h4' && <h4 className={styles[className]}>Heading 4</h4>}
                  {element === 'p' && <p className={styles[className]}>This is body text with a longer example to show how it flows and wraps naturally.</p>}
                  {element === 'span' && <span className={styles[className]}>Small text example</span>}
                </div>
                <div className={styles.typographyInfo}>
                  <h4>{label}</h4>
                  <code className={styles.code}>{className}</code>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.fontInfo}>
            <h3>Font Family</h3>
            <p>Primary: <code>Work Sans</code></p>
            <p>Fallback: <code>-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif</code></p>
          </div>
        </section>

        {/* Dropdowns Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ChevronDown size={16} />
            Dropdowns
          </h2>
          <p className={styles.sectionDescription}>
            Interactive dropdown components with positioning and accessibility features.
          </p>
          
          <div className={styles.dropdownExample}>
                         <Dropdown
               trigger={
                 <button className={styles.sectionHeaderButton}>
                   Open Dropdown
                   <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                 </button>
               }
              isOpen={dropdownOpen}
              onToggle={setDropdownOpen}
              className={styles.dropdownMenu}
            >
              <div className={styles.dropdownItem}>Option 1</div>
              <div className={styles.dropdownItem}>Option 2</div>
              <div className={styles.dropdownItem}>Option 3</div>
              <div className={styles.dropdownItem}>Option 4</div>
            </Dropdown>
            <code className={styles.code}>Dropdown component with custom trigger</code>
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

        {/* Spacing & Layout Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Code size={16} />
            Spacing & Layout
          </h2>
          <p className={styles.sectionDescription}>
            Standard spacing units and layout patterns.
          </p>
          
          <div className={styles.spacingGrid}>
            <div className={styles.spacingExample}>
              <div className={styles.spacingBox} style={{ padding: '8px' }}>
                <span>8px</span>
              </div>
              <code className={styles.code}>--spacing-xs</code>
            </div>
            <div className={styles.spacingExample}>
              <div className={styles.spacingBox} style={{ padding: '16px' }}>
                <span>16px</span>
              </div>
              <code className={styles.code}>--spacing-sm</code>
            </div>
            <div className={styles.spacingExample}>
              <div className={styles.spacingBox} style={{ padding: '24px' }}>
                <span>24px</span>
              </div>
              <code className={styles.code}>--spacing-md</code>
            </div>
            <div className={styles.spacingExample}>
              <div className={styles.spacingBox} style={{ padding: '32px' }}>
                <span>32px</span>
              </div>
              <code className={styles.code}>--spacing-lg</code>
            </div>
            <div className={styles.spacingExample}>
              <div className={styles.spacingBox} style={{ padding: '48px' }}>
                <span>48px</span>
              </div>
              <code className={styles.code}>--spacing-xl</code>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
