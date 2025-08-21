import styles from './PageLayout.module.css';

const PageLayout = ({ children, className = '', fullWidth = false }) => {
  return (
    <div className={`${styles.pageLayout} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {children}
    </div>
  );
};

export default PageLayout;
