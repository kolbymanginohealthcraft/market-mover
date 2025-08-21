# Layout System Documentation

## Overview

This layout system ensures that all pages properly fill the available space next to the sidebar navigation. The system consists of two main components:

1. **SidebarLayout** - The main layout wrapper that includes the sidebar and main content area
2. **PageLayout** - A standardized wrapper for individual page content

## Components

### SidebarLayout
- Wraps the entire private app area
- Contains the fixed sidebar (280px width)
- Provides the main content area with proper spacing
- Automatically adjusts for sidebar width

### PageLayout
- Standardized wrapper for page content
- Ensures proper padding and spacing
- Provides consistent layout across all pages
- Supports `fullWidth` prop for pages that need no padding

## Usage

### Basic Page Layout
```jsx
import PageLayout from '../../../components/Layouts/PageLayout';

export default function MyPage() {
  return (
    <PageLayout>
      <h1>My Page Content</h1>
      <p>This content will have standard padding and spacing.</p>
    </PageLayout>
  );
}
```

### Full Width Page Layout
```jsx
import PageLayout from '../../../components/Layouts/PageLayout';

export default function MyFullWidthPage() {
  return (
    <PageLayout fullWidth>
      <div className="my-custom-layout">
        <h1>Full Width Content</h1>
        <p>This content has no padding and fills the entire available space.</p>
      </div>
    </PageLayout>
  );
}
```

### With Custom CSS Classes
```jsx
import PageLayout from '../../../components/Layouts/PageLayout';

export default function MyCustomPage() {
  return (
    <PageLayout className="my-custom-page">
      <h1>Custom Styled Page</h1>
      <p>This page has additional custom styling.</p>
    </PageLayout>
  );
}
```

## Layout Structure

```
SidebarLayout
├── Sidebar (280px fixed width)
└── Main Content Area
    └── PageLayout
        └── Your Page Content
```

## Key Features

- **Responsive**: Automatically adjusts for mobile devices
- **Consistent Spacing**: Standardized padding and margins
- **Full Width Support**: Option for pages that need edge-to-edge content
- **Proper Overflow Handling**: Content scrolls properly within the available space
- **Sidebar Integration**: Seamlessly works with the sidebar navigation

## CSS Classes

### PageLayout
- `.pageLayout` - Base container with standard padding
- `.fullWidth` - Removes padding for edge-to-edge content

### SidebarLayout
- `.page` - Main flex container
- `.main` - Content area with proper sidebar offset

## Best Practices

1. **Always use PageLayout** for new pages to ensure consistent spacing
2. **Use fullWidth** for pages with custom layouts (like maps, charts, etc.)
3. **Don't add custom margins/padding** to page containers - let PageLayout handle it
4. **Test on mobile** to ensure responsive behavior works correctly
