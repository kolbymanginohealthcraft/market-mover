// src/components/Navbar.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "../../app/supabaseClient";
import logo from '../../assets/Healthcraft-White.png';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <Link to={user ? "/app/home" : "/"} className={styles.logoLink}>
  <img src={logo} alt="Healthcraft Logo" className={styles.logo} />
</Link>

      <div className={styles.navLinks}>
        {user ? (
          <>
            <Link to="/app/home" className={styles.link}>Home</Link>
            <Link to="/app/search" className={styles.link}>Search</Link>
            <Link to="/app/explore" className={styles.link}>Explore</Link>
            <Link to="/app/profile" className={styles.link}>Profile</Link>
            <Link to="/app/markets" className={styles.link}>Markets</Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/pricing" className={styles.button}>Pricing</Link>
            <Link to="/login" className={styles.button}>Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
