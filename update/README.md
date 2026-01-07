# Dashboard Template - Extracted from Ictus Flow

A modern, professional dashboard styling system built with Tailwind CSS, featuring a cohesive design language optimized for construction/enterprise applications.

## Quick Start

1. Copy this folder to your project
2. Install dependencies:
   ```bash
   npm install tailwindcss @tailwindcss/forms @tailwindcss/typography @heroicons/react
   ```
3. Import the main CSS in your app:
   ```js
   import './dashboard-template/styles/main.css'
   ```
4. Use the Tailwind config:
   ```js
   // tailwind.config.js
   module.exports = require('./dashboard-template/config/tailwind.config.js')
   ```

## Design System Overview

### Color Palette

| Color | Primary Use | CSS Class |
|-------|-------------|-----------|
| **Emerald** | Primary brand, CTAs, success states | `bg-emerald-600`, `text-emerald-600` |
| **Slate** | Secondary, text, backgrounds | `bg-slate-50`, `text-slate-700` |
| **Safety (Red)** | Errors, warnings, critical | `bg-safety-600`, `text-safety-600` |
| **Warning (Yellow)** | Warnings, attention | `bg-warning-500` |

### Key Color Values
```css
/* Primary */
--emerald-500: #10b981;
--emerald-600: #059669;
--emerald-700: #047857;

/* Secondary */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-600: #475569;
--slate-900: #0f172a;

/* Safety/Error */
--safety-500: #ef4444;
--safety-600: #dc2626;
```

## Typography

### Font Family
- **Primary**: Inter (sans-serif)
- **Fallback**: system-ui, -apple-system, sans-serif

### Text Sizes (Tailwind Classes)
```
text-display  → 42px, semibold (hero headings)
text-h1       → 32px, semibold (page titles)
text-h2       → 24px, semibold (section titles)
text-h3       → 18px, semibold (card titles)
text-body     → 15px, regular (paragraphs)
text-body-sm  → 14px, regular (secondary text)
text-caption  → 12px, medium (labels, meta)
text-label    → 11px, semibold (form labels)
text-metric   → 42px, semibold (large numbers)
text-metric-sm→ 28px, semibold (smaller metrics)
```

## Component Classes

### Buttons

```html
<!-- Primary (emerald) -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary -->
<button class="btn btn-secondary">Secondary</button>

<!-- Outline -->
<button class="btn btn-outline">Outline</button>

<!-- Outline Emerald -->
<button class="btn btn-outline-emerald">Outline Emerald</button>

<!-- Danger -->
<button class="btn btn-danger">Delete</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Cards

```html
<!-- Basic Card -->
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Actions</div>
</div>

<!-- Elevated Card -->
<div class="card card-elevated">...</div>

<!-- Glass Card -->
<div class="card-glass">...</div>

<!-- Premium Card -->
<div class="card-premium">...</div>
```

### Status Badges

```html
<span class="status-pending">Pending</span>
<span class="status-assigned">Assigned</span>
<span class="status-completed">Completed</span>
<span class="status-rejected">Rejected</span>
<span class="status-verified">Verified</span>
```

### Priority Badges

```html
<span class="priority-high">High</span>
<span class="priority-medium">Medium</span>
<span class="priority-low">Low</span>
```

### Form Elements

```html
<input type="text" class="form-input" placeholder="Enter text..." />
<input type="text" class="form-input form-input-error" /> <!-- Error state -->
<select class="form-select">...</select>
<textarea class="form-textarea"></textarea>
<input type="checkbox" class="form-checkbox" />
<input type="radio" class="form-radio" />
```

## Layout Patterns

### Dashboard Grid

```html
<div class="dashboard-grid">
  <div class="dashboard-main">
    <!-- Main content (3/4 width on desktop) -->
  </div>
  <div class="dashboard-sidebar">
    <!-- Sidebar (1/4 width on desktop) -->
  </div>
</div>
```

### Responsive Grid

```html
<!-- 1 col mobile → 2 cols tablet → 3 cols desktop -->
<div class="grid-responsive-3">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Navigation Tabs

```html
<nav class="border-b border-slate-200">
  <button class="nav-tab nav-tab-active">Active Tab</button>
  <button class="nav-tab nav-tab-inactive">Inactive Tab</button>
</nav>
```

## Animations

### Available Animation Classes

```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-in-up">Slides up</div>
<div class="animate-slide-in-right">Slides from right</div>
<div class="animate-bounce-gentle">Gentle bounce</div>
```

### Hover Effects

```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-lift-lg">Larger lift on hover</div>
<button class="btn btn-primary btn-glow">Glowing button</button>
```

### Loading States

```html
<!-- Spinner -->
<div class="spinner"></div>

<!-- Skeleton Loader -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-title"></div>
<div class="skeleton skeleton-avatar"></div>
```

## Gradients

```html
<div class="bg-gradient-emerald">Emerald gradient</div>
<div class="bg-gradient-slate">Slate gradient</div>
<div class="bg-gradient-safety">Red/safety gradient</div>
<div class="bg-gradient-premium">Premium purple gradient</div>
```

## Shadows

```html
<div class="shadow-soft">Soft shadow</div>
<div class="shadow-soft-lg">Large soft shadow</div>
<div class="shadow-glow">Glowing shadow</div>
<div class="shadow-emerald">Emerald-tinted shadow</div>
```

## Glass Effect

```html
<div class="glass">Light glass effect</div>
<div class="glass-dark">Dark glass effect</div>
```

## Example: Metric Card

```jsx
<div class="card p-6">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-caption text-slate-500 uppercase tracking-wide">
        Total Users
      </p>
      <p class="text-metric text-slate-900 mt-1">1,234</p>
      <p class="text-body-sm text-emerald-600 mt-2">
        +12% from last month
      </p>
    </div>
    <div class="p-3 bg-emerald-50 rounded-xl">
      <UsersIcon class="h-8 w-8 text-emerald-600" />
    </div>
  </div>
</div>
```

## Example: Dashboard Header

```jsx
<div class="mb-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-6 text-white shadow-lg">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <BuildingOfficeIcon class="h-12 w-12 text-white" />
      <div>
        <h2 class="text-h2 font-semibold text-white">Company Dashboard</h2>
        <p class="text-body-sm text-slate-300 mt-1">
          5 projects, 24 team members
        </p>
      </div>
    </div>
    <div class="bg-safety-600/20 px-3 py-2 rounded-lg border border-safety-500/30">
      <div class="text-metric-sm font-semibold">3</div>
      <div class="text-caption text-slate-300 uppercase">Critical Issues</div>
    </div>
  </div>
</div>
```

## File Structure

```
dashboard-template/
├── config/
│   └── tailwind.config.js      # Tailwind configuration with theme
├── styles/
│   └── main.css                # All CSS classes (1000+ lines)
├── design-system/
│   ├── brand.js                # Brand tokens & configuration
│   └── components/
│       ├── Button.js           # Design system button
│       ├── Card.js             # Card variants
│       └── Badge.js            # Badge variants
├── components/
│   ├── navigation/
│   │   └── NavigationBar.js    # Top navigation bar
│   ├── common/
│   │   ├── Toast.js            # Toast notifications
│   │   ├── LoadingSpinner.js   # Loading spinner
│   │   └── EmptyState.js       # Empty state display
│   ├── ui/
│   │   ├── MetricCard.js       # Metric display card
│   │   └── Button.js           # UI button
│   └── analytics/
│       └── CompanyOverviewDashboard.js
└── examples/
    └── CompanyAdminInterface.js # Full dashboard example
```

## Responsive Breakpoints

| Breakpoint | Size | Usage |
|------------|------|-------|
| `xs` | 475px | Small phones |
| `sm` | 640px | Phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

## Dependencies

- **Tailwind CSS** ^3.4.0
- **@tailwindcss/forms** ^0.5.0
- **@tailwindcss/typography** ^0.5.0
- **@heroicons/react** ^2.0.0 (for icons)

## Tips

1. **Consistent Spacing**: Use Tailwind's spacing scale (p-4, p-6, gap-4, etc.)
2. **Color Usage**: Emerald for primary actions, Slate for secondary, Safety for errors
3. **Typography**: Use the custom text-* classes for consistent sizing
4. **Cards**: Always use rounded corners (rounded-lg) and subtle shadows
5. **Hover States**: Add hover-lift or transition classes for interactivity
6. **Mobile First**: Design mobile-first, then add responsive modifiers

## License

Extracted from Ictus Flow. Use freely in your projects.
