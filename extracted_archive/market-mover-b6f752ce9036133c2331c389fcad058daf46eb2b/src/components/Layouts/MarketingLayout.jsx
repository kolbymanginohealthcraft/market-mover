// src/components/MarketingLayout.jsx
import React, { useState } from "react";
import MarketingSidebar from "../Navigation/MarketingSidebar";
import styles from "../../styles/MarketingLayout.module.css";

function MarketingLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={styles.layout}>
      <div className={`${styles.sidebarWrapper} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.toggleButton} onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "»" : "«"}
        </div>
        {!isCollapsed && <MarketingSidebar />}
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  );
}

export default MarketingLayout;
