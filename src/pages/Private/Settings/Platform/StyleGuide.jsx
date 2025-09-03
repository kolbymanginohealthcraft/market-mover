import React, { useState } from 'react';
import { Palette, ChevronDown, Code, Trash2, Plus, Edit, ExternalLink } from 'lucide-react';

import Dropdown from '../../../../components/Buttons/Dropdown';
import SectionHeader from '../../../../components/Layouts/SectionHeader';
import styles from './StyleGuide.module.css';

export default function StyleGuide() {
  const [dropdownOpen1, setDropdownOpen1] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);





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
                   <Dropdown
                     trigger={
                       <button className={styles.sectionHeaderButton}>
                         Multi-Select
                         <ChevronDown size={10} style={{ marginLeft: '8px' }} />
                       </button>
                     }
                     isOpen={dropdownOpen2}
                     onToggle={setDropdownOpen2}
                     className={styles.dropdownMenu}
                   >
                     <div className={styles.dropdownItem}>
                       <label className={styles.checkboxLabel}>
                         <input type="checkbox" className={styles.checkbox} />
                         <span className={styles.checkboxText}>Option 1</span>
                       </label>
                     </div>
                     <div className={styles.dropdownItem}>
                       <label className={styles.checkboxLabel}>
                         <input type="checkbox" className={styles.checkbox} />
                         <span className={styles.checkboxText}>Option 2</span>
                       </label>
                     </div>
                     <div className={styles.dropdownItem}>
                       <label className={styles.checkboxLabel}>
                         <input type="checkbox" className={styles.checkbox} />
                         <span className={styles.checkboxText}>Option 3</span>
                       </label>
                     </div>
                     <div className={styles.dropdownItem}>
                       <label className={styles.checkboxLabel}>
                         <input type="checkbox" className={styles.checkbox} />
                         <span className={styles.checkboxText}>Option 4</span>
                       </label>
                     </div>
                   </Dropdown>
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
