# Xion Dashboard Design System

A modern, dark-themed crypto/Web3 design system with sophisticated glassmorphic aesthetics, built with pure CSS and optimized for GitHub Pages.

## Features

- **Pure CSS Implementation** - No build process or complex frameworks required
- **GitHub Pages Ready** - Works directly without any compilation
- **Glassmorphic Design** - Modern backdrop-filter effects with semi-transparent surfaces
- **AkkuratLL Font System** - Professional typography with multiple weights
- **Comprehensive Components** - Buttons, forms, cards, modals, badges, and more
- **Dark Theme Optimized** - Built for Web3/crypto applications
- **Responsive Design** - Mobile-first approach with proper breakpoints
- **CSS Variables** - Easy customization through CSS custom properties

## Quick Start

1. Include the design system CSS in your HTML:
```html
<link rel="stylesheet" href="xion-design-system.css">
```

2. Use the provided component classes:
```html
<!-- Button Examples -->
<button class="ui-button ui-button-primary">Primary Button</button>
<button class="ui-button ui-button-outlined">Outlined Button</button>

<!-- Card Example -->
<div class="ui-card">
    <h3 class="ui-heading-3">Card Title</h3>
    <p class="ui-text-secondary">Card content goes here</p>
</div>

<!-- Input Example -->
<div class="ui-input-group">
    <input type="text" class="ui-input" placeholder=" " id="name">
    <label class="ui-input-label" for="name">Your Name</label>
</div>
```

## Component Classes

### Typography
- `ui-heading-1`, `ui-heading-2`, `ui-heading-3` - Headings
- `ui-nav-text` - Navigation text (uppercase)
- `ui-body-text` - Regular body text
- `ui-small-text` - Small text
- `ui-text-secondary` - Secondary/muted text
- `ui-gradient-text` - Gradient text effect

### Buttons
- `ui-button` - Base button class
- `ui-button-primary` - Primary white button
- `ui-button-outlined` - Outlined transparent button
- `ui-button-naked` - Underlined text button
- `ui-button-destructive` - Red destructive button
- `ui-button-destructive-outline` - Red outlined button

### Panels & Cards
- `ui-glass-panel` - Light glassmorphic panel
- `ui-glass-panel-dark` - Dark glassmorphic panel
- `ui-card` - Standard card component

### Forms
- `ui-input-group` - Container for input with floating label
- `ui-input` - Input field
- `ui-input-label` - Floating label
- `ui-input-error` - Error state
- `ui-input-error-message` - Error message

### Badges
- `ui-badge` - Base badge
- `ui-badge-success` - Green success badge
- `ui-badge-warning` - Yellow warning badge
- `ui-badge-testnet` - Orange testnet badge
- `ui-badge-error` - Red error badge

### Modals
- `ui-modal-overlay` - Modal backdrop
- `ui-modal-content` - Modal content container
- `ui-modal-header` - Modal title
- `ui-modal-close` - Close button

### Navigation
- `ui-nav` - Navigation bar
- `ui-nav-container` - Nav content container
- `ui-nav-brand` - Brand/logo text
- `ui-nav-menu` - Menu container
- `ui-nav-link` - Navigation link

### Utilities
- `ui-container` - Max-width container
- `ui-flex` - Flexbox container
- `ui-flex-center` - Centered flex container
- `ui-gap-{xs|sm|md|lg|xl|2xl}` - Gap utilities
- `ui-mt-{xs|sm|md|lg|xl}` - Margin top
- `ui-mb-{xs|sm|md|lg|xl}` - Margin bottom
- `ui-p-{xs|sm|md|lg|xl|2xl}` - Padding
- `ui-noise-overlay` - Noise texture overlay effect
- `ui-spinner` - Loading spinner
- `ui-spinner-small` - Small spinner

## CSS Variables

The design system uses CSS custom properties for easy customization:

```css
:root {
    /* Base Colors */
    --xion-background: #121212;
    --xion-primary-text: #FFFFFF;
    --xion-secondary-text: #8D8D8D;
    --xion-border: hsla(0, 0%, 100%, 0.2);
    --xion-border-focus: #8D8D8D;
    
    /* Semantic Colors */
    --xion-destructive: #D74506;
    --xion-warning: #E8B931;
    --xion-success: #CAF033;
    --xion-testnet: #FFAA4A;
    
    /* Typography */
    --xion-font-family: "AkkuratLL", sans-serif;
    
    /* Spacing */
    --xion-spacing-xs: 0.25rem;
    --xion-spacing-sm: 0.5rem;
    --xion-spacing-md: 1rem;
    --xion-spacing-lg: 1.5rem;
    --xion-spacing-xl: 2rem;
    --xion-spacing-2xl: 3rem;
    --xion-spacing-3xl: 4rem;
    
    /* And more... */
}
```

## Files

- `xion-design-system.css` - Complete design system
- `design-showcase.html` - Interactive component showcase
- `fonts/` - AkkuratLL web fonts (woff2 format)

## Browser Support

- Modern browsers with backdrop-filter support
- Chrome 76+
- Firefox 103+
- Safari 9+
- Edge 79+

## License

This design system is part of the Xion Dashboard project.