import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <h2>Home Page</h2>
      <button className="button button-lg gold">Click Me</button>
    </div>
  )
}
