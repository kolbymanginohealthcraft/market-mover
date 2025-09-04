# Standardized Provider Tagging System

This directory contains the standardized provider tagging components that ensure consistent appearance and behavior across all pages in the application.

## Components

### ProviderTagBadge (Recommended)

The main standardized component that should be used for all provider tagging needs.

**Features:**
- Consistent styling across all pages
- Smart dropdown positioning (above/below based on available space)
- Multiple size and variant options
- Built-in accessibility features
- Consistent color scheme using global tag colors

**Props:**
```jsx
<ProviderTagBadge
  providerId={provider.dhc}           // Required: Provider identifier
  hasTeam={hasTeam}                   // Required: Whether user has team access
  teamLoading={false}                 // Optional: Team loading state
  primaryTag={getProviderTags(provider.dhc)[0]} // Optional: Current tag
  isSaving={false}                    // Optional: Tag operation in progress
  onAddTag={addTeamProviderTag}       // Required: Function to add tag
  onRemoveTag={removeTeamProviderTag} // Required: Function to remove tag
  size="medium"                       // Optional: 'small', 'medium', 'large'
  variant="default"                   // Optional: 'default', 'compact', 'inline'
  showRemoveOption={true}             // Optional: Show remove option in dropdown
  disabled={false}                    // Optional: Disable the component
  className=""                        // Optional: Additional CSS classes
/>
```

**Size Variants:**
- `small`: 20px height, 11px font
- `medium`: 24px height, 12px font (default)
- `large`: 28px height, 13px font

**Visual Variants:**
- `default`: Standard button/badge appearance
- `compact`: Centered text with minimum width
- `inline`: Transparent background for inline use

### InlineTagging (Legacy)

The previous tagging component. Still functional but being phased out in favor of ProviderTagBadge.

## Usage Examples

### Basic Usage (Provider Search)
```jsx
import { ProviderTagBadge } from '../../../components/Tagging/ProviderTagBadge';

<ProviderTagBadge
  providerId={provider.dhc}
  hasTeam={hasTeam}
  primaryTag={getProviderTags(provider.dhc)[0] || null}
  onAddTag={addTeamProviderTag}
  onRemoveTag={removeTeamProviderTag}
  size="medium"
  variant="default"
/>
```

### Compact Variant (Provider Listing)
```jsx
<ProviderTagBadge
  providerId={p.dhc}
  hasTeam={hasTeam}
  teamLoading={teamLoading}
  primaryTag={getPrimaryTag(p.dhc)}
  isSaving={addingTag || removingTag}
  onAddTag={handleAddTag}
  onRemoveTag={handleRemoveTag}
  size="medium"
  variant="compact"
  showRemoveOption={true}
/>
```

### Network List View
```jsx
<ProviderTagBadge
  providerId={provider.provider_dhc}
  hasTeam={hasTeam}
  teamLoading={false}
  primaryTag={provider.tags[0] || null}
  isSaving={removingTag}
  onAddTag={changeProviderTag}
  onRemoveTag={removeAllProviderTags}
  size="medium"
  variant="default"
  showRemoveOption={true}
/>
```

## Global Styling

The component uses CSS custom properties defined in `src/app/base.css`:

```css
:root {
  --tag-me-color: #265947;
  --tag-partner-color: #3599b8;
  --tag-competitor-color: #d64550;
  --tag-target-color: #f1b62c;
  --tag-default-color: #5f6b6d;
}
```

## Migration Guide

### From InlineTagging
Replace:
```jsx
<InlineTagging
  providerId={p.dhc}
  hasTeam={hasTeam}
  teamLoading={teamLoading}
  taggingProviderId={taggingProviderId}
  dropdownPosition={dropdownPosition}
  primaryTag={getPrimaryTag(p.dhc)}
  isSaving={addingTag || removingTag}
  onOpenDropdown={openTaggingDropdown}
  onCloseDropdown={closeTaggingDropdown}
  onAddTag={handleAddTag}
  onRemoveTag={handleRemoveTag}
/>
```

With:
```jsx
<ProviderTagBadge
  providerId={p.dhc}
  hasTeam={hasTeam}
  teamLoading={teamLoading}
  primaryTag={getPrimaryTag(p.dhc)}
  isSaving={addingTag || removingTag}
  onAddTag={handleAddTag}
  onRemoveTag={handleRemoveTag}
  size="medium"
  variant="compact"
/>
```

### From Custom Tag Implementation
Replace custom tag display logic with:
```jsx
<ProviderTagBadge
  providerId={provider.dhc}
  hasTeam={hasTeam}
  primaryTag={provider.tags[0] || null}
  onAddTag={handleAddTag}
  onRemoveTag={handleRemoveTag}
/>
```

## Benefits of Standardization

1. **Consistent Appearance**: All tag badges look the same across pages
2. **Unified Behavior**: Same dropdown positioning, hover effects, and interactions
3. **Maintainable**: Single source of truth for tag styling and behavior
4. **Accessible**: Built-in keyboard navigation and screen reader support
5. **Responsive**: Automatically adjusts positioning based on viewport
6. **Themeable**: Uses global CSS variables for easy theming

## Future Enhancements

- Bulk tagging operations
- Tag history and audit trail
- Custom tag colors per team
- Tag categories and sub-tags
- Tag analytics and reporting
