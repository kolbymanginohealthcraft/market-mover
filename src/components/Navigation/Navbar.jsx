import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import logo from "../../assets/Healthcraft-White.png";
import styles from "../../styles/Navbar.module.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed:", error.message);
    } else {
      navigate("/");
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const renderLinks = () =>
    user ? (
      <>
        <Link to="/app/home" onClick={closeMenu} className={styles.link}>Home</Link>
        <Link to="/app/search" onClick={closeMenu} className={styles.link}>Search</Link>
        <Link to="/app/explore" onClick={closeMenu} className={styles.link}>Explore</Link>
        <Link to="/app/profile" onClick={closeMenu} className={styles.link}>Profile</Link>
        <Link to="/app/markets" onClick={closeMenu} className={styles.link}>Markets</Link>
        <button onClick={() => { closeMenu(); handleLogout(); }} className="button-nav">Logout</button>
      </>
    ) : (
      <>
        <Link to="/overview" onClick={closeMenu} className={styles.link}>Overview</Link>
        <Link to="/use-cases" onClick={closeMenu} className={styles.link}>Use Cases</Link>
        <Link to="/faq" onClick={closeMenu} className={styles.link}>FAQ</Link>
        <Link to="/pricing" onClick={closeMenu} className={styles.link}>Pricing</Link>
        <Link to="/login" onClick={closeMenu} className="button-nav">Login</Link>
      </>
    );

  return (
    <nav className={styles.nav}>
      <div className={styles.navTop}>
        <Link to={user ? "/app/home" : "/"} className={styles.logoLink}>
          <img src={logo} alt="Healthcraft Logo" className={styles.logo} />
        </Link>
        <button className={styles.menuButton} onClick={toggleMenu} aria-label="Toggle menu">
          ☰
        </button>
      </div>

      <div className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
        {renderLinks()}
      </div>
    </nav>
  );
};

export default Navbar;
