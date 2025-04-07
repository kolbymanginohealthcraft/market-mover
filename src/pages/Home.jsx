import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import styles from './Home.module.css'

export default function Home() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Welcome to the Analytics Dashboard</h2>
      <div>
        <Link to="/search">
          <button className={styles.button}>Search for a Provider</button>
        </Link>
        <Link to="/explore">
          <button className={styles.button}>Explore the Industry</button>
        </Link>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleLogout} className={styles.button}>
          Log out
        </button>
      </div>
    </div>
  )
}
