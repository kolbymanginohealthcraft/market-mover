# ControlsRow Component

A standardized controls row component that provides a consistent design across pages with the same gradient style as SectionHeader.

## Current Usage

This component is currently being used in:
- **Network List View** (`src/pages/Private/Network/NetworkListView.jsx`) - Search, filters, and provider count
- **Network Map View** (`src/pages/Private/Network/NetworkMapView.jsx`) - Legend filters and provider count

## Usage

```jsx
import ControlsRow from '../../../components/Layouts/ControlsRow';
import controlsStyles from '../../../components/Layouts/ControlsRow.module.css';

// Basic usage with left and right content
<ControlsRow
  leftContent={
    <>
      <input
        type="text"
        placeholder="Search..."
        className={controlsStyles.searchInput}
      />
      <select className={controlsStyles.filterSelect}>
        <option>Filter</option>
      </select>
    </>
  }
  rightContent={
    <span className={controlsStyles.summaryText}>
      Showing 10 of 50 items
    </span>
  }
/>

// With center content
<ControlsRow
  leftContent={<Button>Action</Button>}
  rightContent={<span className={controlsStyles.summaryText}>Summary</span>}
>
  <div>Center content here</div>
</ControlsRow>
```

## Props

- `leftContent`: Content for the left section (search, filters, buttons)
- `rightContent`: Content for the right section (summary text, actions)
- `children`: Content for the center section
- `className`: Additional CSS classes
- `...props`: Any other props passed to the container div

## Styling

The component uses the same gradient as SectionHeader:
- Background: `linear-gradient(90deg, var(--gray-50) 0%, #e6f7f0 100%)`
- Border: `1px solid var(--gray-200)`
- Border radius: `12px`
- Box shadow: `0 2px 8px rgba(0, 0, 0, 0.1)`

## Available CSS Classes

- `.searchInput`: Standardized search input styling
- `.filterSelect`: Standardized select dropdown styling
- `.summaryText`: Text styling matching SectionHeader (uppercase, letter-spacing)

## Responsive Design

On mobile devices (max-width: 768px):
- Controls stack vertically
- Inputs take full width
- Content centers horizontally
