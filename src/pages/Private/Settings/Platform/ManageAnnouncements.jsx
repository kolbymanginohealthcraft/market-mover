import { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';
import Button from '../../../../components/Buttons/Button';
import styles from './ManageAnnouncements.module.css';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    announcement_date: new Date().toISOString().split('T')[0],
    priority: 1,
    is_active: true
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .order('announcement_date', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from('system_announcements')
        .insert(newAnnouncement);

      if (error) throw error;
      
      setNewAnnouncement({
        title: '',
        description: '',
        announcement_date: new Date().toISOString().split('T')[0],
        priority: 1,
        is_active: true
      });
      
      fetchAnnouncements();
    } catch (err) {
      console.error('Error adding announcement:', err);
    }
  };

  const toggleAnnouncement = async (id, isActive) => {
    try {
      const { error } = await supabase
        .from('system_announcements')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error('Error updating announcement:', err);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const { error } = await supabase
        .from('system_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📢 Manage System Announcements</h1>
        <p className={styles.subtitle}>
          Create and manage announcements that appear on user home pages
        </p>
      </div>

      <div className={styles.layout}>
        {/* Left Panel - Add New Announcement */}
        <div className={styles.leftPanel}>
          <div className={styles.section}>
            <h2>➕ Create New Announcement</h2>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g., 🎉 New Feature Available"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  placeholder="Describe the announcement in detail..."
                  value={newAnnouncement.description}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Announcement Date</label>
                  <input
                    type="date"
                    value={newAnnouncement.announcement_date}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, announcement_date: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: parseInt(e.target.value)})}
                  >
                    <option value={1}>High Priority</option>
                    <option value={2}>Medium Priority</option>
                    <option value={3}>Low Priority</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newAnnouncement.is_active}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, is_active: e.target.checked})}
                  />
                  <span>Make announcement active immediately</span>
                </label>
              </div>
              
              <div className={styles.buttonContainer}>
                <Button variant="accent" size="md" onClick={addAnnouncement}>
                  Create Announcement
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Existing Announcements */}
        <div className={styles.rightPanel}>
          <div className={styles.section}>
            <h2>📋 All Announcements</h2>
            {loading ? (
              <p className={styles.loading}>Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className={styles.empty}>No announcements found. Create your first one in the left panel!</p>
            ) : (
              <div className={styles.list}>
                {announcements.map((announcement) => (
                  <div key={announcement.id} className={`${styles.item} ${!announcement.is_active ? styles.inactive : ''}`}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemInfo}>
                        <h3>{announcement.title}</h3>
                        <div className={styles.itemMeta}>
                          <span className={styles.date}>
                            {new Date(announcement.announcement_date).toLocaleDateString()}
                          </span>
                          <span className={`${styles.priority} ${styles[`priority${announcement.priority}`]}`}>
                            Priority {announcement.priority}
                          </span>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <Button
                          variant={announcement.is_active ? "gray" : "accent"}
                          size="sm"
                          onClick={() => toggleAnnouncement(announcement.id, !announcement.is_active)}
                        >
                          {announcement.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          onClick={() => deleteAnnouncement(announcement.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className={styles.description}>{announcement.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 