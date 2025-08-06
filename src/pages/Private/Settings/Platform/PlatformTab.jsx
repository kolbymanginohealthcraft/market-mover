import { useNavigate } from "react-router-dom";
import Button from "../../../../components/Buttons/Button";
import styles from "./PlatformTab.module.css";

export default function PlatformTab() {
  const navigate = useNavigate();

  return (
    <div className={styles.section}>
      
      <div className={styles.platformTools}>
        <div className={`${styles.toolCard} ${styles.announcements}`}>
          <h3>System Announcements</h3>
          <p>Manage system-wide announcements that appear on user home pages</p>
          <Button
            variant="blue"
            size="md"
            onClick={() => navigate("/app/manage-announcements")}
            className={styles.button}
          >
            Manage Announcements
          </Button>
        </div>

        <div className={`${styles.toolCard} ${styles.feedback}`}>
          <h3>Feedback Approvals</h3>
          <p>Review and approve testimonials and feature requests</p>
          <Button
            variant="blue"
            size="md"
            onClick={() => navigate("/app/manage-feedback")}
            className={styles.button}
          >
            Manage Feedback
          </Button>
        </div>

        <div className={`${styles.toolCard} ${styles.analytics}`}>
          <h3>Analytics Dashboard</h3>
          <p>View platform usage analytics and user engagement metrics</p>
          <Button
            variant="blue"
            size="md"
            onClick={() => navigate("/app/analytics-dashboard")}
            className={styles.button}
          >
            View Analytics
          </Button>
        </div>

        <div className={`${styles.toolCard} ${styles.users}`}>
          <h3>User Management</h3>
          <p>Manage user accounts, roles, and permissions</p>
          <Button
            variant="blue"
            size="md"
            onClick={() => navigate("/app/manage-users")}
            className={styles.button}
          >
            Manage Users
          </Button>
        </div>

        <div className={`${styles.toolCard} ${styles.legal}`}>
          <h3>Policy Management</h3>
          <p>Create, edit, and approve legal policies with version control</p>
          <Button
            variant="blue"
            size="md"
            onClick={() => navigate("/app/policy-management")}
            className={styles.button}
          >
            Manage Policies
          </Button>
        </div>
      </div>
    </div>
  );
} 