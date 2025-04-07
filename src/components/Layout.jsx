import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import styles from './Layout.module.css'

export default function Layout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div>
      <nav className={styles.navbar}>
        <NavLink to="/home" className={styles.link}>Home</NavLink>
        <NavLink to="/search" className={styles.link}>Search</NavLink>
        <NavLink to="/explore" className={styles.link}>Explore</NavLink>
        <button onClick={handleLogout} className={styles.logout}>
          Logout
        </button>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
