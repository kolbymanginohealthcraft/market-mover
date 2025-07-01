import { useState } from "react";
import Button from "../components/Buttons/Button";
import ButtonGroup from "../components/Buttons/ButtonGroup";

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
    <div style={{ padding: "2rem", fontFamily: "Work Sans" }}>
      <h2>Navbar Buttons (Login / Logout)</h2>
      {user ? (
        <button className="button-nav" onClick={handleLogout} style={{ marginRight: "1rem" }}>
          Logout
        </button>
      ) : (
        <button className="button-nav" onClick={handleLogin} style={{ marginRight: "1rem" }}>
          Login
        </button>
      )}

      <h2 style={{ marginTop: "2rem" }}>Standard (Filled) Buttons</h2>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} style={{ marginRight: "1rem", marginBottom: "0.5rem" }}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Button>
      ))}

      <h2 style={{ marginTop: "2rem" }}>Outline Buttons</h2>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} outline style={{ marginRight: "1rem", marginBottom: "0.5rem" }}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)} Outline
        </Button>
      ))}

      <h2 style={{ marginTop: "2rem" }}>Ghost Buttons</h2>
      {variants.map((variant) => (
        <Button key={variant} variant={variant} ghost style={{ marginRight: "1rem", marginBottom: "0.5rem" }}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)} Ghost
        </Button>
      ))}

      <h2 style={{ marginTop: "2rem" }}>Sizes</h2>
      <Button size="sm" style={{ marginRight: "1rem" }}>Small</Button>
      <Button>Default</Button>
      <Button size="lg" style={{ marginLeft: "1rem" }}>Large</Button>

      <h2 style={{ marginTop: "2rem" }}>Disabled States</h2>
      <Button disabled style={{ marginRight: "1rem" }}>Disabled</Button>
      <Button variant="gold" disabled style={{ marginRight: "1rem" }}>Gold Disabled</Button>
      <Button variant="accent" size="lg" disabled>Accent Large Disabled</Button>

      <h2 style={{ marginTop: "2rem" }}>Filter Buttons</h2>
      <Button isFilter isActive>Active Filter</Button>
      <Button isFilter style={{ marginLeft: "1rem" }}>Inactive Filter</Button>
      <Button isFilter size="sm" style={{ marginLeft: "1rem" }}>Small Filter</Button>

      <h2 style={{ marginTop: "2rem" }}>ButtonGroup</h2>
      <ButtonGroup
        options={['All', 'Hospital', 'SNF']}
        selected={selectedOption}
        onSelect={setSelectedOption}
      />

      <h2 style={{ marginTop: "2rem" }}>Mixed Props</h2>
      <Button variant="green" size="lg" outline style={{ marginRight: "1rem" }}>
        Green Large Outline
      </Button>
      <Button variant="gold" ghost size="sm">
        Gold Ghost Small
      </Button>
    </div>
  );
}
