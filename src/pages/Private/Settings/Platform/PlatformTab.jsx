import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import Button from "../../../../components/Buttons/Button";
import SectionHeader from "../../../../components/Layouts/SectionHeader";
import styles from "./PlatformTab.module.css";

export default function PlatformTab() {
  const navigate = useNavigate();

  return (
    <div className={styles.section}>
      <SectionHeader 
        title="Platform Administration" 
        icon={Settings} 
        showEditButton={false}
      />
      
      <div className={styles.content}>
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

        <div className={`${styles.toolCard} ${styles.styleGuide}`}>
          <h3>Style Guide</h3>
          <p>View and test all platform UI components, colors, and typography</p>
          <Button
            variant="blue"
            size="md"
            onClick={() => navigate("/app/settings/platform/style-guide")}
            className={styles.button}
          >
            View Style Guide
          </Button>
        </div>

        {/* Temp Section */}
        <div className={`${styles.toolCard} ${styles.temp}`}>
          <h3>Development Tools</h3>
          <p>Testing and development utilities</p>
          <div className={styles.tempButtons}>
            <Button
              variant="red"
              size="sm"
              onClick={() => navigate("/app/banner-test")}
              className={styles.tempButton}
            >
              Banner Test
            </Button>

            <Button
              variant="red"
              size="sm"
              onClick={() => navigate("/app/spinner-demo")}
              className={styles.tempButton}
            >
              Spinner Demo
            </Button>
            <Button
              variant="red"
              size="sm"
              onClick={() => navigate("/payment-flow")}
              className={styles.tempButton}
            >
              Payment Flow
            </Button>
            <Button
              variant="red"
              size="sm"
              onClick={() => navigate("/app/billing")}
              className={styles.tempButton}
            >
              Billing History
            </Button>
            
            <Button
              variant="red"
              size="sm"
              onClick={() => navigate("/auth/paymenttest")}
              className={styles.tempButton}
            >
              Payment Test
            </Button>
            
            <Button
              variant="blue"
              size="sm"
              onClick={() => navigate("/app/settings/platform/style-guide")}
              className={styles.tempButton}
            >
              Style Guide
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
} 