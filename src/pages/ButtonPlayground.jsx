import { useState } from "react";
import Button from "../components/Buttons/Button";
import ButtonGroup from "../components/Buttons/ButtonGroup"; // <-- optional if you want to show ButtonGroup

export default function ButtonPlayground() {
  const [selectedOption, setSelectedOption] = useState("All");

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Standard Buttons</h2>
      <Button>Primary Button</Button>
      <Button variant="gold" style={{ marginLeft: "1rem" }}>Gold Button</Button>
      <Button variant="accent" style={{ marginLeft: "1rem" }}>Accent Button</Button>

      <h2 style={{ marginTop: "2rem" }}>Outline and Ghost</h2>
      <Button className="button-outline" style={{ marginRight: "1rem" }}>Outline Button</Button>
      <Button className="button-ghost">Ghost Button</Button>

      <h2 style={{ marginTop: "2rem" }}>Small and Large Buttons</h2>
      <Button className="button-sm" style={{ marginRight: "1rem" }}>Small Button</Button>
      <Button className="button-lg">Large Button</Button>

      <h2 style={{ marginTop: "2rem" }}>Filter Button Example</h2>
      <Button isFilter isActive>Active Filter</Button>
      <Button isFilter style={{ marginLeft: "1rem" }}>Inactive Filter</Button>

      <h2 style={{ marginTop: "2rem" }}>ButtonGroup Example</h2>
      <ButtonGroup
        options={['All', 'Hospital', 'SNF']}
        selected={selectedOption}
        onSelect={setSelectedOption}
      />
    </div>
  );
}
