# Dropdown Management Hook

## useDropdownClose

A comprehensive hook for managing dropdown behavior with consistent global rules. Supports both bulk dropdowns (with refs) and individual dropdowns (with CSS selectors).

### Features

- **Click Outside**: Closes dropdown when clicking outside the dropdown area
- **Escape Key**: Closes dropdown when pressing the Escape key
- **Button Toggle**: Closes dropdown when clicking the button itself (toggle behavior)
- **Conditional Activation**: Only activates when dropdown is open
- **Dual Pattern Support**: Supports both bulk dropdowns and individual dropdowns

### Global Rules

This hook enforces consistent dropdown behavior across the entire application:

1. **Escape Key**: Always closes any open dropdown
2. **Click Outside**: Closes dropdown when clicking outside the dropdown area
3. **Button Click**: Toggles dropdown when clicking the trigger button (close if open, open if closed)
4. **Accessibility**: Proper keyboard navigation support

### Usage Patterns

#### Pattern 1: Bulk Dropdown (with refs)
```jsx
import { useDropdownClose } from '../hooks/useDropdownClose';

function MyComponent() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Use the hook for bulk dropdowns
  const { buttonRef } = useDropdownClose({
    ref: dropdownRef,
    closeCallback: () => setIsDropdownOpen(false),
    isOpen: isDropdownOpen
  });

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button ref={buttonRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        Toggle Dropdown
      </button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {/* Dropdown content */}
        </div>
      )}
    </div>
  );
}
```

#### Pattern 2: Individual Dropdowns (with CSS selectors)
```jsx
import { useDropdownClose } from '../hooks/useDropdownClose';

function MyComponent() {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  // Use the hook for individual dropdowns
  useDropdownClose({
    dropdownSelector: '.dropdown-menu',
    buttonSelector: '.dropdown-button',
    closeCallback: () => setOpenDropdownId(null),
    isOpen: openDropdownId !== null
  });

  return (
    <div>
      {items.map(item => (
        <div key={item.id} className="item">
          <button 
            className="dropdown-button"
            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
          >
            Toggle
          </button>
          {openDropdownId === item.id && (
            <div className="dropdown-menu">
              {/* Dropdown content */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Practical Example: Action Menu Component

Here's how you can use the standardized hook in a reusable action menu component:

```jsx
import { useState, useRef } from 'react';
import { useDropdownClose } from '../hooks/useDropdownClose';

function ActionMenu({ actions, trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Standardized dropdown behavior
  const { buttonRef } = useDropdownClose({
    ref: menuRef,
    closeCallback: () => setIsOpen(false),
    isOpen: isOpen
  });

  return (
    <div className="action-menu" ref={menuRef}>
      <button 
        ref={buttonRef}
        className="action-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div className="action-dropdown">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Usage
<ActionMenu 
  trigger="Actions"
  actions={[
    { id: 'edit', label: 'Edit', onClick: () => console.log('Edit') },
    { id: 'delete', label: 'Delete', onClick: () => console.log('Delete') }
  ]}
/>
```

### Parameters

The hook accepts an options object with the following properties:

- `ref` (optional): React ref for bulk dropdown containers
- `dropdownSelector` (optional): CSS selector for individual dropdown elements
- `buttonSelector` (optional): CSS selector for individual button elements
- `closeCallback` (required): Function to call when closing the dropdown
- `isOpen` (optional): Boolean indicating if dropdown is currently open (defaults to true)
- `enableButtonToggle` (optional): Whether clicking the button should toggle the dropdown

### Returns

- `buttonRef`: Ref to attach to the dropdown trigger button (for bulk dropdowns)

### Implementation Notes

- The hook automatically manages event listeners
- Event listeners are only active when the dropdown is open
- Proper cleanup is handled on component unmount
- Multiple dropdowns can coexist without conflicts
- Supports both ref-based and selector-based dropdown detection
- Can handle multiple individual dropdowns simultaneously
