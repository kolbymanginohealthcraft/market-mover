import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <h2>Home Page</h2>
      <button className={styles.button}>Click Me</button>
    </div>
  )
}
