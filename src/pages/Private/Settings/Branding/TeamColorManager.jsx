import { useState } from 'react';
import useTeamCustomColors from '../../../../hooks/useTeamCustomColors';
import Button from '../../../../components/Buttons/Button';
import styles from './TeamColorManager.module.css';

export default function TeamColorManager() {
  const {
    colors,
    loading,
    error,
    addingColor,
    updatingColor,
    deletingColor,
    addTeamColor,
    updateTeamColor,
    deleteTeamColor,
    reorderColors
  } = useTeamCustomColors();

  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#3B82F6');
  const [editingColor, setEditingColor] = useState(null);
  const [editColorName, setEditColorName] = useState('');
  const [editColorHex, setEditColorHex] = useState('');

  const handleAddColor = async (e) => {
    e.preventDefault();
    if (!newColorName.trim() || !newColorHex) return;

    await addTeamColor(newColorName.trim(), newColorHex);
    setNewColorName('');
    setNewColorHex('#3B82F6');
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
  };

  const handleDeleteColor = async (colorId) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    await deleteTeamColor(colorId);
  };

  const startEditing = (color) => {
    setEditingColor(color);
    setEditColorName(color.color_name);
    setEditColorHex(color.color_hex);
  };

  const cancelEditing = () => {
    setEditingColor(null);
    setEditColorName('');
    setEditColorHex('');
  };

  if (loading) {
    return <div className={styles.loading}>Loading team colors...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Team Color Palette</h3>
        <p className={styles.subtitle}>
          Manage custom colors for your team's charts and visualizations
        </p>
      </div>

      {/* Add new color form */}
      <div className={styles.addForm}>
        <h4 className={styles.sectionTitle}>Add New Color</h4>
        <form onSubmit={handleAddColor} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="colorName">Color Name</label>
              <input
                id="colorName"
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="e.g., Primary Blue, Accent Red"
                maxLength={50}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="colorHex">Color</label>
              <div className={styles.colorInput}>
                <input
                  id="colorHex"
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  required
                />
                <input
                  type="text"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="green"
              size="sm"
              disabled={addingColor || !newColorName.trim()}
            >
              {addingColor ? 'Adding...' : 'Add Color'}
            </Button>
          </div>
        </form>
      </div>

      {/* Existing colors */}
      <div className={styles.colorsList}>
        <h4 className={styles.sectionTitle}>Team Colors ({colors.length})</h4>
        
        {colors.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No custom colors added yet. Add your first color above.</p>
          </div>
        ) : (
          <div className={styles.colorsGrid}>
            {colors.map((color) => (
              <div key={color.id} className={styles.colorCard}>
                {editingColor?.id === color.id ? (
                  // Edit mode
                  <form onSubmit={handleEditColor} className={styles.editForm}>
                    <div className={styles.colorPreview}>
                      <div 
                        className={styles.colorSwatch}
                        style={{ backgroundColor: editColorHex }}
                      />
                    </div>
                    <div className={styles.editInputs}>
                      <input
                        type="text"
                        value={editColorName}
                        onChange={(e) => setEditColorName(e.target.value)}
                        placeholder="Color name"
                        maxLength={50}
                        required
                      />
                      <div className={styles.colorInput}>
                        <input
                          type="color"
                          value={editColorHex}
                          onChange={(e) => setEditColorHex(e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          value={editColorHex}
                          onChange={(e) => setEditColorHex(e.target.value)}
                          placeholder="#3B82F6"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.editActions}>
                      <Button
                        type="submit"
                        variant="green"
                        size="sm"
                        disabled={updatingColor || !editColorName.trim()}
                      >
                        {updatingColor ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        variant="gray"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={updatingColor}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  // Display mode
                  <>
                    <div className={styles.colorPreview}>
                      <div 
                        className={styles.colorSwatch}
                        style={{ backgroundColor: color.color_hex }}
                      />
                    </div>
                    <div className={styles.colorInfo}>
                      <h5 className={styles.colorName}>{color.color_name}</h5>
                      <p className={styles.colorHex}>{color.color_hex}</p>
                    </div>
                    <div className={styles.colorActions}>
                      <Button
                        variant="blue"
                        size="sm"
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage instructions */}
      <div className={styles.instructions}>
        <h4 className={styles.sectionTitle}>How to Use</h4>
        <ul className={styles.instructionsList}>
          <li>Add custom colors that match your brand or preferences</li>
          <li>Colors will be available for selection in charts and visualizations</li>
          <li>You can edit color names and values at any time</li>
          <li>Colors are shared across your entire team</li>
        </ul>
      </div>
    </div>
  );
} 