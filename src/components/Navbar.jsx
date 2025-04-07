// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '../assets/Healthcraft-White.png'; // 👈 your logo image

const Navbar = () => {
  const location = useLocation();
  const hideLogin = location.pathname === '/login';

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logoLink}>
        <img src={logo} alt="Healthcraft Logo" className={styles.logo} />
      </Link>
      {!hideLogin && (
        <Link to="/login" className={styles.button}>
          Login
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
