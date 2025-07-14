# Banner Component Usage

The Banner component provides a consistent, closable banner that can be used across all pages in the application. The styles are contained in a dedicated CSS module (`Banner.module.css`) for better organization and reusability.

## Basic Usage

```jsx
import Banner from '../../components/Banner';

// Simple banner with title and message
<Banner
  title="Welcome to the Future of Market Intelligence!"
  message="You're getting in on the ground floor of something special! We're thrilled to have you as an early adopter of Market Mover."
  icon="🚀"
  onClose={() => setShowBanner(false)}
/>
```

## Props

- `title` (string): The banner title
- `message` (string): The banner message/description
- `icon` (string, optional): Emoji or icon to display (default: "🚀")
- `onClose` (function, optional): Callback function when banner is closed
- `className` (string, optional): Additional CSS classes
- `children` (React nodes, optional): Custom content instead of title/message

## Advanced Usage

```jsx
// Custom content with children
<Banner icon="📊" onClose={handleClose}>
  <h3>Custom Title</h3>
  <p>Custom message with <strong>formatted</strong> content.</p>
  <button onClick={someAction}>Action Button</button>
</Banner>

// With custom styling
<Banner
  title="Custom Styled Banner"
  message="This banner has additional styling"
  className="custom-banner-class"
  onClose={handleClose}
/>
```

## CSS Module Styles

The banner styles are defined in `src/components/Banner.module.css` and include:

- `.banner`: Main banner container
- `.closeButton`: Close button styling
- `.icon`: Icon container
- `.content`: Content container
- `.content h3`: Title styling
- `.content p`: Message styling

## Responsive Design

The banner automatically adapts to mobile screens with:
- Reduced padding on smaller screens
- Column layout instead of row layout
- Smaller font sizes for better readability

## Migration from Old Banners

To migrate existing banners:

1. Import the Banner component
2. Replace the banner JSX with the Banner component
3. Remove the banner styles from the module CSS file
4. Update the close handler if needed

Example migration:
```jsx
// Before
{showBanner && (
  <div className={styles.comingSoonBanner}>
    <button className={styles.closeButton} onClick={handleCloseBanner}>×</button>
    <div className={styles.bannerIcon}>🚀</div>
    <div className={styles.bannerContent}>
      <h3>Title</h3>
      <p>Message</p>
    </div>
  </div>
)}

// After
<Banner
  title="Title"
  message="Message"
  icon="🚀"
  onClose={handleCloseBanner}
/>
```

## Pages Using Banners

The following pages currently use banners that can be migrated:
- Home (`/app/home`)
- Overview (`/app/overview`)
- Provider Listing (`/app/provider-listing`)
- Provider Density (`/app/provider-density`)
- Population (`/app/population`)
- Claims (`/app/claims`)
- Storyteller (`/app/storyteller`)
- MA Enrollment (`/app/ma-enrollment`) 