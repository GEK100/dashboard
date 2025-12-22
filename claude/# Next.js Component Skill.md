# Next.js Component Skill

## CRITICAL: When to Use This Skill

**READ THIS SKILL BEFORE:**
- Creating ANY new component file (`.tsx` files)
- Modifying ANY existing component
- Creating UI elements, pages, layouts, or features
- Writing React code
- ANY task involving components or UI in this Next.js project

**DO NOT skip this skill.** These patterns are mandatory for all component work.

## Overview
This skill defines best practices for creating React components in Next.js with TypeScript and Tailwind CSS.

## File Structure and Naming

### Component Location
- Place components in `/src/components/` with subfolders by category
- Common categories:
  - `/src/components/layout/` - Headers, Footers, Sidebars, Containers
  - `/src/components/ui/` - Buttons, Inputs, Cards, Badges, Modals
  - `/src/components/forms/` - Form components, field groups, validation displays
  - `/src/components/features/` - Feature-specific components (e.g., UserProfile, ProductCard)
  - `/src/components/shared/` - Reusable components that don't fit other categories

### File Naming
- Use PascalCase for all component files: `UserProfile.tsx`
- One component per file
- If a component needs supporting files, create a folder:
  ```
  /src/components/features/UserProfile/
  ├── UserProfile.tsx
  ├── UserAvatar.tsx
  ├── UserStats.tsx
  └── index.ts (exports UserProfile)
  ```

## Next.js Client vs Server Components

### Server Components (Default)
- Server components are the default in Next.js App Router
- Use for:
  - Components that fetch data
  - Components that don't need interactivity
  - Components that don't use hooks (useState, useEffect, etc.)
- NO `"use client"` directive needed
- Example:
  ```tsx
  export default function BlogPost({ id }: { id: string }) {
    // Can fetch data directly
    return <article>...</article>;
  }
  ```

### Client Components
- Add `"use client"` at the top of file when component needs:
  - State (useState)
  - Effects (useEffect)
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)
  - React hooks
- Example:
  ```tsx
  "use client";
  
  import { useState } from "react";
  
  export default function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(count + 1)}>{count}</button>;
  }
  ```

**Rule of thumb**: Start with server components, only add `"use client"` when you need interactivity.

## Component Template

### Basic Functional Component
```tsx
interface ComponentNameProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export default function ComponentName({ 
  title, 
  description,
  onAction 
}: ComponentNameProps) {
  return (
    <div className="component-container">
      <h2 className="text-2xl font-bold">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
      {onAction && (
        <button onClick={onAction} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Click Me
        </button>
      )}
    </div>
  );
}
```

### Client Component with State
```tsx
"use client";

import { useState } from "react";

interface InteractiveComponentProps {
  initialValue?: number;
  onChange?: (value: number) => void;
}

export default function InteractiveComponent({ 
  initialValue = 0,
  onChange 
}: InteractiveComponentProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="p-4 border rounded">
      <p>Value: {value}</p>
      <button 
        onClick={() => handleChange(value + 1)}
        className="px-3 py-1 bg-green-500 text-white rounded"
      >
        Increment
      </button>
    </div>
  );
}
```

## TypeScript Props

### Always Define Props Interface
- Create an interface above the component
- Name it `ComponentNameProps`
- Use optional properties with `?` when appropriate
- Provide default values in destructuring when sensible

```tsx
interface ButtonProps {
  text: string;              // required
  variant?: "primary" | "secondary"; // optional with specific values
  disabled?: boolean;        // optional
  onClick?: () => void;      // optional function
  className?: string;        // optional for additional classes
}

export default function Button({ 
  text, 
  variant = "primary",
  disabled = false,
  onClick,
  className = ""
}: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded ${variant === "primary" ? "bg-blue-500" : "bg-gray-500"} ${className}`}
    >
      {text}
    </button>
  );
}
```

### Props for Children
```tsx
interface CardProps {
  title: string;
  children: React.ReactNode; // for nested content
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="border rounded p-4">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
```

## Tailwind CSS Styling

### Core Principles
- Use Tailwind utility classes directly in `className`
- Group related utilities: spacing together, colors together, etc.
- Use conditional classes for variants
- Keep frequently-used combinations consistent

### Class Organization
```tsx
// Good: Organized and readable
<div className="
  flex items-center justify-between
  p-4 m-2
  bg-white border border-gray-200 rounded-lg
  hover:shadow-md transition-shadow
">

// Avoid: Random order
<div className="hover:shadow-md p-4 flex bg-white border-gray-200 items-center rounded-lg m-2 border transition-shadow justify-between">
```

### Conditional Styling
```tsx
interface AlertProps {
  type: "success" | "error" | "warning";
  message: string;
}

export default function Alert({ type, message }: AlertProps) {
  const bgColor = {
    success: "bg-green-100 border-green-500 text-green-700",
    error: "bg-red-100 border-red-500 text-red-700",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-700"
  }[type];

  return (
    <div className={`border-l-4 p-4 ${bgColor}`}>
      <p>{message}</p>
    </div>
  );
}
```

### Responsive Design
```tsx
export default function Hero() {
  return (
    <div className="
      grid grid-cols-1 gap-4
      md:grid-cols-2 md:gap-6
      lg:grid-cols-3 lg:gap-8
    ">
      {/* Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px) */}
    </div>
  );
}
```

### Allowing Additional Classes
```tsx
interface ComponentProps {
  className?: string; // Accept extra classes from parent
}

export default function Component({ className = "" }: ComponentProps) {
  return (
    <div className={`base-classes ${className}`}>
      {/* className allows parent to add extra styling */}
    </div>
  );
}
```

## Common Patterns

### Loading States
```tsx
"use client";

import { useState } from "react";

export default function DataFetcher() {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <div>Content</div>;
}
```

### Error Handling
```tsx
"use client";

import { useState } from "react";

export default function Form() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {/* form content */}
    </div>
  );
}
```

### Lists and Mapping
```tsx
interface Item {
  id: string;
  name: string;
}

interface ListProps {
  items: Item[];
}

export default function ItemList({ items }: ListProps) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="p-2 border rounded">
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

## Accessibility

### Always Include
- Semantic HTML (`<button>` not `<div onClick>`)
- Alt text for images
- Labels for form inputs
- ARIA attributes when needed

```tsx
export default function ImageCard({ src, alt, title }: { src: string; alt: string; title: string }) {
  return (
    <article className="border rounded p-4">
      <img src={src} alt={alt} className="w-full h-48 object-cover rounded" />
      <h3 className="text-lg font-bold mt-2">{title}</h3>
    </article>
  );
}
```

## Imports

### Order of Imports
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Types/Interfaces (if in separate files)
5. Utilities/helpers

```tsx
// 1. Framework
import { useState } from "react";
import Link from "next/link";

// 2. Third-party
import { formatDate } from "date-fns";

// 3. Local components
import Button from "@/components/ui/Button";

// 4. Types
import type { User } from "@/types";
```

## Export Pattern
- Use `export default` for the main component
- Use named exports for helper components in the same file
- Create `index.ts` barrel exports for component folders

```tsx
// UserProfile.tsx
export default function UserProfile() { ... }

// index.ts in UserProfile folder
export { default } from "./UserProfile";
```

## Summary Checklist

When creating a component, ensure:
- ✅ File is in appropriate subfolder with PascalCase name
- ✅ `"use client"` directive if using state/effects/handlers
- ✅ TypeScript interface defined for props
- ✅ Tailwind classes organized logically
- ✅ Proper semantic HTML
- ✅ Accessibility attributes included
- ✅ Responsive design considered
- ✅ Error states handled (if applicable)
- ✅ Loading states handled (if applicable)

## MANDATORY: Before Writing Any Component Code

**STOP AND VERIFY:**

Before writing a single line of component code, Claude MUST:

1. **Confirm skill was read**: State "Following Next.js Component Skill patterns"
2. **Declare component type**: State whether this will be a Server or Client Component
3. **Declare file location**: State the exact file path being created
4. **List props**: State what props the component will accept

**Example confirmation:**
```
Following Next.js Component Skill patterns:
- Type: Client Component (uses useState)
- Location: /src/components/ui/Button.tsx
- Props: text (string), onClick (function), variant (optional)
```

This confirmation ensures the skill was actually read and patterns will be followed.

If Claude creates a component without this confirmation, it has NOT read the skill properly.

## How to Enforce This Skill

**In your prompts to Claude Code, include:**
- "Follow the component skill"
- "Use the patterns from the Next.js component skill"
- "Read the component skill first"

**If Claude deviates from patterns:**
- Point out the specific violation
- Ask Claude to regenerate following the skill
- Reference the exact section of the skill that was violated