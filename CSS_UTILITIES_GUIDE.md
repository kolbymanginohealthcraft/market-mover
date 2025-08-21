# CSS Utilities Guide - Reducing Module Duplication

## Overview

We've centralized common styles into utility classes in `src/app/base.css` to reduce duplication across CSS modules. This guide shows you how to use these utilities and minimize custom CSS in your modules.

## Page Layout Utilities

### Basic Page Classes
```css
/* Instead of defining in each module: */
.page {
  padding: 24px;
  margin: 0;
}

/* Use the global class directly in your JSX: */
<div className="page">
  {/* Your content */}
</div>
```

### Page Variants
```css
/* Full-height page with flex layout */
<div className="page-full">
  {/* For pages that need full viewport height */}
</div>

/* Centered page with max-width */
<div className="page-centered">
  {/* For marketing/public pages */}
</div>

/* Page with gradient background */
<div className="page page-gradient">
  {/* For pages with gradient backgrounds */}
</div>
```

## Typography Utilities

### Text Colors
```css
/* Instead of: color: #00c08b; */
<span className="text-primary">Primary text</span>

/* Instead of: color: #52bad7; */
<span className="text-secondary">Secondary text</span>

/* Instead of: color: #084938; */
<span className="text-dark">Dark text</span>

/* Instead of: color: #6b7280; */
<span className="text-muted">Muted text</span>
```

### Font Sizes
```css
/* Instead of: font-size: 0.875rem; */
<span className="text-sm">Small text</span>

/* Instead of: font-size: 1.5rem; */
<h2 className="text-2xl">Large heading</h2>

/* Instead of: font-size: 2.25rem; */
<h1 className="text-4xl">Extra large heading</h1>
```

### Font Weights
```css
/* Instead of: font-weight: 600; */
<span className="font-semibold">Semibold text</span>

/* Instead of: font-weight: 700; */
<span className="font-bold">Bold text</span>

/* Instead of: font-weight: 500; */
<span className="font-medium">Medium text</span>
```

### Text Alignment
```css
/* Instead of: text-align: center; */
<div className="text-center">Centered content</div>

/* Instead of: text-align: right; */
<div className="text-right">Right-aligned content</div>
```

## Spacing Utilities

### Padding
```css
/* Instead of: padding: 1rem; */
<div className="p-4">Content with padding</div>

/* Instead of: padding: 1.5rem; */
<div className="p-6">Content with more padding</div>

/* Instead of: padding: 2rem; */
<div className="p-8">Content with large padding</div>

/* Horizontal padding only */
<div className="px-4">Content with horizontal padding</div>

/* Vertical padding only */
<div className="py-4">Content with vertical padding</div>
```

### Margins
```css
/* Instead of: margin: 0; */
<div className="m-0">No margin</div>

/* Instead of: margin-bottom: 1rem; */
<div className="mb-4">Content with bottom margin</div>

/* Instead of: margin-top: 1.5rem; */
<div className="mt-6">Content with top margin</div>

/* Center horizontally */
<div className="mx-auto">Centered content</div>
```

## Layout Utilities

### Flexbox
```css
/* Instead of: display: flex; */
<div className="flex">Flex container</div>

/* Instead of: flex-direction: column; */
<div className="flex flex-col">Vertical flex</div>

/* Instead of: align-items: center; */
<div className="flex items-center">Centered items</div>

/* Instead of: justify-content: space-between; */
<div className="flex justify-between">Space between items</div>

/* Instead of: gap: 1rem; */
<div className="flex gap-4">Items with gap</div>
```

### Grid
```css
/* Instead of: display: grid; */
<div className="grid">Grid container</div>

/* Instead of: grid-template-columns: repeat(2, 1fr); */
<div className="grid grid-cols-2">Two column grid</div>

/* Instead of: grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); */
<div className="dashboard-grid">Responsive dashboard grid</div>
```

## Card Utilities

### Basic Cards
```css
/* Instead of defining card styles in each module */
<div className="card">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-body">
    Card content
  </div>
</div>
```

### Glassmorphism Cards
```css
/* For glassmorphism effect */
<div className="card card-glass">
  Glassmorphism content
</div>
```

## Button Utilities

### Button Variants
```css
/* Primary button */
<button className="btn btn-primary">Primary Action</button>

/* Secondary button */
<button className="btn btn-secondary">Secondary Action</button>

/* Success button */
<button className="btn btn-success">Success Action</button>

/* Glassmorphism button */
<button className="btn btn-glass">Glass Button</button>
```

## Form Utilities

### Form Elements
```css
/* Form group */
<div className="form-group">
  <label className="form-label">Label</label>
  <input className="form-input" type="text" />
</div>

/* Select dropdown */
<select className="form-select">
  <option>Option 1</option>
</select>
```

## Background & Border Utilities

### Backgrounds
```css
/* Instead of: background-color: white; */
<div className="bg-white">White background</div>

/* Instead of: background-color: #f9fafb; */
<div className="bg-gray-50">Light gray background</div>

/* Gradient backgrounds */
<div className="bg-gradient-primary">Primary gradient</div>
<div className="bg-gradient-secondary">Secondary gradient</div>
```

### Borders
```css
/* Instead of: border: 1px solid #e5e7eb; */
<div className="border">Bordered element</div>

/* Instead of: border-radius: 0.5rem; */
<div className="rounded-lg">Rounded element</div>

/* Instead of: border-color: #00c08b; */
<div className="border border-primary">Primary border</div>
```

### Shadows
```css
/* Instead of: box-shadow: 0 1px 3px rgba(0,0,0,0.1); */
<div className="shadow">Shadowed element</div>

/* Instead of: box-shadow: 0 4px 6px rgba(0,0,0,0.1); */
<div className="shadow-md">Medium shadow</div>

/* Remove shadow */
<div className="shadow-none">No shadow</div>
```

## Width & Height Utilities

```css
/* Instead of: width: 100%; */
<div className="w-full">Full width</div>

/* Instead of: height: 100vh; */
<div className="h-screen">Full viewport height</div>

/* Instead of: min-height: 100vh; */
<div className="min-h-screen">Minimum full height</div>
```

## Overflow Utilities

```css
/* Instead of: overflow: hidden; */
<div className="overflow-hidden">Hidden overflow</div>

/* Instead of: overflow-y: auto; */
<div className="overflow-y-auto">Vertical scroll</div>
```

## Table Utilities

```css
/* Instead of defining table styles in each module */
<table className="table">
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

## Widget Utilities

```css
/* Dashboard widgets */
<div className="widget">
  <div className="widget-header">
    <h3 className="widget-title">Widget Title</h3>
  </div>
  <div className="widget-body">
    Widget content
  </div>
</div>
```

## Responsive Utilities

The utilities automatically include responsive variants:

```css
/* Responsive text sizes */
<h1 className="text-4xl">Large on desktop, smaller on mobile</h1>

/* Responsive padding */
<div className="p-8">Less padding on mobile</div>

/* Responsive grid */
<div className="dashboard-grid">Single column on mobile</div>
```

## Migration Examples

### Before (CSS Module)
```css
/* MyComponent.module.css */
.container {
  padding: 24px;
  margin: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #00c08b;
  margin-bottom: 1rem;
}

.content {
  color: #6b7280;
  line-height: 1.6;
}

.button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #00c08b 0%, #01514a 100%);
  color: white;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
}
```

### After (Using Utilities)
```css
/* MyComponent.module.css */
/* Only custom styles that can't be achieved with utilities */
.customAnimation {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

```jsx
// MyComponent.jsx
<div className="page bg-white rounded-lg shadow p-6">
  <h2 className="text-2xl font-semibold text-primary mb-4">Title</h2>
  <p className="text-muted">Content</p>
  <button className="btn btn-primary">Action</button>
</div>
```

## Best Practices

1. **Use utilities first**: Always check if a utility class exists before writing custom CSS
2. **Combine utilities**: Use multiple utility classes together for complex styling
3. **Keep modules minimal**: Only write CSS for truly unique styles
4. **Use semantic class names**: When you do need custom CSS, use descriptive names
5. **Leverage CSS variables**: Use the design system variables for colors and spacing

## Common Patterns

### Page Layout
```jsx
<div className="page">
  <div className="container">
    <h1 className="text-4xl font-bold text-center mb-8">Page Title</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Content */}
    </div>
  </div>
</div>
```

### Card Layout
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="font-semibold">Card Title</h3>
  </div>
  <div className="card-body">
    <p className="text-muted mb-4">Card content</p>
    <div className="flex justify-end gap-2">
      <button className="btn btn-secondary">Cancel</button>
      <button className="btn btn-primary">Save</button>
    </div>
  </div>
</div>
```

### Form Layout
```jsx
<form className="space-y-4">
  <div className="form-group">
    <label className="form-label">Name</label>
    <input className="form-input" type="text" />
  </div>
  <div className="form-group">
    <label className="form-label">Email</label>
    <input className="form-input" type="email" />
  </div>
  <div className="flex justify-end">
    <button className="btn btn-primary">Submit</button>
  </div>
</form>
```

This approach will significantly reduce CSS duplication and make your styles more consistent across the application.
