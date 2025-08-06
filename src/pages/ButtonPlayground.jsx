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

      <h2 className={styles.section}>Close Buttons</h2>
      <div className={styles.closeButtonDemo}>
        <div className={styles.sidebarHeader}>
          <h3>Sidebar Title</h3>
          <Button 
            variant="gray" 
            size="sm" 
            outline 
            className={styles.closeButton}
          >
            ×
          </Button>
        </div>
        <p>This demonstrates the close button styling used in sidebars.</p>
      </div>

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

      {/* Dark Background Sections */}
      <div className={styles.darkSection}>
        <h2 className={styles.section}>Dark Background - Filled Buttons</h2>
        {variants.map((variant) => (
          <Button key={variant} variant={variant} darkBg className={styles.button}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)} Dark
          </Button>
        ))}

        <h2 className={styles.section}>Dark Background - Outline Buttons</h2>
        {variants.map((variant) => (
          <Button key={variant} variant={variant} outline darkBg className={styles.button}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)} Outline Dark
          </Button>
        ))}

        <h2 className={styles.section}>Dark Background - Ghost Buttons</h2>
        {variants.map((variant) => (
          <Button key={variant} variant={variant} ghost darkBg className={styles.button}>
            {variant.charAt(0).toUpperCase() + variant.slice(1)} Ghost Dark
          </Button>
        ))}

        <h2 className={styles.section}>Dark Background - Filter Buttons</h2>
        <Button isFilter isActive darkBg>Active Filter Dark</Button>
        <Button isFilter darkBg className={styles.filterButton}>Inactive Filter Dark</Button>
        <Button isFilter size="sm" darkBg className={styles.filterButton}>Small Filter Dark</Button>

        <h2 className={styles.section}>Dark Background - Navbar Buttons</h2>
        {user ? (
          <button className={`button-nav dark-bg ${styles.navButton}`} onClick={handleLogout}>
            Logout Dark
          </button>
        ) : (
          <button className={`button-nav dark-bg ${styles.navButton}`} onClick={handleLogin}>
            Login Dark
          </button>
        )}

        <h2 className={styles.section}>Dark Background - Mixed Props</h2>
        <Button variant="green" size="lg" outline darkBg className={styles.mixedButton}>
          Green Large Outline Dark
        </Button>
        <Button variant="gold" ghost size="sm" darkBg>
          Gold Ghost Small Dark
        </Button>
      </div>

      <h2 className={styles.section}>Banner Buttons</h2>
      <div className={styles.bannerDemo}>
        <div className={styles.bannerBackground}>
          <Button banner bannerVariant="default" className={styles.bannerButton}>
            Default Banner
          </Button>
          <Button banner bannerVariant="active" className={styles.bannerButton}>
            Active Banner
          </Button>
          <Button banner bannerVariant="primary" className={styles.bannerButton}>
            Primary Banner
          </Button>
        </div>
        <p>Banner buttons are designed for use on gradient backgrounds.</p>
      </div>

      <h2 className={styles.section}>Banner Button Sizes</h2>
      <div className={styles.bannerDemo}>
        <div className={styles.bannerBackground}>
          <Button banner bannerVariant="default" size="sm" className={styles.bannerButton}>
            Small Banner
          </Button>
          <Button banner bannerVariant="default" className={styles.bannerButton}>
            Default Size
          </Button>
          <Button banner bannerVariant="default" size="lg" className={styles.bannerButton}>
            Large Banner
          </Button>
        </div>
      </div>

      <h2 className={styles.section}>Banner Button Variants</h2>
      <div className={styles.bannerDemo}>
        <div className={styles.bannerBackground}>
          <Button banner bannerVariant="default" className={styles.bannerButton}>
            Default
          </Button>
          <Button banner bannerVariant="active" className={styles.bannerButton}>
            Active
          </Button>
          <Button banner bannerVariant="primary" className={styles.bannerButton}>
            Primary
          </Button>
        </div>
        <p>Use these variants to indicate different button states in banner contexts.</p>
      </div>
    </div>
  );
}
