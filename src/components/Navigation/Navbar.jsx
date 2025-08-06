import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../app/supabaseClient";
import logo from "../../assets/Healthcraft-White.png";
import styles from "../../styles/Navbar.module.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const navRef = useRef();

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

  // ✅ Detect clicks outside of the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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
        <Link to="/app/dashboard" onClick={closeMenu} className={styles.link}>Dashboard</Link>
        <Link to="/app/search" onClick={closeMenu} className={styles.link}>Search</Link>
        <Link to="/app/markets" onClick={closeMenu} className={styles.link}>Markets</Link>
        <Link to="/app/settings" onClick={closeMenu} className={styles.link}>Settings</Link>
        <button onClick={() => { closeMenu(); handleLogout(); }} className="button-nav">Logout</button>
      </>
    ) : (
      <>
        <Link to="/faq" onClick={closeMenu} className={styles.link}>FAQ</Link>
        <Link to="/pricing" onClick={closeMenu} className={styles.link}>Pricing</Link>
        <Link to="/login" onClick={closeMenu} className="button-nav">Log In</Link>
      </>
    );

  return (
    <nav className={styles.nav} ref={navRef}>
      <div className={styles.navTop}>
        <Link to={user ? "/app/dashboard" : "/"} className={styles.logoLink}>
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
