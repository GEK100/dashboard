# Dashboard Style Quick Reference

## Color Classes

### Emerald (Primary)
```
bg-emerald-50   → #ecfdf5 (lightest)
bg-emerald-100  → #d1fae5
bg-emerald-500  → #10b981 (main)
bg-emerald-600  → #059669 (buttons)
bg-emerald-700  → #047857 (hover)
text-emerald-600 → Primary text
```

### Slate (Secondary)
```
bg-slate-50     → #f8fafc (page bg)
bg-slate-100    → #f1f5f9 (card bg)
bg-slate-200    → #e2e8f0 (borders)
bg-slate-600    → #475569
bg-slate-700    → #334155
bg-slate-800    → #1e293b (dark headers)
bg-slate-900    → #0f172a (darkest)
text-slate-500  → Muted text
text-slate-600  → Secondary text
text-slate-900  → Primary text
```

### Safety (Red/Danger)
```
bg-safety-50    → Light red bg
bg-safety-500   → #ef4444
bg-safety-600   → #dc2626 (danger buttons)
text-safety-600 → Error text
```

### Warning (Yellow)
```
bg-warning-50   → Light yellow bg
bg-warning-500  → #f59e0b
text-warning-600 → Warning text
```

## Button Classes

| Class | Description |
|-------|-------------|
| `btn` | Base button styles |
| `btn-primary` | Emerald background |
| `btn-secondary` | Slate background |
| `btn-success` | Green background |
| `btn-warning` | Yellow background |
| `btn-danger` | Red background |
| `btn-outline` | Transparent with border |
| `btn-outline-emerald` | Emerald outline |
| `btn-premium` | Gradient purple |
| `btn-sm` | Small size |
| `btn-lg` | Large size |
| `btn-xl` | Extra large |
| `btn-glow` | Glowing effect |

## Card Classes

| Class | Description |
|-------|-------------|
| `card` | Base card with bg, shadow, rounded |
| `card-elevated` | More prominent shadow |
| `card-header` | Card header section |
| `card-body` | Card body section |
| `card-footer` | Card footer section |
| `card-premium` | Premium gradient card |
| `card-glass` | Frosted glass effect |
| `card-hover` | Hover lift effect |

## Status Classes

| Class | Color | Use For |
|-------|-------|---------|
| `status-pending` | Yellow | Awaiting action |
| `status-assigned` | Blue | Assigned to someone |
| `status-completed` | Green | Done |
| `status-rejected` | Red | Rejected/failed |
| `status-verified` | Emerald | Verified/approved |

## Priority Classes

| Class | Color |
|-------|-------|
| `priority-high` | Red |
| `priority-medium` | Yellow |
| `priority-low` | Green |

## Form Classes

| Class | Description |
|-------|-------------|
| `form-input` | Text input styling |
| `form-input-error` | Error state input |
| `form-select` | Select dropdown |
| `form-textarea` | Textarea |
| `form-checkbox` | Checkbox |
| `form-radio` | Radio button |

## Layout Classes

| Class | Description |
|-------|-------------|
| `dashboard-grid` | Main dashboard grid (4 cols) |
| `dashboard-main` | Main content area (3 cols) |
| `dashboard-sidebar` | Sidebar (1 col) |
| `grid-responsive` | 1→2→4 columns |
| `grid-responsive-2` | 1→2 columns |
| `grid-responsive-3` | 1→2→3 columns |

## Navigation Classes

| Class | Description |
|-------|-------------|
| `nav-tab` | Tab button base |
| `nav-tab-active` | Active tab |
| `nav-tab-inactive` | Inactive tab |

## Animation Classes

| Class | Effect |
|-------|--------|
| `animate-fade-in` | Fade in |
| `animate-slide-in-up` | Slide up |
| `animate-slide-in-right` | Slide from right |
| `animate-bounce-gentle` | Subtle bounce |

## Utility Classes

| Class | Effect |
|-------|--------|
| `hover-lift` | Lift on hover (-2px) |
| `hover-lift-lg` | Larger lift (-4px) |
| `glass` | Light frosted glass |
| `glass-dark` | Dark frosted glass |
| `shadow-soft` | Soft shadow |
| `shadow-soft-lg` | Large soft shadow |
| `shadow-glow` | Glowing shadow |
| `shadow-emerald` | Emerald tinted shadow |

## Gradient Classes

| Class | Direction |
|-------|-----------|
| `bg-gradient-emerald` | Emerald 135° |
| `bg-gradient-slate` | Slate 135° |
| `bg-gradient-safety` | Red 135° |
| `bg-gradient-premium` | Purple 135° |

## Skeleton Loaders

| Class | Shape |
|-------|-------|
| `skeleton` | Base shimmer |
| `skeleton-text` | Text line |
| `skeleton-title` | Title line |
| `skeleton-avatar` | Circle |

## Common Patterns

### Page Container
```html
<div class="min-h-screen bg-slate-50">
  <NavigationBar />
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- content -->
  </div>
</div>
```

### Section Header
```html
<div class="flex items-center justify-between mb-6">
  <h2 class="text-h2 text-slate-900">Section Title</h2>
  <button class="btn btn-primary">Action</button>
</div>
```

### Stat Card
```html
<div class="card p-6">
  <p class="text-caption text-slate-500 uppercase">Label</p>
  <p class="text-metric text-slate-900">1,234</p>
  <p class="text-body-sm text-emerald-600">+12%</p>
</div>
```

### Data Table
```html
<table class="table">
  <thead class="table-header">
    <tr>
      <th class="table-cell">Column</th>
    </tr>
  </thead>
  <tbody class="table-body">
    <tr class="table-row">
      <td class="table-cell">Data</td>
    </tr>
  </tbody>
</table>
```

### Modal
```html
<div class="modal-overlay">
  <div class="modal-container">
    <div class="modal-content">
      <div class="modal-header">Title</div>
      <div class="modal-body">Content</div>
      <div class="modal-footer">Actions</div>
    </div>
  </div>
</div>
```

## Icon Sizes (Heroicons)

| Context | Class |
|---------|-------|
| Inline text | `h-4 w-4` |
| Buttons | `h-5 w-5` |
| Cards | `h-6 w-6` |
| Features | `h-8 w-8` |
| Heroes | `h-12 w-12` |

## Spacing Scale

| Class | Value |
|-------|-------|
| `p-1`, `m-1` | 0.25rem (4px) |
| `p-2`, `m-2` | 0.5rem (8px) |
| `p-3`, `m-3` | 0.75rem (12px) |
| `p-4`, `m-4` | 1rem (16px) |
| `p-6`, `m-6` | 1.5rem (24px) |
| `p-8`, `m-8` | 2rem (32px) |
| `gap-4` | 1rem between items |
| `gap-6` | 1.5rem between items |

## Border Radius

| Class | Value |
|-------|-------|
| `rounded` | 0.5rem |
| `rounded-lg` | 0.75rem (cards) |
| `rounded-xl` | 0.875rem |
| `rounded-2xl` | 1rem |
| `rounded-full` | 50% (avatars) |
