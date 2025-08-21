# Global Dropdown Component

A smart dropdown component that automatically positions dropdowns above or below the trigger based on available space.

## Features

- **Smart positioning**: Automatically positions dropdowns above or below the trigger based on available space
- **Responsive**: Adjusts position on scroll and resize events
- **Accessibility**: Supports keyboard navigation (Escape key) and click outside to close
- **Glassmorphism styling**: Consistent with the app's design system

## Usage

```jsx
import Dropdown from '../../../components/Buttons/Dropdown';
import dropdownStyles from '../../../components/Buttons/Dropdown.module.css';

// Basic usage
<Dropdown
  trigger={<button>Click me</button>}
  isOpen={isDropdownOpen}
  onToggle={setIsDropdownOpen}
  className={dropdownStyles.dropdown}
>
  <button className={dropdownStyles.dropdownItem}>Option 1</button>
  <button className={dropdownStyles.dropdownItem}>Option 2</button>
  <div className={dropdownStyles.dropdownDivider}></div>
  <button className={dropdownStyles.dropdownItem}>Option 3</button>
</Dropdown>
```

## Props

- `trigger`: React element that triggers the dropdown
- `children`: Dropdown content (buttons, links, etc.)
- `isOpen`: Boolean controlling dropdown visibility
- `onToggle`: Function called when dropdown should open/close
- `className`: CSS class for the dropdown container
- `style`: Additional inline styles for the dropdown

## Styling

The component includes a CSS module with glassmorphism styling:

- `.dropdown`: Main dropdown container
- `.dropdownItem`: Individual dropdown items
- `.dropdownDivider`: Visual separator between items

## Example Implementation

See `NetworkListView.jsx` and `NetworkTab.jsx` for complete examples of tag dropdowns using this component.
