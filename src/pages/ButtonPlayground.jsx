import { useState } from "react";
import Button from "../components/Buttons/Button";
import ButtonGroup from "../components/Buttons/ButtonGroup";
import styles from "./ButtonPlayground.module.css";

const variants = [
  "green",
  "gold",
  "accent",
  "red",
  "teal",
  "blue",
  "aqua",
  "gray"
];

export default function ButtonPlayground() {
  const [selectedOption, setSelectedOption] = useState("All");
  const [user, setUser] = useState(false); // Mock auth state

  const handleLogin = () => setUser(true);
  const handleLogout = () => setUser(false);

  return (
    <div className={styles.container}>
      <h2>Navbar Buttons (Login / Logout)</h2>
      {user ? (
        <button className={`button-nav ${styles.navButton}`} onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <button className={`button-nav ${styles.navButton}`} onClick={handleLogin}>
          Login
        </button>
      )}

      <h2 className={styles.section}>Standard (Filled) Buttons</h2>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} className={styles.button}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Button>
      ))}

      <h2 className={styles.section}>Outline Buttons</h2>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} outline className={styles.button}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)} Outline
        </Button>
      ))}

      <h2 className={styles.section}>Ghost Buttons</h2>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} ghost className={styles.button}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)} Ghost
        </Button>
      ))}

      <h2 className={styles.section}>Sizes</h2>
      <Button size="sm" className={styles.smallButton}>Small</Button>
      <Button>Default</Button>
      <Button size="lg" className={styles.largeButton}>Large</Button>

      <h2 className={styles.section}>Disabled States</h2>
      <Button disabled className={styles.disabledButton}>Disabled</Button>
      <Button variant="gold" disabled className={styles.disabledButton}>Gold Disabled</Button>
      <Button variant="accent" size="lg" disabled>Accent Large Disabled</Button>

      <h2 className={styles.section}>Filter Buttons</h2>
      <Button isFilter isActive>Active Filter</Button>
      <Button isFilter className={styles.filterButton}>Inactive Filter</Button>
      <Button isFilter size="sm" className={styles.filterButton}>Small Filter</Button>

      <h2 className={styles.section}>ButtonGroup</h2>
      <ButtonGroup
        options={['All', 'Hospital', 'SNF']}
        selected={selectedOption}
        onSelect={setSelectedOption}
      />

      <h2 className={styles.section}>Mixed Props</h2>
      <Button variant="green" size="lg" outline className={styles.mixedButton}>
        Green Large Outline
      </Button>
      <Button variant="gold" ghost size="sm">
        Gold Ghost Small
      </Button>
    </div>
  );
}
