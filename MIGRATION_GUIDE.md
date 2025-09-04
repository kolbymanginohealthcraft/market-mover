# CSS Migration Guide: From Custom Styles to Global Design System

## Overview
This guide helps migrate existing custom CSS to use the new global design system variables and utility classes defined in `src/app/base.css`.

## Migration Principles
1. **Replace hardcoded colors** with CSS variables
2. **Use utility classes** instead of custom CSS
3. **Maintain functionality** while improving consistency
4. **Test thoroughly** after each migration

## Color Migration Map

### Old Colors → New Variables
```css
/* OLD → NEW */
#265947 → var(--dark-green)
#f1b62c → var(--accent-yellow)
#3fb985 → var(--primary-teal)
#d64550 → var(--error-red)
#26d9d8 → var(--secondary-blue)
#3599b8 → var(--secondary-blue)
#4ac5bb → var(--secondary-blue-light)
#5f6b6d → var(--gray-500)
#e5e7eb → var(--gray-200)
#374151 → var(--gray-700)
#f9fafb → var(--gray-50)
#ffffff → var(--white)
```

## Component Migration Examples

### 1. Form Components
```css
/* OLD */
.formGroup {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.formGroup label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  min-width: 80px;
  flex-shrink: 0;
}

/* NEW - Use utility classes */
.form-group /* Already defined in base.css */
```

### 2. Section Components
```css
/* OLD */
.section {
  margin-bottom: 32px;
}

.content {
  background: white;
  border-radius: 0 0 8px 8px;
  border: 1px solid #e5e7eb;
  border-top: none;
  overflow: visible;
  padding: 24px;
}

/* NEW - Use utility classes */
.section /* Already defined in base.css */
.section-content /* Already defined in base.css */
```

### 3. Buttons
```css
/* OLD */
.sectionHeaderButton {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
  flex-shrink: 0;
  box-sizing: border-box;
  height: 28px;
}

/* NEW - Use utility classes */
.btn btn-outline btn-sm btn-icon
```

## Migration Checklist

### Phase 1: High-Impact Components
- [ ] ProfileTab.module.css
- [ ] UsersTab.module.css
- [ ] AuthForm.module.css
- [ ] Sidebar.module.css

### Phase 2: Feature Components
- [ ] Scorecard.module.css
- [ ] ProviderComparisonMatrix.module.css
- [ ] All other page-specific CSS files

### Phase 3: Component Libraries
- [ ] Buttons/buttons.css
- [ ] Overlays/SidePanel.module.css
- [ ] Navigation components

## Common Patterns to Replace

### 1. Custom Form Styling
```css
/* Replace with utility classes */
.form-group
.form-row
.form-input
.form-select
.form-label
```

### 2. Custom Card Styling
```css
/* Replace with utility classes */
.card
.panel
.widget
```

### 3. Custom Button Styling
```css
/* Replace with utility classes */
.btn
.btn-primary
.btn-secondary
.btn-outline
.btn-sm
.btn-lg
```

### 4. Custom Layout Styling
```css
/* Replace with utility classes */
.two-column-layout
.left-column
.right-column
.info-cards
.info-card
```

## Testing After Migration
1. **Visual regression** - Ensure components look the same
2. **Functionality** - Verify all interactions work
3. **Responsiveness** - Check mobile/tablet views
4. **Accessibility** - Verify color contrast and focus states

## Rollback Strategy
If issues arise:
1. Keep original CSS file as backup
2. Migrate component by component
3. Test thoroughly before removing old CSS
4. Use feature flags if needed

## Benefits of Migration
- **Consistency** across the entire application
- **Maintainability** - change once, updates everywhere
- **Performance** - reduced CSS bundle size
- **Developer Experience** - predictable styling patterns
- **Accessibility** - consistent focus states and contrast
